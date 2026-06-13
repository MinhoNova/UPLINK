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

/** Edge-safe IP rate limit (in-memory only). */
export function rateLimitByIp(ip: string, path: string, limit = 120, windowMs = 60_000): RateLimitResult {
  return checkMemoryBucket(`ip:${ip}:${path}`, limit, windowMs);
}
