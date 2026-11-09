"use strict";

(function initializeAnalytics() {
  // يتم تفعيل الإحصائيات فقط عند إضافة Measurement ID الخاص بالعميل
  const measurementId =
    typeof PHARMACY !== "undefined" && PHARMACY.analyticsId
      ? PHARMACY.analyticsId.trim()
      : "";

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  if (measurementId && /^G-[A-Z0-9]+$/i.test(measurementId)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  document.addEventListener(
    "click",
    (event) => {
      const trackedElement = event.target.closest("[data-analytics-event]");
      if (!trackedElement) return;

      const eventName = trackedElement.dataset.analyticsEvent;
      if (!/^[a-z][a-z0-9_]{0,39}$/.test(eventName)) return;

      if (measurementId) {
        window.gtag("event", eventName);
      }
    },
    { capture: true }
  );
})();
