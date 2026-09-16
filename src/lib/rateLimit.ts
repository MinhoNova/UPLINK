import { initTables, updateKVAtomic } from "@/lib/db";
import { rateLimitByIp as rateLimitByIpDistributed } from "@/lib/rateLimitDistributed";

type Bucket = { count: number; windowStart: number };

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

async function checkKvBucket(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  await initTables();

  const res = await updateKVAtomic<Record<string, Bucket>>(
    "rateLimits",
    (store) => {
      const cur = store ?? {};
      const now = Date.now();
      const bucket = cur[key];
      if (!bucket || now - bucket.windowStart >= windowMs) {
        return { ...cur, [key]: { count: 1, windowStart: now } };
      }
      if (bucket.count >= limit) return undefined; // abort: limited
      return { ...cur, [key]: { count: bucket.count + 1, windowStart: bucket.windowStart } };
    },
    { maxAttempts: 3 }
  );

  if (!res.ok) {
    // Either genuine rate limit (bucket.count was >= limit) or a write conflict
    // after exhausting retries — treat both as "slow down".
    return { ok: false, retryAfterMs: windowMs };
  }

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
