"use strict";

SITE.applyHeader();

const config = SITE.getConfig();

const encodedMessage = encodeURIComponent(
  config.whatsappMessage || "السلام عليكم كنت حابب أستفسر عن"
);

const whatsappBtn = document.getElementById("whatsappOrderBtn");
if (whatsappBtn && config.whatsapp) {
  whatsappBtn.href = `https://wa.me/${config.whatsapp}?text=${encodedMessage}`;
}

const quickWa = document.getElementById("quickWa");
if (quickWa && config.whatsapp) {
  quickWa.href = `https://wa.me/${config.whatsapp}?text=${encodedMessage}`;
}

const quickCall = document.getElementById("quickCall");
if (quickCall && config.phone) {
  quickCall.href = `tel:${config.phone}`;
}

const quickMap = document.getElementById("quickMap");
if (quickMap && config.mapsUrl) {
  quickMap.href = config.mapsUrl;
}
