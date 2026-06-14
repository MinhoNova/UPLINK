import fs from "fs";
import path from "path";
import { getKVBinding } from "@/lib/cloudflareBindings";

const MEDIA_KV_PREFIX = "user-media:";
const COMMUNITY_KV_PREFIX = "community-media:";

export async function storeUserMediaFile(
  userId: string,
  buffer: Buffer,
  ext: string,
  contentType: string
): Promise<string> {
  const kv = await getKVBinding();
  const id = `${userId}_${Date.now()}.${ext}`;

  if (kv) {
    const key = `${MEDIA_KV_PREFIX}${id}`;
    await kv.put(key, buffer.toString("base64"), {
      metadata: { contentType, ext },
    });
    return `/api/user/media?key=${encodeURIComponent(key)}`;
  }

  const subdir = ext === "gif" || contentType.includes("gif") ? "user-avatars" : "user-avatars";
  const dir = path.join(process.cwd(), "public", subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = id;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/${subdir}/${filename}`;
}

export async function storeCommunityMediaFile(
  userId: string,
  buffer: Buffer,
  ext: string,
  contentType: string
): Promise<string> {
  const kv = await getKVBinding();
  const id = `${userId}_${Date.now()}.${ext}`;

  if (kv) {
    const key = `${COMMUNITY_KV_PREFIX}${id}`;
    await kv.put(key, buffer.toString("base64"), {
      metadata: { contentType, ext },
    });
    return `/api/user/media?key=${encodeURIComponent(key)}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads", "community");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, id), buffer);
  return `/uploads/community/${id}`;
}

export async function readUserMediaFile(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!key.startsWith(MEDIA_KV_PREFIX) && !key.startsWith(COMMUNITY_KV_PREFIX)) return null;

  const kv = await getKVBinding();
  if (!kv) return null;

  const meta = await kv.getWithMetadata<{ contentType?: string; ext?: string }>(key, { type: "text" });
  if (!meta.value) return null;

  const contentType =
    meta.metadata?.contentType ||
    (meta.metadata?.ext === "gif" ? "image/gif" : "image/webp");

  return { buffer: Buffer.from(meta.value, "base64"), contentType };
}
