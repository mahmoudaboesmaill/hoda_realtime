/**
 * ====================================================================
 * Behavior Tests - اختبارات محاكاة التفاعل والوظائف
 * ====================================================================
 */

const fs = require("fs");
const vm = require("vm");

let passed = 0;
let failed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}${details ? " -> " + details : ""}`);
    failed++;
  }
}

console.log("\n=======================================================");
console.log(" بدء اختبارات السلوك والروابط (Behavior Tests)");
console.log("=======================================================\n");

// 1. تحميل إعدادات SITE_CONFIG
const settingsCode = fs.readFileSync("settings.js", "utf8");
const sandbox = {};
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(settingsCode + "\n;globalThis.SITE_CONFIG = SITE_CONFIG;", sandbox);
const config = sandbox.SITE_CONFIG;

assert(!!config, "تحميل كائن SITE_CONFIG بنجاح");
assert(config.whatsapp === "201009770070", "رقم واتساب صحيح للرابط الدولي");
assert(config.phone === "01009770070", "رقم الهاتف الأساسي صحيح");
assert(config.mapsUrl.includes("maps.app.goo.gl"), "رابط خرائط جوجل صحيح");

// 2. فحص روابط واتساب المولدة وفروع كارت الواتساب
const msg = encodeURIComponent(config.whatsappMessage);
const expectedWaUrl = `https://wa.me/${config.whatsapp}?text=${msg}`;
assert(expectedWaUrl.startsWith("https://wa.me/201009770070?text="), "تنسيق رابط واتساب wa.me صحيح");
assert(Array.isArray(config.whatsappBranches) && config.whatsappBranches.length === 2, "كارت الواتساب مهيأ بخانتين فقط في settings.js");
assert(config.whatsappBranches[0].number === "01007802888" && config.whatsappBranches[0].whatsapp === "201007802888", "الخانة الأولى في كارت الواتساب مخصصة لـ 01007802888");
assert(config.whatsappBranches[1].number === "01115905060" && config.whatsappBranches[1].whatsapp === "201115905060", "الخانة الثانية في كارت الواتساب مخصصة لـ 01115905060");
assert(config.whatsappChannelUrl === "https://whatsapp.com/channel/0029VazVH2UJENy3XmIKaa2I", "رابط قناة واتساب مهيأ بشكل صحيح في settings.js");
assert(config.whatsappCommunityUrl === "https://chat.whatsapp.com/FSXZUBufabQDfGXla405NH", "رابط مجتمع واتساب مهيأ بشكل صحيح في settings.js");

const contactHtml = fs.readFileSync("contact.html", "utf8");
const paymentHtml = fs.readFileSync("payment.html", "utf8");
assert(contactHtml.includes("https://whatsapp.com/channel/0029VazVH2UJENy3XmIKaa2I") && contactHtml.includes("للعملاء"), "بطاقة قناة واتساب وملاحظة (للعملاء) موجودة في contact.html");
assert(contactHtml.includes("https://chat.whatsapp.com/FSXZUBufabQDfGXla405NH") && contactHtml.includes("للمتخصصين"), "بطاقة مجتمع واتساب وملاحظة (للمتخصصين) موجودة في contact.html");
assert(
  config.googleReviewUrl === "https://search.google.com/local/writereview?placeid=ChIJ86eVXsZEWBQRqdmi7RaqEBI",
  "رابط تقييم جوجل (Google Review) مهيأ بشكل صحيح في settings.js"
);
assert(
  contactHtml.includes('id="googleReviewBtn"') &&
    contactHtml.includes("https://search.google.com/local/writereview?placeid=ChIJ86eVXsZEWBQRqdmi7RaqEBI"),
  "بطاقة تقييم جوجل المميزة موجودة في contact.html"
);
assert(
  paymentHtml.includes('id="googleReviewBtn"') &&
    paymentHtml.includes("https://search.google.com/local/writereview?placeid=ChIJ86eVXsZEWBQRqdmi7RaqEBI"),
  "بطاقة تقييم جوجل المميزة موجودة في payment.html"
);

// 3. فحص بيانات الدفع في settings.js
const payments = config.payments;
assert(payments.instapay.account === "01009770070", "حساب إنستاباي الشخصي سليم ولم يتغير");
assert(payments.instapay.appUrl === "https://ipn.eg/S/syd.mahmoud/instapay/5gJ2be", "رابط إنستاباي الشخصي سليم");
assert(payments.vodafoneCash.account === "01009770070", "رقم فودافون كاش الأول سليم ولم يتغير");
assert(payments.vodafoneCash2.account === "01115905060", "رقم فودافون كاش الثاني سليم ولم يتغير");
assert(payments.cibBank.account === "100072381631", "رقم حساب بنك CIB سليم ولم يتغير");

