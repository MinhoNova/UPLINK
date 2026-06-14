import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, initTables } from "@/lib/db";
import { isSecretClubTier } from "@/lib/userProfile";
import { validateMagicBytes } from "@/lib/imageSecurity";
import { getImageMetadata, normalizeLobbyVfx } from "@/lib/imageProcess";
import { readUserMediaFile, storeUserMediaFile } from "@/lib/userMediaStorage";
import { isAnimatedImageUrl } from "@/lib/profileImage";
import type { VfxEntry } from "@/lib/vfxAssets";

const MAX_BYTES = 6 * 1024 * 1024;

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
    headers: { Accept: "image/*" },
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
  const contentType = req.headers.get("content-type") || "";

  let imageBuffer: Buffer | null = null;
  let isGif = false;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file?.size) return NextResponse.json({ error: "No file" }, { status: 400 });
    imageBuffer = Buffer.from(await file.arrayBuffer());
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
  }

  if (!imageBuffer) return NextResponse.json({ error: "Could not load image" }, { status: 400 });

  let meta;
  try {
    meta = await getImageMetadata(imageBuffer);
  } catch {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  isGif = isGif || meta.format === "gif";

  let normalized;
  try {
    normalized = await normalizeLobbyVfx(imageBuffer, isGif);
  } catch {
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  let srcUrl: string;
  let posterUrl: string;
  try {
    srcUrl = await storeUserMediaFile(
      userId,
      normalized.buffer,
      normalized.ext,
      normalized.ext === "gif" ? "image/gif" : "image/webp"
    );
    posterUrl = await storeUserMediaFile(userId, normalized.poster, "webp", "image/webp");
  } catch {
    return NextResponse.json({ error: "Storage failed" }, { status: 500 });
  }

  const entry: VfxEntry = { src: srcUrl, poster: posterUrl };

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u: { id?: string }) => String(u.id) === String(userId));
  if (idx === -1 || !isSecretClubTier(users[idx])) {
    return NextResponse.json({ error: "Secret Club required" }, { status: 403 });
  }

  return NextResponse.json({ success: true, entry, url: srcUrl, posterUrl });
}
