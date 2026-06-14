import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, initTables } from "@/lib/db";
import { isSecretClubTier } from "@/lib/userProfile";
import { validateMagicBytes } from "@/lib/imageSecurity";
import { getImageMetadata, normalizeLobbyVfx } from "@/lib/imageProcess";
import { readUserMediaFile, storeUserMediaFile } from "@/lib/userMediaStorage";
import { isAnimatedImageUrl } from "@/lib/profileImage";
import type { VfxEntry } from "@/lib/vfxAssets";

const MAX_BYTES = 8 * 1024 * 1024;

function detectGif(buffer: Buffer): boolean {
  return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
}

async function loadImageBuffer(sourceUrl: string): Promise<Buffer | null> {
  if (sourceUrl.startsWith("/api/user/media")) {
    const key = new URL(sourceUrl, "https://uplink.local").searchParams.get("key");
    if (key) {
      const file = await readUserMediaFile(key);
      if (file?.buffer) return file.buffer;
    }
  }
  if (!sourceUrl.startsWith("https://")) return null;
  const res = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; UPLINK/1.0)",
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES || buf.length < 8 || !validateMagicBytes(buf)) return null;
  return buf;
}

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || "";

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u: { id?: string }) => String(u.id) === String(userId));
  if (idx === -1 || !isSecretClubTier(users[idx])) {
    return NextResponse.json({ error: "Secret Club required" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  let imageBuffer: Buffer | null = null;
  let isGif = false;
  let clientPoster: Buffer | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const posterFile = formData.get("poster") as File | null;
    if (!file?.size) return NextResponse.json({ error: "No file" }, { status: 400 });
    imageBuffer = Buffer.from(await file.arrayBuffer());
    isGif = file.type.includes("gif") || file.name.toLowerCase().endsWith(".gif");
    if (posterFile?.size) {
      clientPoster = Buffer.from(await posterFile.arrayBuffer());
    }
  } else {
    let body: { url?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const url = String(body.url || "").trim();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });
    isGif = isAnimatedImageUrl(url);
    imageBuffer = await loadImageBuffer(url);
    if (!imageBuffer) {
      return NextResponse.json(
        {
          error:
            "Could not load image from URL on server. Paste the link in your browser, save the GIF, then use Upload File.",
        },
        { status: 400 }
      );
    }
  }

  if (!imageBuffer) return NextResponse.json({ error: "No image data" }, { status: 400 });

  let meta;
  try {
    meta = await getImageMetadata(imageBuffer);
  } catch {
    return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
  }

  isGif = isGif || meta.format === "gif" || detectGif(imageBuffer);

  let outBuffer = imageBuffer;
  let ext: "gif" | "webp" | "jpg" | "png" = isGif ? "gif" : meta.format === "jpeg" ? "jpg" : meta.format === "png" ? "png" : "webp";
  let posterBuffer: Buffer | null = clientPoster;

  if (!posterBuffer) {
    try {
      const normalized = await normalizeLobbyVfx(imageBuffer, isGif);
      outBuffer = normalized.buffer;
      ext = normalized.ext;
      posterBuffer = normalized.poster;
    } catch {
      /* Sharp unavailable (Cloudflare Workers) — store original bytes */
      outBuffer = imageBuffer;
    }
  }

  let srcUrl: string;
  let posterUrl: string | undefined;
  try {
    const mime =
      ext === "gif" ? "image/gif" :
      ext === "png" ? "image/png" :
      ext === "jpg" ? "image/jpeg" :
      "image/webp";
    srcUrl = await storeUserMediaFile(userId, outBuffer, ext, mime);
    if (posterBuffer) {
      posterUrl = await storeUserMediaFile(userId, posterBuffer, "webp", "image/webp");
    }
  } catch {
    return NextResponse.json({ error: "Storage failed" }, { status: 500 });
  }

  const entry: VfxEntry = posterUrl ? { src: srcUrl, poster: posterUrl } : { src: srcUrl };

  return NextResponse.json({ success: true, entry, url: srcUrl, posterUrl });
}
