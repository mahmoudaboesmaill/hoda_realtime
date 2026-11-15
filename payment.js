"use strict";

if (typeof SITE !== "undefined" && typeof SITE.applyHeader === "function") {
  SITE.applyHeader();
}

const config =
  typeof SITE !== "undefined" && typeof SITE.getConfig === "function"
    ? SITE.getConfig()
    : typeof SITE_CONFIG !== "undefined"
    ? SITE_CONFIG
    : {};
const payments = config.payments || {};

const paymentMethods = [
  {
    data: payments.instapay,
    className: "logo-instapay",
    logoImg: "instapay_logo.png"
  },
  {
    data: payments.vodafoneCash,
    className: "logo-vodafone",
    logoImg: "vodafone_cash_logo.png"
  },
  {
    data: payments.vodafoneCash2,
    className: "logo-vodafone",
    logoImg: "vodafone_cash_logo.png"
  },
  {
    data: payments.cibBank,
    className: "logo-bank",
    logoImg: "cib_bank_logo.png"
  }
];

let toastTimer;
let activeCibCleanup = null;

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toastText");
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), duration);
}

function fallbackCopy(text) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.className = "clipboard-helper";
  document.body.appendChild(helper);
  helper.select();
  helper.setSelectionRange(0, helper.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    helper.remove();
  }

  if (!copied) throw new Error("Clipboard fallback failed");
}

async function writeToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_error) {
      // ننتقل للبديل أدناه إذا رفض المتصفح
    }
  }

  try {
    fallbackCopy(text);
    return true;
  } catch (_e) {
    return false;
  }
}

async function copyText(text, button, defaultLabel) {
  if (!text || text.includes("اكتب")) {
    showToast("عذراً، لم يتم تحديد الرقم بعد");
    return;
  }

  const label = button.querySelector(".btn-label");
  const restoreLabel = defaultLabel || "نسخ الرقم";

  const success = await writeToClipboard(text);
  if (success) {
    button.classList.add("copied");
    if (label) label.textContent = "تم النسخ";
    showToast("تم نسخ البيانات إلى الحافظة ✓");

    window.setTimeout(() => {
      button.classList.remove("copied");
      if (label) label.textContent = restoreLabel;
    }, 2000);
  } else {
    showToast("تعذر النسخ تلقائياً؛ يمكنك نسخه يدوياً");
    window.prompt("انسخ الرقم يدوياً:", text);
  }
}

/**
 * فحص نوع الجهاز والمنصة (Android / iOS / Desktop) بشكل معياري وقابل للاختبار
 */
function getDeviceContext(env) {
  const ua =
    env && typeof env.userAgent === "string"
      ? env.userAgent
      : typeof navigator !== "undefined" && navigator.userAgent
      ? navigator.userAgent
      : "";
  const platformName =
    env && typeof env.platform === "string"
      ? env.platform
      : typeof navigator !== "undefined" && navigator.platform
      ? navigator.platform
      : "";
  const maxTouchPoints =
    env && typeof env.maxTouchPoints === "number"
      ? env.maxTouchPoints
      : typeof navigator !== "undefined" && typeof navigator.maxTouchPoints === "number"
      ? navigator.maxTouchPoints
      : 0;

  const isAndroid = /Android/i.test(ua);
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (platformName === "MacIntel" && maxTouchPoints > 1);

  const hasTouchStart =
    env && typeof env.hasTouchStart === "boolean"
      ? env.hasTouchStart
      : typeof window !== "undefined" && "ontouchstart" in window;
  const isTouch = hasTouchStart || maxTouchPoints > 0;

  const isSmallScreen =
    env && typeof env.isSmallScreen === "boolean"
      ? env.isSmallScreen
      : typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(max-width: 768px)").matches;

  const isMobile = isAndroid || isIOS || Boolean(isTouch && isSmallScreen);
  const platform = isAndroid ? "android" : isIOS ? "ios" : "desktop";

  return { platform, isAndroid, isIOS, isMobile };
}

/**
 * تحديد خطة التنقل والبديل لزر CIB InstaPay حسب المنصة
 */
