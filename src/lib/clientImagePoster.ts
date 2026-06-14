/** Browser-only: first frame of a GIF/image as WebP blob for static banner posters. */
export async function extractGifPosterBlob(source: Blob, maxDim = 960): Promise<Blob | null> {
  if (typeof window === "undefined") return null;
  const objectUrl = URL.createObjectURL(source);
  try {
    const bitmap = await createImageBitmap(source).catch(() => null);
    if (bitmap) {
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", 0.82));
    }
  } catch {
    /* fall through to Image() */
  }

  return await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => resolve(b), "image/webp", 0.82);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}

export async function fetchImageBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error("Could not fetch image URL");
  const blob = await res.blob();
  if (!blob.type.startsWith("image/") && blob.size < 64) {
    throw new Error("Invalid image");
  }
  return blob;
}

export async function uploadLobbyVfxBlob(blob: Blob, filename: string): Promise<{
  entry: { src: string; poster?: string };
}> {
  const fd = new FormData();
  fd.append("file", blob, filename);
  const isGif = filename.endsWith(".gif") || blob.type.includes("gif");
  if (isGif) {
    const poster = await extractGifPosterBlob(blob);
    if (poster) fd.append("poster", poster, "poster.webp");
  }
  const res = await fetch("/api/user/lobby-vfx", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok || !data.entry) throw new Error(data.error || "Upload failed");
  return data;
}
