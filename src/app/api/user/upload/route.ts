import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { validateRegisteredUsers } from "@/lib/secureDataWrite";
import { isSecretClubTier } from "@/lib/userProfile";
import { checkUploadQuota, incrementUploadQuota, validateMagicBytes } from "@/lib/imageSecurity";
import { logAudit } from "@/lib/auditLog";
import { rateLimitByUser } from "@/lib/rateLimit";
import { getImageMetadata, normalizeProfileImage, extractGifPoster } from "@/lib/imageProcess";
import { storeUserMediaFile } from "@/lib/userMediaStorage";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_DIM = 512;
const SAFE_RE = /^[a-zA-Z0-9_-]+$/;

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || "";
  const handle = (session.user as { username?: string }).username || "";
  if (!SAFE_RE.test(userId)) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const rl = await rateLimitByUser(userId, "avatar_upload", 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many uploads" }, { status: 429 });

  const quota = await checkUploadQuota(userId);
  if (!quota.ok) return NextResponse.json({ error: quota.error }, { status: 429 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const rawField = formData.get("field");
  const field =
    rawField === "profileGif" ? "profileGif" :
    rawField === "banner" ? "banner" :
    rawField === "chatImage" ? "chatImage" :
    "customAvatar";
  if (!file || file.size === 0) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });

  const isBanner = field === "banner";
  const isChatImage = field === "chatImage";
  const maxDim = isBanner ? 1920 : MAX_DIM;

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 8) return NextResponse.json({ error: "Corrupted file" }, { status: 400 });
  if (!validateMagicBytes(buffer)) return NextResponse.json({ error: "Invalid file signature" }, { status: 400 });

  let meta;
  try { meta = await getImageMetadata(buffer); }
  catch { return NextResponse.json({ error: "Invalid image" }, { status: 400 }); }

  if (!meta.format || !["jpeg", "png", "webp", "gif", "avif"].includes(meta.format))
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });

  const isGifUpload = meta.format === "gif" || file.name.match(/\.gif$/i) || file.type === "image/gif";

  let normalized: Buffer;
  let ext = "webp";
  try {
    const result = await normalizeProfileImage(buffer, {
      maxDim,
      isGifUpload: !!(isGifUpload && (field === "profileGif" || isBanner || isChatImage)),
      isBanner,
    });
    normalized = result.buffer;
    ext = result.ext;
  } catch {
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  const contentType =
    ext === "gif" ? "image/gif" :
    ext === "png" ? "image/png" :
    ext === "jpeg" ? "image/jpeg" :
    "image/webp";

  let url: string;
  let thumbUrl: string | undefined;
  try {
    url = await storeUserMediaFile(userId, normalized, ext, contentType);
    if (field === "profileGif" && ext === "gif") {
      try {
        const poster = await extractGifPoster(buffer, MAX_DIM);
        thumbUrl = await storeUserMediaFile(userId, poster, "webp", "image/webp");
      } catch {
        /* poster optional */
      }
    }
  } catch {
    return NextResponse.json({ error: "Storage failed" }, { status: 500 });
  }

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u: { id?: string }) => String(u.id) === String(userId));
  if (field === "profileGif" && idx !== -1 && !isSecretClubTier(users[idx])) {
    return NextResponse.json({ error: "Secret Club required for profile GIF" }, { status: 403 });
  }
  if (isBanner && idx !== -1 && !isSecretClubTier(users[idx])) {
    return NextResponse.json({ error: "Secret Club required for profile banner" }, { status: 403 });
  }
  if (idx !== -1) {
    const patch: Record<string, string> = { [field]: url };
    if (field === "profileGif" && thumbUrl) patch.profileGifThumb = thumbUrl;
    const updatedUsers = users.map((u: Record<string, unknown>, i: number) =>
      i === idx ? { ...u, ...patch } : u
    );
    const validation = validateRegisteredUsers(users, updatedUsers, userId, false);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }
    await setKV("registeredUsers", validation.value);
  }

  await incrementUploadQuota(userId);
  await logAudit({
    action: "upload.avatar",
    userId,
    handle,
    meta: { field },
  });

  return NextResponse.json({ success: true, url, thumbUrl });
}