function resolveCibNavigationPlan(payment, deviceContext) {
  const ctx = deviceContext || getDeviceContext();
  const safePayment = payment || {};
  const appStoreUrl =
    safePayment.appStoreUrl ||
    "https://apps.apple.com/eg/app/instapay-egypt/id1592108795";
  const playStoreUrl =
    safePayment.playStoreUrl ||
    "https://play.google.com/store/apps/details?id=com.egyptianbanks.instapay";

  if (ctx.isAndroid) {
    return {
      platform: "android",
      shouldNavigate: Boolean(safePayment.appUrl),
      targetUrl: safePayment.appUrl || "",
      fallbackStoreUrl: playStoreUrl,
      playStoreUrl,
      appStoreUrl,
      requiresVisibilityCheck: false
    };
  }

  if (ctx.isIOS) {
    return {
      platform: "ios",
      shouldNavigate: true,
      targetUrl: safePayment.iosAppUrl || "ipn://open",
      fallbackStoreUrl: appStoreUrl,
      playStoreUrl,
      appStoreUrl,
      requiresVisibilityCheck: true
    };
  }

  return {
    platform: "desktop",
    shouldNavigate: false,
    targetUrl: "",
    fallbackStoreUrl: appStoreUrl,
    playStoreUrl,
    appStoreUrl,
    requiresVisibilityCheck: false
  };
}

/**
 * إخفاء منطقة البديل التفاعلي داخل بطاقة الدفع
 */
function hideCibFallback(cardElement) {
  if (!cardElement || typeof cardElement.querySelector !== "function") return;
  const fallbackBox = cardElement.querySelector(".payment-fallback");
  if (fallbackBox) {
    fallbackBox.hidden = true;
  }
}

/**
 * عرض رسالة ثابتة وإجراء تفاعلي واضح وقابل للوصول بلوحة المفاتيح وقارئ الشاشة
 */
function renderCibFallback(cardElement, options = {}) {
  if (!cardElement || typeof cardElement.querySelector !== "function") return null;

  let fallbackBox = cardElement.querySelector(".payment-fallback");
  const doc = cardElement.ownerDocument || (typeof document !== "undefined" ? document : null);

  if (!fallbackBox && doc && typeof doc.createElement === "function") {
    fallbackBox = doc.createElement("div");
    fallbackBox.className = "payment-fallback";
    fallbackBox.setAttribute("role", "region");
    fallbackBox.setAttribute("aria-live", "polite");

    const textP = doc.createElement("p");
    textP.className = "payment-fallback-text";
    const actionsDiv = doc.createElement("div");
    actionsDiv.className = "payment-fallback-actions";

    fallbackBox.appendChild(textP);
    fallbackBox.appendChild(actionsDiv);
    cardElement.appendChild(fallbackBox);
  }

  if (!fallbackBox) return null;

  const textEl = fallbackBox.querySelector(".payment-fallback-text");
  const actionsEl = fallbackBox.querySelector(".payment-fallback-actions");

  const accountText = options.account ? ` (${options.account})` : "";
  if (textEl) {
    if (options.mode === "ios") {
      textEl.textContent = options.copied
        ? `تم نسخ رقم الحساب${accountText} ✓ — إذا لم يفتح تطبيق إنستاباي تلقائياً، يمكنك فتحه أو تنزيله من App Store:`
        : `رقم الحساب${accountText} — تعذر فتح تطبيق إنستاباي تلقائياً، يمكنك فتحه أو تنزيله من App Store:`;
    } else {
      textEl.textContent = options.copied
        ? `تم نسخ رقم الحساب${accountText} ✓ — تطبيق إنستاباي يعمل على الهواتف الذكية (Android و iOS):`
        : `رقم الحساب${accountText} — تطبيق إنستاباي يعمل على الهواتف الذكية (يرجى نسخ الرقم يدوياً):`;
    }
  }

  if (actionsEl && doc && typeof doc.createElement === "function") {
    actionsEl.innerHTML = "";

    if (options.mode === "ios" && options.appStoreUrl) {
      const storeLink = doc.createElement("a");
      storeLink.className = "btn btn-fallback-store";
      storeLink.href = options.appStoreUrl;
      storeLink.target = "_blank";
      storeLink.rel = "noopener noreferrer";
      storeLink.setAttribute("aria-label", "فتح أو تنزيل تطبيق إنستاباي من App Store");
      storeLink.textContent = "فتح إنستاباي في App Store";
      actionsEl.appendChild(storeLink);
    } else if (options.mode === "desktop") {
      if (options.playStoreUrl) {
        const playLink = doc.createElement("a");
        playLink.className = "btn btn-fallback-store";
        playLink.href = options.playStoreUrl;
        playLink.target = "_blank";
        playLink.rel = "noopener noreferrer";
        playLink.setAttribute("aria-label", "تنزيل تطبيق إنستاباي للأندرويد من Google Play");
        playLink.textContent = "تطبيق إنستاباي (Google Play)";
        actionsEl.appendChild(playLink);
      }
      if (options.appStoreUrl) {
        const iosLink = doc.createElement("a");
        iosLink.className = "btn btn-fallback-store";
        iosLink.href = options.appStoreUrl;
        iosLink.target = "_blank";
        iosLink.rel = "noopener noreferrer";
        iosLink.setAttribute("aria-label", "تنزيل تطبيق إنستاباي للآيفون من App Store");
        iosLink.textContent = "تطبيق إنستاباي (App Store)";
        actionsEl.appendChild(iosLink);
      }
    }
  }

  fallbackBox.hidden = false;
  if (typeof fallbackBox.removeAttribute === "function") {
    fallbackBox.removeAttribute("hidden");
  }
  return fallbackBox;
}

