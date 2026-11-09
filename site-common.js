"use strict";

const SITE = {
  getCairoTime() {
    const timezone = (PHARMACY.hours && PHARMACY.hours.timezone) || "Africa/Cairo";
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });

    const parts = Object.fromEntries(
      formatter.formatToParts(new Date()).map((part) => [part.type, part.value])
    );

    return {
      weekday: parts.weekday,
      hour: Number(parts.hour),
      minute: Number(parts.minute)
    };
  },

  getStatusState() {
    const hours = PHARMACY.hours;

    if (!hours) {
      return {
        isOpen: true,
        text: "مفتوح الآن"
      };
    }

    if (hours.mode === "always-open") {
      return {
        isOpen: true,
        text: hours.openLabel || "مفتوح الآن • في خدمتكم 24 ساعة"
      };
    }

    if (hours.mode === "schedule") {
      const now = this.getCairoTime();
      const currentMinutes = now.hour * 60 + now.minute;
      const openMinutes = (hours.opensAt ?? 9) * 60;
      const closeMinutes = (hours.closesAt ?? 2) * 60;
      const closedDay = hours.closedWeekday || "Friday";

      const previousDayMap = {
        Monday: "Sunday",
        Tuesday: "Monday",
        Wednesday: "Tuesday",
        Thursday: "Wednesday",
        Friday: "Thursday",
        Saturday: "Friday",
        Sunday: "Saturday"
      };
      const previousDay = previousDayMap[now.weekday];

      // يفتح من 9 صباحًا حتى نهاية اليوم (ما عدا يوم الإجازة)
      const isOpenDaytime = now.weekday !== closedDay && currentMinutes >= openMinutes;
      // ويمتد بعد منتصف الليل حتى 2 صباحًا إذا كان اليوم السابق يوم عمل
      const isOpenAfterMidnight = previousDay !== closedDay && currentMinutes < closeMinutes;
      const isOpen = isOpenDaytime || isOpenAfterMidnight;

      if (isOpen) {
        return {
          isOpen: true,
          text: hours.openLabel || "مفتوح الآن • من 9 ص حتى 2 ص"
        };
      }

      if (now.weekday === closedDay) {
        return {
          isOpen: false,
          text: hours.fridayClosedLabel || "مغلق الآن • الجمعة إجازة"
        };
      }

      return {
        isOpen: false,
        text: hours.closedLabel || "مغلق الآن • مواعيدنا 9 ص - 2 ص"
      };
    }

    return {
      isOpen: true,
      text: "مفتوح الآن"
    };
  },

  getStatusText() {
    return this.getStatusState().text;
  },

  applyHeader() {
    const nameEl = document.getElementById("pharmacyName");
    const enNameEl = document.getElementById("businessEnglishName");
    const taglineEl = document.getElementById("pharmacyTagline");
    const statusEl = document.getElementById("pharmacyStatus");
    const badgeEl = document.getElementById("statusBadge");
    const logoImgs = document.querySelectorAll(".logo-img");

    if (nameEl) nameEl.textContent = PHARMACY.name;
    if (enNameEl && PHARMACY.englishName) enNameEl.textContent = PHARMACY.englishName;
    if (taglineEl) taglineEl.textContent = PHARMACY.tagline;

    if (PHARMACY.logo && logoImgs.length > 0) {
      logoImgs.forEach((img) => {
        img.src = PHARMACY.logo;
        img.alt = `شعار ${PHARMACY.fullName || PHARMACY.name}`;
      });
    }

    if (statusEl) {
      const state = this.getStatusState();
      statusEl.textContent = state.text;
      const containerBadge = badgeEl || statusEl.closest(".badge-status");
      if (containerBadge) {
        containerBadge.classList.toggle("is-closed", !state.isOpen);
      }
    }
  }
};

// تحديث حالة العمل تلقائيًا كل دقيقة
window.addEventListener("DOMContentLoaded", () => {
  window.setInterval(() => {
    if (document.getElementById("pharmacyStatus")) {
      SITE.applyHeader();
    }
  }, 60000);
});
