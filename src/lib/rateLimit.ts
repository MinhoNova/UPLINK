import { getKV, setKV, initTables } from "@/lib/db";

type Bucket = { count: number; windowStart: number };

const memoryBuckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

function checkMemoryBucket(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    memoryBuckets.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: windowMs - (now - bucket.windowStart) };
  }
  bucket.count += 1;
  return { ok: true };
}

async function checkKvBucket(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  await initTables();
  const store: Record<string, Bucket> = (await getKV("rateLimits")) || {};
  const now = Date.now();
  const bucket = store[key];
  if (!bucket || now - bucket.windowStart >= windowMs) {
    store[key] = { count: 1, windowStart: now };
    await setKV("rateLimits", store);
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: windowMs - (now - bucket.windowStart) };
  }
  bucket.count += 1;
  store[key] = bucket;
  await setKV("rateLimits", store);
  return { ok: true };
}

export function rateLimitByIp(ip: string, path: string, limit = 120, windowMs = 60_000): RateLimitResult {
  const key = `ip:${ip}:${path}`;
  return checkMemoryBucket(key, limit, windowMs);
}

export async function rateLimitByUser(
  userId: string,
  action: string,
  limit: number,
  windowMs = 60_000
): Promise<RateLimitResult> {
  return checkKvBucket(`user:${userId}:${action}`, limit, windowMs);
}

export function rateLimitResponse(result: { ok: false; retryAfterMs: number }) {
  return new Response(JSON.stringify({ error: "Too many requests", retryAfterMs: result.retryAfterMs }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
    },
  });
}