/**
 * تنظيف أي مستمع أو مؤقت معلق لمحاولة فتح إنستاباي السابقة
 */
function cleanupActiveCibAttempt() {
  if (typeof activeCibCleanup === "function") {
    const fn = activeCibCleanup;
    activeCibCleanup = null;
    fn();
  }
}

/**
 * معالجة زر فتح إنستاباي لحساب بنك CIB:
 * 1. استدعاء event.preventDefault() بشكل متزامن قبل أي await لمنع فتح intent بالخطأ.
 * 2. نسخ رقم الحساب مع الحفاظ على fallback النسخ اليدوي.
 * 3. تنفيذ التنقل المناسب يدويًا مرة واحدة فقط حسب المنصة (Android / iOS / Desktop).
 * 4. تنظيف جميع مستمعات visibilitychange والمؤقتات بعد انتهاء المحاولة.
 */
async function handleCibInstaPayClick(event, payment, options = {}) {
  // 1. منع الانتقال الافتراضي بشكل متزامن قبل أي عملية غير متزامنة (await)
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }

  // تنظيف أي محاولة سابقة معلقة
  cleanupActiveCibAttempt();

  const safePayment = payment || {};
  const deviceContext = options.deviceContext || getDeviceContext(options.env);
  const plan = resolveCibNavigationPlan(safePayment, deviceContext);

  const copyFn = options.copyFn || writeToClipboard;
  const promptFn =
    options.promptFn !== undefined
      ? options.promptFn
      : typeof window !== "undefined" && typeof window.prompt === "function"
      ? (msg, val) => window.prompt(msg, val)
      : null;
  const navigate =
    options.navigate ||
    ((url) => {
      window.location.href = url;
    });
  const notify = options.notify || showToast;
  const doc =
    options.document || (typeof document !== "undefined" ? document : null);
  const setTimer =
    options.setTimeout || ((fn, ms) => window.setTimeout(fn, ms));
  const clearTimer =
    options.clearTimeout || ((id) => window.clearTimeout(id));
  const fallbackDelayMs =
    typeof options.fallbackDelayMs === "number" ? options.fallbackDelayMs : 2000;
  const cardElement =
    options.cardElement ||
    (event &&
    event.currentTarget &&
    typeof event.currentTarget.closest === "function"
      ? event.currentTarget.closest(".payment-card")
      : null);

  // 2. نسخ رقم الحساب مع الحفاظ على البديل اليدوي دون كسر التنقل
  let copied = false;
  if (safePayment.account) {
    try {
      copied = Boolean(await copyFn(safePayment.account));
    } catch (_err) {
      copied = false;
    }

    if (!copied && typeof promptFn === "function") {
      try {
        promptFn("انسخ رقم الحساب يدوياً:", safePayment.account);
      } catch (_promptErr) {
        // تجاهل خطأ نافذة النسخ اليدوي
      }
    }
  }

  // 3. على سطح المكتب: لا نفتح intent أو ipn، ونعرض إرشادات واضحة مع روابط المتاجر الاختيارية
  if (plan.platform === "desktop") {
    renderCibFallback(cardElement, {
      mode: "desktop",
      account: safePayment.account,
      copied,
      appStoreUrl: plan.appStoreUrl,
      playStoreUrl: plan.playStoreUrl
    });

    notify(
      copied
        ? `تم نسخ رقم الحساب (${safePayment.account}) ✓ — تطبيق إنستاباي متاح على الهاتف`
        : `تطبيق إنستاباي متاح على الهاتف — يرجى نسخ رقم الحساب (${safePayment.account}) يدوياً`,
      4000
    );

    return {
      platform: "desktop",
      copied,
      navigated: false,
      targetUrl: null
    };
  }

  // 4. على أندرويد: نفتح رابط intent المهيأ مع S.browser_fallback_url لمتجر Google Play
  if (plan.platform === "android") {
    hideCibFallback(cardElement);

    if (!plan.shouldNavigate || !plan.targetUrl) {
      notify(
        copied
          ? "تم نسخ رقم الحساب ✓ — تعذر بدء فتح التطبيق"
          : "تعذر نسخ رقم الحساب أو فتح التطبيق",
        3500
      );
      return {
        platform: "android",
        copied,
        navigated: false,
        targetUrl: null
      };
    }

    try {
      navigate(plan.targetUrl);
      notify(
        copied
          ? "تم نسخ رقم الحساب ✓ — جارٍ فتح تطبيق إنستاباي..."
          : "تعذر النسخ التلقائي — جارٍ فتح تطبيق إنستاباي...",
        2500
      );
      return {
        platform: "android",
        copied,
        navigated: true,
        targetUrl: plan.targetUrl
      };
    } catch (_navError) {
      notify(
        copied
          ? "تم نسخ رقم الحساب ✓ — تعذر فتح تطبيق إنستاباي تلقائياً"
          : "تعذر نسخ رقم الحساب وفتح تطبيق إنستاباي تلقائياً",
        4000
      );
      return {
        platform: "android",
        copied,
        navigated: false,
        targetUrl: null
      };
    }
  }

  // 5. على iOS: نحاول فتح iosAppUrl، وإذا لم يفتح التطبيق نعرض رابطاً تفاعلياً ثابتاً لـ App Store
  hideCibFallback(cardElement);

  let appOpened = false;
  let timerId = null;
  let cleanedUp = false;

  const handleVisibility = () => {
    if (doc && doc.hidden) {
      appOpened = true;
      cleanup();
    }
  };

  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    if (doc && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("visibilitychange", handleVisibility);
    }
    if (timerId !== null) {
      clearTimer(timerId);
      timerId = null;
    }
    if (activeCibCleanup === cleanup) {
      activeCibCleanup = null;
    }
  }

  if (doc && typeof doc.addEventListener === "function") {
    doc.addEventListener("visibilitychange", handleVisibility);
  }

  timerId = setTimer(() => {
    const isHidden = Boolean(doc && doc.hidden);
    cleanup();
    if (!appOpened && !isHidden) {
      renderCibFallback(cardElement, {
        mode: "ios",
        account: safePayment.account,
        copied,
        appStoreUrl: plan.fallbackStoreUrl
      });
      notify(
        "لم يفتح تطبيق إنستاباي تلقائياً — يمكنك فتحه أو تنزيله من App Store",
        4000
      );
    }
  }, fallbackDelayMs);

  activeCibCleanup = cleanup;

  try {
    navigate(plan.targetUrl);
    notify(
      copied
        ? "تم نسخ رقم الحساب ✓ — جارٍ محاولة فتح إنستاباي..."
        : "تعذر النسخ التلقائي — جارٍ محاولة فتح إنستاباي...",
      2500
    );
    return {
      platform: "ios",
      copied,
      navigated: true,
      targetUrl: plan.targetUrl,
      cleanup
    };
  } catch (_navError) {
    cleanup();
    renderCibFallback(cardElement, {
      mode: "ios",
      account: safePayment.account,
      copied,
      appStoreUrl: plan.fallbackStoreUrl
    });
    notify(
      "تعذر فتح تطبيق إنستاباي تلقائياً — يمكنك فتحه أو تنزيله من App Store",
      4000
    );
    return {
      platform: "ios",
      copied,
      navigated: false,
      targetUrl: null,
      cleanup
    };
  }
}

