import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { validateRegisteredUsers } from "@/lib/secureDataWrite";
import { isSecretClubTier } from "@/lib/userProfile";
import { validateMagicBytes } from "@/lib/imageSecurity";
import { extractGifPoster } from "@/lib/imageProcess";
import { readUserMediaFile, storeUserMediaFile } from "@/lib/userMediaStorage";
import { isAnimatedImageUrl } from "@/lib/profileImage";

const MAX_BYTES = 4 * 1024 * 1024;

async function loadGifBuffer(gifUrl: string): Promise<Buffer | null> {
  if (gifUrl.startsWith("/api/user/media")) {
    try {
      const key = new URL(gifUrl, "https://uplink.local").searchParams.get("key");
      if (key) {
        const file = await readUserMediaFile(key);
        if (file?.buffer) return file.buffer;
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const parsed = new URL(gifUrl);
    const keyParam = parsed.searchParams.get("key");
    if (parsed.pathname.endsWith("/api/user/media") && keyParam) {
      const file = await readUserMediaFile(keyParam);
      return file?.buffer ?? null;
    }
  } catch {
    /* fall through to fetch */
  }

  if (!gifUrl.startsWith("https://")) return null;
  const res = await fetch(gifUrl, {
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: "image/gif,image/*" },
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES || buf.length < 8) return null;
  if (!validateMagicBytes(buf)) return null;
  return buf;
}

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || "";
  let body: { gifUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const gifUrl = String(body.gifUrl || "").trim();
  if (!gifUrl || !isAnimatedImageUrl(gifUrl)) {
    return NextResponse.json({ error: "Not a GIF URL" }, { status: 400 });
  }

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u: { id?: string }) => String(u.id) === String(userId));
  if (idx === -1 || !isSecretClubTier(users[idx])) {
    return NextResponse.json({ error: "Secret Club required" }, { status: 403 });
  }

  const gifBuffer = await loadGifBuffer(gifUrl);
  if (!gifBuffer) {
    return NextResponse.json({ error: "Could not load GIF" }, { status: 400 });
  }

  let thumbUrl: string;
  try {
    const poster = await extractGifPoster(gifBuffer, 512);
    thumbUrl = await storeUserMediaFile(userId, poster, "webp", "image/webp");
  } catch {
    return NextResponse.json({ error: "Poster generation failed" }, { status: 500 });
  }

  const updatedUsers = users.map((u: Record<string, unknown>, i: number) =>
    i === idx ? { ...u, profileGifThumb: thumbUrl } : u
  );
  const validation = validateRegisteredUsers(users, updatedUsers, userId, false);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 403 });
  }
  await setKV("registeredUsers", validation.value);

  return NextResponse.json({ success: true, thumbUrl });
}
