/**
 * Turn a pasted image file into a data URL small enough to live inside a KV
 * blob.
 *
 * Why this exists: pasted chat images were read straight into a data URL with
 * `FileReader` and stored inline on the message. A screenshot is commonly
 * 2-5 MB, and base64 inflates that by a third — so one paste put megabytes of
 * base64 inside the single `lobbies` blob. Every authenticated read then had to
 * `JSON.parse` the lot (the thread route, `/api/data`, every save), and that is
 * what pushed the worker past its memory limit: Error 1102.
 *
 * The fix is to shrink the image at the point of capture, so the stored blob
 * stays small no matter what gets pasted. A hard byte cap backstops it, since a
 * canvas encode can still land large for a very wide or noisy image.
 */

/** Beyond this, the image is not worth storing inline at all. */
export const MAX_INLINE_IMAGE_BYTES = 220 * 1024;
const MAX_DIMENSION = 1280;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}

export type InlineImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

/**
 * Downscale, re-encode as JPEG, and reject anything still too large.
 * Returns a data URL suitable for storing on a message.
 */
export async function toStorableImageDataUrl(file: File): Promise<InlineImageResult> {
  if (!file || !file.type?.startsWith("image/")) {
    return { ok: false, error: "That file is not an image" };
  }
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, error: "Could not process that image" };
    // JPEG has no alpha; fill first so transparent PNGs do not go black.
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // Step the quality down until it fits, rather than shipping one big blob.
    for (const quality of [0.82, 0.7, 0.55, 0.4]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const approxBytes = Math.floor((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
      if (approxBytes <= MAX_INLINE_IMAGE_BYTES) return { ok: true, dataUrl };
    }
    return { ok: false, error: "That image is too large to send. Try a smaller one." };
  } catch {
    return { ok: false, error: "Could not process that image" };
  }
}
