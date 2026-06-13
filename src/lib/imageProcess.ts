import { validateMagicBytes } from "@/lib/imageSecurity";

type ImageFormat = "jpeg" | "png" | "webp" | "gif" | "avif";

const ALLOWED_FORMATS = new Set<ImageFormat>(["jpeg", "png", "webp", "gif", "avif"]);

function detectFormat(buffer: Buffer): ImageFormat | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "gif";
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return "avif";
  return null;
}

function assertValidImage(buffer: Buffer) {
  const format = detectFormat(buffer);
  if (!format || !ALLOWED_FORMATS.has(format) || !validateMagicBytes(buffer)) {
    throw new Error("Unsupported image type");
  }
  return format;
}

export async function getImageMetadata(buffer: Buffer) {
  const format = assertValidImage(buffer);
  return { format, width: 0, height: 0 };
}

export async function normalizeCommunityImage(buffer: Buffer, preferGif = false) {
  const format = assertValidImage(buffer);
  if (format === "gif" || preferGif) return { buffer, ext: "gif" as const };
  if (format === "jpeg") return { buffer, ext: "jpg" as const };
  return { buffer, ext: format };
}

export async function normalizeProfileImage(
  buffer: Buffer,
  opts: { maxDim: number; isGifUpload: boolean; isBanner: boolean }
) {
  const format = assertValidImage(buffer);
  if (opts.isGifUpload) return { buffer, ext: "gif" as const };
  if (format === "jpeg") return { buffer, ext: "jpg" as const };
  if (format === "png") return { buffer, ext: "png" as const };
  return { buffer, ext: "webp" as const };
}
