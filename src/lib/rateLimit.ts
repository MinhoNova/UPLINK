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

/**
 * Retries for a lost compare-and-swap before giving up and letting the request
 * through unscored. Generous because the contention is between two writers on
 * one row rather than between the caller and anything it depends on.
 */
const CONFLICT_RETRIES = 6;

async function checkKvBucket(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  await initTables();

  const mutateBucket = (store: Record<string, Bucket> | null) => {
    const now = Date.now();
    const current = pruneExpiredBuckets(store ?? {}, now, windowMs);
    const bucket = current[key];
    if (!bucket || now - bucket.windowStart >= windowMs) {
      return { ...current, [key]: { count: 1, windowStart: now } };
    }
    if (bucket.count >= limit) return undefined; // abort: limited
    return { ...current, [key]: { count: bucket.count + 1, windowStart: bucket.windowStart } };
  };

  const res = await updateKVAtomic<Record<string, Bucket>>("rateLimits", mutateBucket, {
    maxAttempts: CONFLICT_RETRIES,
  });

  if (!res.ok) {
    // Only a deliberate abort means "you are over the limit". Losing the
    // compare-and-swap is contention on the shared `rateLimits` row, not a
    // decision about this caller: the per-address limiter writes the same row
    // with its own strategy, so two sessions on one machine can push this past
    // `maxAttempts` while sitting at 1 request of a 90 budget. Reporting that as
    // 429 throttles a caller that did nothing wrong, and on `/api/data` the 429
    // is returned before the line that stamps `lastSeenAt` — so the account
    // stops being reported as present and drops off the Online Now list.
    //
    // Retrying is safe: `mutate` is pure, and the bucket is only ever
    // incremented, so a retry that wins just counts the request once.
    if (res.reason === "conflict") {
      for (let i = 0; i < CONFLICT_RETRIES; i += 1) {
        const retry = await updateKVAtomic<Record<string, Bucket>>(
          "rateLimits",
          mutateBucket,
          { maxAttempts: CONFLICT_RETRIES }
        );
        if (retry.ok) return { ok: true };
        if (retry.reason === "aborted") return { ok: false, retryAfterMs: windowMs };
      }
      return { ok: true };
    }
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