const container = document.getElementById("paymentCardsList");
const template = document.getElementById("paymentCardTemplate");

if (container && template) {
  paymentMethods.forEach((method) => {
    const payment = method.data;
    if (!payment || !payment.account) return;

    const analyticsMethodName = {
      instapay: "instapay",
      cibBank: "cib_bank",
      vodafoneCash: "vodafone_cash_1",
      vodafoneCash2: "vodafone_cash_2"
    }[payment.id] || "payment";

    const fragment = template.content.cloneNode(true);
    const cardSection = fragment.querySelector(".payment-card");
    const logoBox = fragment.querySelector(".payment-logo");
    const logo = fragment.querySelector(".payment-logo img");
    const actions = fragment.querySelector(".payment-actions");
    const copyButton = fragment.querySelector(".btn-copy");
    const copyLabelEl = copyButton.querySelector(".btn-label");
    const appLink = fragment.querySelector(".btn-app");

    const defaultCopyLabel = payment.copyLabel || "نسخ الرقم";
    if (copyLabelEl) copyLabelEl.textContent = defaultCopyLabel;

    copyButton.dataset.analyticsEvent = `${analyticsMethodName}_copy_click`;
    if (appLink) appLink.dataset.analyticsEvent = `${analyticsMethodName}_open_click`;

    logoBox.classList.add(method.className);
    logo.src = payment.logo || method.logoImg;
    logo.alt = payment.label;
    fragment.querySelector(".payment-name").textContent = payment.label;
    fragment.querySelector(".payment-note").textContent =
      payment.note || "تحويل إلكتروني";
    fragment.querySelector(".account-holder").textContent =
      payment.nameHolder || "الحساب الرسمي";
    fragment.querySelector(".account-number").textContent = payment.account;

    copyButton.addEventListener("click", () =>
      copyText(payment.account, copyButton, defaultCopyLabel)
    );

    if (payment.appUrl) {
      const isCustomScheme =
        payment.appUrl.startsWith("intent:") ||
        payment.appUrl.startsWith("ipn:") ||
        payment.appUrl.startsWith("instapay:");

      appLink.href = payment.appUrl;

      if (isCustomScheme) {
        appLink.removeAttribute("target");
        appLink.removeAttribute("rel");
      } else {
        // روابط الويب العادية (HTTPS) تفتح بأمان في نافذة جديدة
        appLink.target = "_blank";
        appLink.rel = "noopener noreferrer";
      }

      const appLabelEl = appLink.querySelector("span");
      if (appLabelEl && payment.appLabel) {
        appLabelEl.textContent = payment.appLabel;
      }

      if (payment.id === "cibBank") {
        appLink.addEventListener("click", (e) =>
          handleCibInstaPayClick(e, payment, { cardElement: cardSection })
        );
      }
    } else {
      if (appLink) appLink.remove();
      if (actions) actions.classList.add("single");
    }

    container.appendChild(fragment);
  });
}

const googleReviewBtn = document.getElementById("googleReviewBtn");
if (googleReviewBtn) {
  if (config.googleReviewUrl) {
    googleReviewBtn.href = config.googleReviewUrl;
  } else {
    googleReviewBtn.hidden = true;
  }
}
