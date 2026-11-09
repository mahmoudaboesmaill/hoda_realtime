"use strict";

SITE.applyHeader();

const encodedMessage = encodeURIComponent(
  PHARMACY.prescriptionMsg || "السلام عليكم كنت حابب أستفسر عن"
);

document.getElementById("rxBtn").href =
  `https://wa.me/${PHARMACY.whatsapp}?text=${encodedMessage}`;
document.getElementById("quickWa").href =
  `https://wa.me/${PHARMACY.whatsapp}?text=${encodedMessage}`;
document.getElementById("quickCall").href = `tel:${PHARMACY.phone}`;
document.getElementById("quickMap").href = PHARMACY.mapsUrl;