// 4. فحص رابط InstaPay لحساب CIB مع رابط Fallback لمتجر Google Play
const cibAppUrl = payments.cibBank.appUrl;
assert(cibAppUrl.includes("package=com.egyptianbanks.instapay"), "نية أندرويد تتضمن حزمة تطبيق إنستاباي");
assert(cibAppUrl.includes("S.browser_fallback_url="), "نية أندرويد تتضمن رابط بديل (fallback) للمتجر في حال عدم التثبيت");
assert(payments.cibBank.iosAppUrl === "ipn://open", "رابط iOS لتطبيق إنستاباي مهيأ كـ ipn://open");
assert(
  payments.cibBank.appStoreUrl === "https://apps.apple.com/eg/app/instapay-egypt/id1592108795",
  "رابط App Store لتطبيق إنستاباي مهيأ كـ id1592108795"
);

// 5. فحص استجابة CSS لشاشات الهواتف الصغيرة (Small Mobile Viewport < 360px & <= 520px)
const css = fs.readFileSync("style.css", "utf8");
assert(css.includes("@media (max-width: 359px)"), "دعم شاشات الهواتف شديدة الصغر (< 360px)");
assert(css.includes("@media (max-width: 520px)"), "دعم شاشات الهواتف الذكية القياسية (<= 520px)");
assert(css.includes("@media (min-width: 521px)"), "دعم شاشات سطح المكتب والتابلت (> 520px)");
assert(css.includes(":focus-visible"), "وجود تنسيق واضح ومخصص لـ focus-visible");
assert(css.includes("prefers-reduced-motion"), "وجود دعم لخاصية تقليل الحركة prefers-reduced-motion");
assert(
  !css.includes("animation-duration: 0.01ms !important") &&
    !css.includes("transition-duration: 0.01ms !important"),
  "استبدال القاعدة العامة 0.01ms بتعطيل موجّه للحركات في prefers-reduced-motion"
);
assert(css.includes(".call-branches-two") && css.includes("repeat(2, 1fr)"), "وجود تنسيق شبكة العمودين لكارت الواتساب (.call-branches-two)");
assert(css.includes(".branch-wa-badge"), "وجود تنسيق شارة الواتساب (.branch-wa-badge)");
assert(css.includes(".payment-fallback") && css.includes(".btn-fallback-store"), "وجود تنسيقات واجهة البديل التفاعلي لـ CIB InstaPay");

// 6. فحص أبعاد أهداف اللمس (Touch Targets)
assert(css.includes("min-height: 44px") || css.includes("min-height: 48px"), "أهداف اللمس تلبي معيار الحجم الأدنى (44px)");

// 7. فحص سلامة ملف vCard والتنقل
const vcf = fs.readFileSync("contact.vcf", "utf8");
assert(vcf.includes("FN;CHARSET=UTF-8:مؤسسة سيد عبيد المتكاملة - ElHoda & RT Tech"), "اسم vCard العربي سليم");
assert(vcf.includes("TEL;TYPE=WORK,VOICE:01007802888"), "رقم المبيعات سليم في vCard");
assert(vcf.includes("TEL;TYPE=WORK,VOICE:01115905060"), "رقم خدمة العملاء سليم في vCard");
assert(vcf.includes("TEL;TYPE=WORK,VOICE:01009770070"), "رقم الإدارة سليم في vCard");
assert(vcf.includes("TEL;TYPE=CELL,VOICE,MSG:+201009770070"), "رقم الواتساب سليم في vCard");

// 8. اختبارات سلوكية حقيقية لزر CIB InstaPay وتوقيت الحدث والتنظيف
console.log("\n--- اختبارات سلوك زر CIB InstaPay (Android / iOS / Desktop) ---");

