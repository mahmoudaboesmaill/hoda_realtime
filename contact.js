"use strict";

SITE.applyHeader();

document.getElementById("addressText").textContent = PHARMACY.address;
document.getElementById("phoneLabel").textContent = PHARMACY.phone;
document.getElementById("phoneTile").href = `tel:${PHARMACY.phone}`;
document.getElementById("mapsTile").href = PHARMACY.mapsUrl;
document.getElementById("directionsBtn").href = PHARMACY.mapsUrl;

const encodedMessage = encodeURIComponent(
  PHARMACY.prescriptionMsg || "السلام عليكم كنت حابب أستفسر عن"
);
document.getElementById("rxBtn").href =
  `https://wa.me/${PHARMACY.whatsapp}?text=${encodedMessage}`;
document.getElementById("waTile").href =
  `https://wa.me/${PHARMACY.whatsapp}?text=${encodedMessage}`;

const facebookLink = document.getElementById("fbTile");
if (PHARMACY.facebookUrl) {
  facebookLink.href = PHARMACY.facebookUrl;
} else {
  facebookLink.hidden = true;
}

const instagramLink = document.getElementById("igTile");
if (PHARMACY.instagramUrl) {
  instagramLink.href = PHARMACY.instagramUrl;
} else {
  instagramLink.hidden = true;
}

const tiktokLink = document.getElementById("tiktokTile");
if (tiktokLink) {
  if (PHARMACY.tiktokUrl) {
    const rawTikTok = PHARMACY.tiktokUrl.trim();
    tiktokLink.href = /^https?:\/\//i.test(rawTikTok)
      ? rawTikTok
      : `https://${rawTikTok}`;
  } else {
    tiktokLink.hidden = true;
  }
}

function saveContact() {
  const fullName = PHARMACY.fullName || `${PHARMACY.name} - ${PHARMACY.englishName || ""}`.trim();
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fullName}`,
    `ORG:${fullName}`,
    `TITLE:${PHARMACY.activity || "حلول الكهرباء والإضاءة والأنظمة الذكية والمراقبة"}`,
    `TEL;TYPE=WORK,VOICE:${PHARMACY.phone}`,
    `TEL;TYPE=CELL,VOICE,MSG:+${PHARMACY.whatsapp}`,
    `ADR;TYPE=WORK:;;${PHARMACY.address};;;;`,
    `URL:${PHARMACY.mapsUrl}`,
    `NOTE:${PHARMACY.tagline || "حلول ذكية لمستقبل أفضل"} - ${PHARMACY.owner || "سيد عبيد"}`,
    "END:VCARD"
  ].join("\r\n");

  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "مؤسسة سيد عبيد المتكاملة - ElHoda & RT Tech.vcf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.getElementById("saveContactBtn").addEventListener("click", saveContact);
