import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getKV, setKV, initTables } from "@/lib/db";
import { validateRegisteredUsers } from "@/lib/secureDataWrite";
import { isSecretClubTier } from "@/lib/userProfile";
import { checkUploadQuota, incrementUploadQuota, validateMagicBytes } from "@/lib/imageSecurity";
import { logAudit } from "@/lib/auditLog";
import { rateLimitByUser } from "@/lib/rateLimit";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_DIM = 512;
const SAFE_RE = /^[a-zA-Z0-9_-]+$/;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id || "";
  const handle = (session.user as any).username || "";
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
    "customAvatar";
  if (!file || file.size === 0) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });

  const isBanner = field === "banner";
  const maxDim = isBanner ? 1920 : MAX_DIM;

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 8) return NextResponse.json({ error: "Corrupted file" }, { status: 400 });
  if (!validateMagicBytes(buffer)) return NextResponse.json({ error: "Invalid file signature" }, { status: 400 });

  let meta;
  try { meta = await sharp(buffer, { animated: true }).metadata(); }
  catch { return NextResponse.json({ error: "Invalid image" }, { status: 400 }); }

  if (!meta.format || !["jpeg", "png", "webp", "gif", "avif"].includes(meta.format))
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });

  const isGifUpload = meta.format === "gif" || file.name.match(/\.gif$/i) || file.type === "image/gif";

  let normalized: Buffer;
  let ext = "webp";
  try {
    if (isGifUpload && (field === "profileGif" || isBanner)) {
      normalized = buffer;
      ext = "gif";
    } else {
      normalized = await sharp(buffer, { animated: true })
        .rotate()
        .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: isBanner ? 82 : 85 })
        .toBuffer();
    }
  } catch {
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  const dir = path.join(process.cwd(), "public", isBanner ? "user-banners" : "user-avatars");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${userId}_${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), normalized);
  const url = isBanner ? `/user-banners/${filename}` : `/user-avatars/${filename}`;

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u: any) => String(u.id) === String(userId));
  if (field === "profileGif" && idx !== -1 && !isSecretClubTier(users[idx])) {
    return NextResponse.json({ error: "Secret Club required for profile GIF" }, { status: 403 });
  }
  if (isBanner && idx !== -1 && !isSecretClubTier(users[idx])) {
    return NextResponse.json({ error: "Secret Club required for profile banner" }, { status: 403 });
  }
  if (idx !== -1) {
    const updatedUsers = users.map((u: any, i: number) =>
      i === idx ? { ...u, [field]: url } : u
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

  return NextResponse.json({ success: true, url });
}