function createMockElement(tagName, ownerDocument) {
  const el = {
    tagName: String(tagName || "div").toUpperCase(),
    className: "",
    id: "",
    textContent: "",
    href: "",
    target: "",
    rel: "",
    hidden: false,
    dataset: {},
    attributes: {},
    children: [],
    parentElement: null,
    ownerDocument,
    setAttribute(name, val) {
      this.attributes[name] = String(val);
      if (name === "hidden") this.hidden = true;
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    removeAttribute(name) {
      delete this.attributes[name];
      if (name === "hidden") this.hidden = false;
    },
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    remove() {
      if (this.parentElement) {
        this.parentElement.children = this.parentElement.children.filter((c) => c !== this);
      }
    },
    select() {},
    setSelectionRange() {},
    querySelector(selector) {
      const cls = selector.startsWith(".") ? selector.slice(1) : null;
      const tag = !cls ? selector.toUpperCase() : null;
      for (const child of this.children) {
        const classList = (child.className || "").split(/\s+/);
        if ((cls && classList.includes(cls)) || (tag && child.tagName === tag)) {
          return child;
        }
        if (typeof child.querySelector === "function") {
          const found = child.querySelector(selector);
          if (found) return found;
        }
      }
      return null;
    },
    querySelectorAll(selector) {
      const results = [];
      const cls = selector.startsWith(".") ? selector.slice(1) : null;
      const tag = !cls ? selector.toUpperCase() : null;
      const visit = (node) => {
        for (const child of node.children || []) {
          const classList = (child.className || "").split(/\s+/);
          if ((cls && classList.includes(cls)) || (tag && child.tagName === tag)) {
            results.push(child);
          }
          visit(child);
        }
      };
      visit(this);
      return results;
    }
  };

  Object.defineProperty(el, "innerHTML", {
    get() {
      return "";
    },
    set(val) {
      if (val === "") {
        this.children = [];
      }
    }
  });

  return el;
}

function createPaymentSandbox() {
  const listeners = {};
  const activeTimers = new Map();
  let nextTimerId = 1;

  const mockDoc = {
    hidden: false,
    body: null,
    createElement(tag) {
      return createMockElement(tag, mockDoc);
    },
    getElementById() {
      return null;
    },
    execCommand() {
      return false;
    },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = new Set();
      listeners[type].add(fn);
    },
    removeEventListener(type, fn) {
      if (listeners[type]) listeners[type].delete(fn);
    },
    dispatchEvent(type) {
      if (!listeners[type]) return;
      Array.from(listeners[type]).forEach((fn) => fn());
    },
    getListenerCount(type) {
      return listeners[type] ? listeners[type].size : 0;
    }
  };
  mockDoc.body = createMockElement("body", mockDoc);

  const setTimer = (fn, ms) => {
    const id = nextTimerId++;
    activeTimers.set(id, { fn, ms });
    return id;
  };
  const clearTimer = (id) => {
    activeTimers.delete(id);
  };
  const runAllTimers = () => {
    const entries = Array.from(activeTimers.entries());
    entries.forEach(([id, item]) => {
      activeTimers.delete(id);
      item.fn();
    });
  };

  const paymentJsCode = fs.readFileSync("payment.js", "utf8");
  const paymentSandbox = {
    SITE_CONFIG: config,
    SITE: {
      applyHeader() {},
      getConfig() {
        return config;
      }
    },
    window: {
      isSecureContext: true,
      location: { href: "" },
      setTimeout: setTimer,
      clearTimeout: clearTimer,
      matchMedia: () => ({ matches: false }),
      prompt() {}
    },
    navigator: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      platform: "Win32",
      maxTouchPoints: 0,
      clipboard: {
        writeText: async () => {}
      }
    },
    document: mockDoc
  };
  paymentSandbox.globalThis = paymentSandbox;
  vm.createContext(paymentSandbox);
  vm.runInContext(
    paymentJsCode +
      "\n;globalThis.exportsForTest = { getDeviceContext, resolveCibNavigationPlan, renderCibFallback, handleCibInstaPayClick, cleanupActiveCibAttempt, writeToClipboard };",
    paymentSandbox
  );

  const cardElement = createMockElement("section", mockDoc);
  cardElement.className = "payment-card";
  const fallbackBox = createMockElement("div", mockDoc);
  fallbackBox.className = "payment-fallback";
  fallbackBox.hidden = true;
  const fallbackText = createMockElement("p", mockDoc);
  fallbackText.className = "payment-fallback-text";
  const fallbackActions = createMockElement("div", mockDoc);
  fallbackActions.className = "payment-fallback-actions";
  fallbackBox.appendChild(fallbackText);
  fallbackBox.appendChild(fallbackActions);
  cardElement.appendChild(fallbackBox);

  return {
    api: paymentSandbox.exportsForTest,
    mockDoc,
    cardElement,
    activeTimers,
    setTimer,
    clearTimer,
    runAllTimers
  };
}

