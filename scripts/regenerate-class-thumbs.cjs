/**
 * Pre-rasterize class/role SVGs to small WebP thumbnails.
 * Higher visual quality at display size; smaller total bytes than legacy 32px PNGs.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SVG_DIR = path.join(ROOT, "public", "classes");
const OUT_DIR = path.join(ROOT, "public", "classes-thumb");

const CLASS_PX = 96;
const ROLE_PX = 128;
const SMALL_PX = 64;
const ROLE_NAMES = new Set(["TANK", "HEALER", "DPS"]);
const SMALL_NAMES = new Set(["Battle.net", "RAIDER IO"]);

const RESIZE = {
  fit: "contain",
  background: { r: 0, g: 0, b: 0, alpha: 0 },
  kernel: "lanczos3",
};

const WEBP = { quality: 84, effort: 6, smartSubsample: true };

async function rasterize(svgPath, size) {
  return sharp(svgPath)
    .resize(size, size, RESIZE)
    .sharpen({ sigma: 0.45, m1: 0.45, m2: 0.2, x1: 2, y2: 10, y3: 20 })
    .webp(WEBP)
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const svgs = fs.readdirSync(SVG_DIR).filter((f) => f.endsWith(".svg"));
  let totalBytes = 0;

  for (const file of svgs) {
    const base = file.replace(/\.svg$/i, "");
    const size = ROLE_NAMES.has(base.toUpperCase()) || SMALL_NAMES.has(base)
      ? ROLE_NAMES.has(base.toUpperCase())
        ? ROLE_PX
        : SMALL_PX
      : CLASS_PX;

    const buf = await rasterize(path.join(SVG_DIR, file), size);
    const outName = `${base}.webp`;
    fs.writeFileSync(path.join(OUT_DIR, outName), buf);
    totalBytes += buf.length;
    console.log(`${outName}  ${size}px  ${buf.length} B`);
  }

  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.endsWith(".png")) {
      fs.unlinkSync(path.join(OUT_DIR, file));
      console.log(`removed legacy ${file}`);
    }
  }

  console.log(`\nDone — ${svgs.length} WebP thumbs, ${totalBytes} B total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
