import { validateMagicBytes } from "@/lib/imageSecurity";

type ImageFormat = "jpeg" | "png" | "webp" | "gif" | "avif";

const ALLOWED_FORMATS = new Set<ImageFormat>(["jpeg", "png", "webp", "gif", "avif"]);

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    return null;
  }
}

function detectFormat(buffer: Buffer): ImageFormat | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "gif";
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return "avif";
  return null;
}

export async function getImageMetadata(buffer: Buffer) {
  const sharp = await loadSharp();
  if (sharp) {
    return sharp(buffer, { animated: true }).metadata();
  }

  const format = detectFormat(buffer);
  if (!format || !validateMagicBytes(buffer)) {
    throw new Error("Invalid image");
  }

  return { format, width: 0, height: 0 };
}

export async function normalizeCommunityImage(buffer: Buffer, preferGif = false) {
  const sharp = await loadSharp();
  const format = detectFormat(buffer);

  if (sharp) {
    const meta = await sharp(buffer, { animated: true }).metadata();
    const mime = meta.format ? `image/${meta.format}` : "";
    const isGif = meta.format === "gif" || preferGif;
    if (!meta.width || !meta.height) throw new Error("Invalid image dimensions");
    if (!mime || !["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(mime)) {
      throw new Error("Unsupported image type");
    }
    if (isGif) return { buffer, ext: "gif" as const };
    const normalized = await sharp(buffer, { animated: true })
      .resize(4096, 4096, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer: normalized, ext: "webp" as const };
  }

  if (!format || !ALLOWED_FORMATS.has(format) || !validateMagicBytes(buffer)) {
    throw new Error("Unsupported image type");
  }
  if (format === "gif" || preferGif) return { buffer, ext: "gif" as const };
  return { buffer, ext: format === "jpeg" ? "jpg" : format };
}

export async function normalizeProfileImage(
  buffer: Buffer,
  opts: { maxDim: number; isGifUpload: boolean; isBanner: boolean }
) {
  const sharp = await loadSharp();
  if (sharp) {
    const meta = await sharp(buffer, { animated: true }).metadata();
    if (!meta.format || !ALLOWED_FORMATS.has(meta.format as ImageFormat)) {
      throw new Error("Unsupported format");
    }
    if (opts.isGifUpload) {
      return { buffer, ext: "gif" as const };
    }
    const normalized = await sharp(buffer, { animated: true })
      .rotate()
      .resize(opts.maxDim, opts.maxDim, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: opts.isBanner ? 82 : 85 })
      .toBuffer();
    return { buffer: normalized, ext: "webp" as const };
  }

  const format = detectFormat(buffer);
  if (!format || !ALLOWED_FORMATS.has(format) || !validateMagicBytes(buffer)) {
    throw new Error("Unsupported format");
  }
  if (opts.isGifUpload) return { buffer, ext: "gif" as const };
  return { buffer, ext: "webp" as const };
}