(async function runCibBehavioralTests() {
  const cibPayment = config.payments.cibBank;
  const {
    api,
    mockDoc,
    cardElement,
    activeTimers,
    setTimer,
    clearTimer,
    runAllTimers
  } = createPaymentSandbox();

  // 8.1: preventDefault يتم استدعاؤه بشكل متزامن قبل أي عملية asynchronous
  const callOrder = [];
  let resolveAsyncCopy;
  const slowCopyFn = (text) => {
    callOrder.push("copyFn_invoked:" + text);
    return new Promise((resolve) => {
      resolveAsyncCopy = () => {
        callOrder.push("copyFn_resolved");
        resolve(true);
      };
    });
  };

  let defaultPreventedSync = false;
  const syncTestEvent = {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
      callOrder.push("preventDefault");
    }
  };

  const pendingClickPromise = api.handleCibInstaPayClick(syncTestEvent, cibPayment, {
    env: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", platform: "Win32", maxTouchPoints: 0 },
    copyFn: slowCopyFn,
    navigate: () => {},
    notify: () => {},
    cardElement
  });

  // نتحقق فورًا قبل حل الـ Promise أن preventDefault تم استدعاؤه بالفعل!
  defaultPreventedSync = syncTestEvent.defaultPrevented;
  assert(
    defaultPreventedSync === true,
    "يتم استدعاء event.preventDefault() بشكل متزامن قبل انتهاء أي await"
  );
  assert(
    callOrder[0] === "preventDefault" && callOrder[1] === `copyFn_invoked:${cibPayment.account}`,
    "يتم تنفيذ preventDefault قبل بدء عملية النسخ غير المتزامنة"
  );
  resolveAsyncCopy();
  await pendingClickPromise;

  // 8.2: اختبار سطح المكتب (Desktop) - لا ينتقل إلى intent أو ipn وينسخ الرقم
  const desktopNavigations = [];
  const desktopCopied = [];
  const desktopToasts = [];
  const desktopEvent = {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    }
  };

  const desktopResult = await api.handleCibInstaPayClick(desktopEvent, cibPayment, {
    env: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", platform: "Win32", maxTouchPoints: 0 },
    copyFn: async (acc) => {
      desktopCopied.push(acc);
      return true;
    },
    navigate: (url) => desktopNavigations.push(url),
    notify: (msg) => desktopToasts.push(msg),
    cardElement
  });

  assert(desktopEvent.defaultPrevented === true, "منع الانتقال الافتراضي على سطح المكتب");
  assert(desktopNavigations.length === 0 && desktopResult.navigated === false, "سطح المكتب لا ينتقل إلى intent أو ipn");
  assert(desktopCopied.length === 1 && desktopCopied[0] === "100072381631", "نسخ رقم حساب CIB على سطح المكتب");
  const desktopFallbackBox = cardElement.querySelector(".payment-fallback");
  assert(desktopFallbackBox && desktopFallbackBox.hidden === false, "إظهار رسالة إرشادية ثابتة على سطح المكتب");

  // 8.3: اختبار Android - يستخدم intent الصحيح مع Google Play fallback وينسخ الرقم ويفتح رابطًا واحدًا فقط
  const androidNavigations = [];
  const androidCopied = [];
  const androidEvent = {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    }
  };

  const androidResult = await api.handleCibInstaPayClick(androidEvent, cibPayment, {
    env: { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)", platform: "Linux armv8l", maxTouchPoints: 5 },
    copyFn: async (acc) => {
      androidCopied.push(acc);
      return true;
    },
    navigate: (url) => androidNavigations.push(url),
    notify: () => {},
    cardElement
  });

  assert(androidCopied.length === 1 && androidCopied[0] === "100072381631", "نسخ رقم حساب CIB على Android");
  assert(androidNavigations.length === 1 && androidResult.navigated === true, "فتح رابط واحد فقط في الضغطة الواحدة على Android");
  assert(
    androidNavigations[0] === cibPayment.appUrl &&
      androidNavigations[0].startsWith("intent://open#Intent;scheme=ipn;package=com.egyptianbanks.instapay") &&
      androidNavigations[0].includes("S.browser_fallback_url="),
    "Android يستخدم رابط intent الصحيح ويمتلك رابط Google Play الاحتياطي"
  );

  // 8.4: اختبار iOS عند عدم فتح التطبيق - يحاول iosAppUrl ثم يعرض رابط App Store تفاعلي وينظف المستمعات والمؤقتات
  const iosNavigations = [];
  const iosCopied = [];
  const iosEvent = {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    }
  };
  mockDoc.hidden = false;

  const iosResult = await api.handleCibInstaPayClick(iosEvent, cibPayment, {
    env: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)", platform: "iPhone", maxTouchPoints: 5 },
    copyFn: async (acc) => {
      iosCopied.push(acc);
      return true;
    },
    navigate: (url) => iosNavigations.push(url),
    notify: () => {},
    document: mockDoc,
    setTimeout: setTimer,
    clearTimeout: clearTimer,
    cardElement
  });

  assert(iosCopied.length === 1 && iosCopied[0] === "100072381631", "نسخ رقم حساب CIB على iOS");
  assert(iosNavigations.length === 1 && iosNavigations[0] === "ipn://open" && iosResult.navigated === true, "iOS يحاول فتح iosAppUrl (ipn://open) مرة واحدة فقط");
  assert(mockDoc.getListenerCount("visibilitychange") === 1 && activeTimers.size === 1, "تسجيل مستمع visibilitychange ومؤقت التحقق على iOS أثناء المحاولة");

  // محاكاة انتهاء المهلة دون فتح التطبيق (document.hidden === false)
  runAllTimers();

  assert(
    mockDoc.getListenerCount("visibilitychange") === 0 && activeTimers.size === 0,
    "تنظيف مستمع visibilitychange والـ timeout فور انتهاء المحاولة على iOS"
  );
  assert(iosNavigations.length === 1, "عدم فتح أكثر من رابط تلقائيًا بعد انتهاء المؤقت على iOS");

  const iosFallbackBox = cardElement.querySelector(".payment-fallback");
  const iosStoreLinks = iosFallbackBox ? iosFallbackBox.querySelectorAll("a") : [];
  assert(
    iosFallbackBox &&
      iosFallbackBox.hidden === false &&
      iosStoreLinks.length === 1 &&
      iosStoreLinks[0].href === cibPayment.appStoreUrl &&
      iosStoreLinks[0].target === "_blank" &&
      iosStoreLinks[0].rel === "noopener noreferrer" &&
      Boolean(iosStoreLinks[0].getAttribute("aria-label")),
    "عند فشل فتح التطبيق على iOS يظهر رابط App Store تفاعلي قابل للوصول مع noopener noreferrer"
  );

  // 8.5: اختبار تنظيف المستمع والمؤقت فور فتح التطبيق على iOS (visibilitychange -> document.hidden = true)
  await api.handleCibInstaPayClick(iosEvent, cibPayment, {
    env: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)", platform: "iPhone", maxTouchPoints: 5 },
    copyFn: async () => true,
    navigate: () => {},
    notify: () => {},
    document: mockDoc,
    setTimeout: setTimer,
    clearTimeout: clearTimer,
    cardElement
  });
  mockDoc.hidden = true;
  mockDoc.dispatchEvent("visibilitychange");
  assert(
    mockDoc.getListenerCount("visibilitychange") === 0 && activeTimers.size === 0,
    "تنظيف مستمع visibilitychange وإلغاء المؤقت فور نجاح فتح التطبيق (document.hidden = true)"
  );
  mockDoc.hidden = false;

  // 8.6: اختبار فشل Clipboard API - لا يكسر التنقل أو الواجهة ولا يدّعي نجاح النسخ التلقائي
  const failedClipboardNavs = [];
  const failedClipboardToasts = [];
  const manualPrompts = [];

  const failCopyResult = await api.handleCibInstaPayClick(
    { preventDefault() {} },
    cibPayment,
    {
      env: { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)", platform: "Linux armv8l", maxTouchPoints: 5 },
      copyFn: async () => {
        throw new Error("Clipboard API blocked");
      },
      promptFn: (msg, val) => manualPrompts.push({ msg, val }),
      navigate: (url) => failedClipboardNavs.push(url),
      notify: (msg) => failedClipboardToasts.push(msg),
      cardElement
    }
  );

  assert(
    failCopyResult.copied === false &&
       failCopyResult.navigated === true &&
      failedClipboardNavs.length === 1 &&
      failedClipboardNavs[0] === cibPayment.appUrl,
    "فشل Clipboard API لا يكسر التنقل إلى التطبيق على Android"
  );
  assert(
    manualPrompts.length === 1 && manualPrompts[0].val === "100072381631",
    "تفعيل بديل النسخ اليدوي (prompt) عند فشل Clipboard API"
  );
  assert(
    failedClipboardToasts.length === 1 && !failedClipboardToasts[0].includes("تم نسخ"),
    "عدم ادعاء نجاح النسخ التلقائي في حال فشل Clipboard API"
  );

  console.log("\n=======================================================");
  console.log(` ملخص النتائج: ${passed} فحص ناجح | ${failed} فحص فاشل`);
  console.log("=======================================================\n");

  if (failed > 0) process.exit(1);
})();
