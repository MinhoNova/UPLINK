const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "og.png");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#04040a"/>
      <stop offset="45%" stop-color="#0a0a16"/>
      <stop offset="100%" stop-color="#120818"/>
    </linearGradient>
    <linearGradient id="title" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00ffff"/>
      <stop offset="50%" stop-color="#c4b5fd"/>
      <stop offset="100%" stop-color="#ff007f"/>
    </linearGradient>
    <linearGradient id="arc" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00ffff"/>
      <stop offset="1" stop-color="#ff007f"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#00ffff" stop-opacity="0.18"/>
      <stop offset="45%" stop-color="#ff007f" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g opacity="0.35" stroke="#00ffff" stroke-width="1">
    ${Array.from({ length: 26 }, (_, i) => `<line x1="0" y1="${i * 24}" x2="1200" y2="${i * 24}" opacity="0.12"/>`).join("")}
    ${Array.from({ length: 51 }, (_, i) => `<line x1="${i * 24}" y1="0" x2="${i * 24}" y2="630" opacity="0.12"/>`).join("")}
  </g>
  <g transform="translate(540 130) scale(4)">
    <path d="M8 16 Q16 8 24 16" stroke="url(#arc)" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <circle cx="8" cy="16" r="3.5" fill="#00ffff"/>
    <circle cx="24" cy="16" r="3.5" fill="#ff007f"/>
  </g>
  <text x="600" y="340" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="900" letter-spacing="14" fill="url(#title)">UPLINK</text>
  <text x="600" y="400" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="8" fill="rgba(255,255,255,0.88)">WOW MYTHIC+ LFG</text>
  <text x="600" y="450" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" fill="rgba(255,255,255,0.55)">Find groups · Sync Raider.io · Discord coordination</text>
  <rect x="470" y="540" width="110" height="42" rx="21" fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.5)" stroke-width="1"/>
  <text x="525" y="567" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" letter-spacing="4" fill="#fbbf24">BETA</text>
  <text x="640" y="567" text-anchor="start" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="rgba(0,255,255,0.75)">uplinklfg.com</text>
</svg>`;

sharp(Buffer.from(svg))
  .png({ quality: 95, compressionLevel: 9 })
  .toFile(OUT)
  .then((info) => {
    console.log(`Wrote ${OUT} (${info.width}x${info.height}, ${info.size} bytes)`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
