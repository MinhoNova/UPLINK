import { getKV, setKV, initTables } from "@/lib/db";
import { rateLimitByIp as rateLimitByIpDistributed } from "@/lib/rateLimitDistributed";

type Bucket = { count: number; windowStart: number };

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

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

/** D1/KV-backed IP rate limit for API routes. */
export async function rateLimitByIp(
  ip: string,
  path: string,
  limit = 120,
  windowMs = 60_000
): Promise<RateLimitResult> {
  return rateLimitByIpDistributed(ip, path, limit, windowMs);
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
