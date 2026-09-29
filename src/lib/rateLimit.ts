import { initTables, updateKVAtomic } from "@/lib/db";
import { rateLimitByIp as rateLimitByIpDistributed } from "@/lib/rateLimitDistributed";
import { rateLimitResponse, type RateLimitResult } from "@/lib/rateLimitHttp";

export { rateLimitResponse };
export type { RateLimitResult };

type Bucket = { count: number; windowStart: number };

/**
 * Drop buckets whose window has closed.
 *
 * This store lives in the same `rateLimits` row as the IP buckets and is read
 * and rewritten on every limited call, so expired counters left behind made every
 * later call parse more data for no reason.
 */
const STALE_GRACE_MS = 5 * 60_000;

function pruneExpiredBuckets(
  store: Record<string, Bucket>,
  now: number,
  maxWindowMs: number
): Record<string, Bucket> {
  const cutoff = now - maxWindowMs - STALE_GRACE_MS;
  let changed = false;
  const kept: Record<string, Bucket> = {};
  for (const [key, bucket] of Object.entries(store)) {
    if (!bucket || typeof bucket.windowStart !== "number" || bucket.windowStart < cutoff) {
      changed = true;
      continue;
    }
    kept[key] = bucket;
  }
  return changed ? kept : store;
}

async function checkKvBucket(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  await initTables();

  const res = await updateKVAtomic<Record<string, Bucket>>(
    "rateLimits",
    (store) => {
      const now = Date.now();
      const current = pruneExpiredBuckets(store ?? {}, now, windowMs);
      const bucket = current[key];
      if (!bucket || now - bucket.windowStart >= windowMs) {
        return { ...current, [key]: { count: 1, windowStart: now } };
      }
      if (bucket.count >= limit) return undefined; // abort: limited
      return { ...current, [key]: { count: bucket.count + 1, windowStart: bucket.windowStart } };
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
