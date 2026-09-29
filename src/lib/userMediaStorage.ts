import fs from "fs";
import path from "path";
import { getKVBinding } from "@/lib/cloudflareBindings";

const MEDIA_KV_PREFIX = "user-media:";
const COMMUNITY_KV_PREFIX = "community-media:";

/**
 * Random component for a media key.
 *
 * The key used to be `<userId>_<Date.now()>.webp`, and both halves were
 * guessable: the Discord id is published in the public `registeredUsers` blob,
 * and the millisecond timestamp can be swept within a small window. Anyone
 * could therefore enumerate and read another user's private uploads. Randomness
 * makes the key a capability rather than a derivable path. Existing keys are
 * unaffected — reads accept any key carrying the prefix.
 */
function mediaKeyId(userId: string, ext: string): string {
  return `${userId}_${Date.now()}_${crypto.randomUUID()}.${ext}`;
}

export async function storeUserMediaFile(
  userId: string,
  buffer: Buffer,
  ext: string,
  contentType: string
): Promise<string> {
  const kv = await getKVBinding();
  const id = mediaKeyId(userId, ext);

  if (!kv) throw new Error("Upload service not available");
  const key = `${MEDIA_KV_PREFIX}${id}`;
  await kv.put(key, buffer.toString("base64"), {
    metadata: { contentType, ext },
  });
  return `/api/user/media?key=${encodeURIComponent(key)}`;
}

export async function storeCommunityMediaFile(
  userId: string,
  buffer: Buffer,
  ext: string,
  contentType: string
): Promise<string> {
  const kv = await getKVBinding();
  const id = mediaKeyId(userId, ext);

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
