import type { D1Database } from "@cloudflare/workers-types";

type Bucket = { count: number; windowStart: number };

/**
 * Drop buckets whose window has closed, plus a little slack.
 *
 * The store is a single `kv_store` row that every `/api` request reads, mutates
 * and writes back through the middleware, so its size is paid on every call. It
 * was never pruned: the key is `ip:<ip>:<path>`, so each new path and each new
 * address added an entry that stayed forever. It had grown past 200KB of
 * expired counters, and parsing plus rewriting that on each request is what the
 * worker was spending its time and memory on.
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
 * Hard ceiling on how many buckets are kept, so a burst of new paths or
 * addresses cannot build a large blob again before the windows expire.
 */
const MAX_BUCKETS = 5000;

function capBuckets(store: Record<string, Bucket>, now: number): Record<string, Bucket> {
  const keys = Object.keys(store);
  if (keys.length <= MAX_BUCKETS) return store;
  // Newest windows first; the oldest are the least likely to still be limiting.
  keys.sort((a, b) => (store[b]?.windowStart ?? 0) - (store[a]?.windowStart ?? 0));
  const kept: Record<string, Bucket> = {};
  for (const key of keys.slice(0, MAX_BUCKETS)) kept[key] = store[key];
  return kept;
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

const memoryBuckets = new Map<string, Bucket>();
const RATE_LIMITS_KEY = "rateLimits";

async function getD1Binding(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: { DB?: D1Database };
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }
    return (env as { DB?: D1Database }).DB ?? null;
  } catch {
    return null;
  }
}

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

/**
 * Read-modify-write the shared `rateLimits` row under compare-and-swap.
 *
 * This row also carries the per-account buckets (`user:<id>:<action>`), written
 * by `rateLimitByUser`. An unconditional `ON CONFLICT DO UPDATE SET value =
 * excluded.value` commits whatever this caller read, so any bucket that landed
 * between the read and the write is dropped — including an account counter, and
 * with it the per-account ceiling. Worse, the account counter is then asked to
 * compare-and-swap against a value that keeps being rewritten underneath it, so
 * it can lose `maxAttempts` times while sitting far below its own limit and be
 * answered as if it were throttled.
 *
 * `UPDATE ... WHERE key = ? AND value = ?` only reports a change when the row
 * still holds the value this caller read, so a lost race is detectable and the
 * caller simply re-reads. The write is compared against the raw string, not a
 * parsed object, so a concurrent writer's edit is never clobbered.
 */
async function mutateRateLimitStore<T>(
  d1: D1Database,
  mutate: (store: Record<string, Bucket>) => T | null | undefined
): Promise<{ ok: true; value: T } | { ok: false; reason: "aborted" | "conflict" }> {
  const maxAttempts = 6;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const row = await d1
      .prepare("SELECT value FROM kv_store WHERE key = ?")
      .bind(RATE_LIMITS_KEY)
      .first<{ value: string }>();
    const raw = row?.value ?? null;
    let store: Record<string, Bucket> = {};
    if (raw !== null) {
      try {
        store = JSON.parse(raw) as Record<string, Bucket>;
      } catch {
        store = {};
      }
    }

    const next = mutate(store);
    if (next === null || next === undefined) return { ok: false, reason: "aborted" };
    const serialized = JSON.stringify(next);
    // Nothing to commit (e.g. pruning that found nothing to drop).
    if (serialized === raw) return { ok: true, value: next };

    let written = false;
    if (raw === null) {
      const res = await d1
        .prepare("INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING")
        .bind(RATE_LIMITS_KEY, serialized)
        .run();
      written = (res.meta.changes ?? 0) === 1;
    } else {
      const res = await d1
        .prepare("UPDATE kv_store SET value = ? WHERE key = ? AND value = ?")
        .bind(serialized, RATE_LIMITS_KEY, raw)
        .run();
      written = (res.meta.changes ?? 0) === 1;
    }

    if (written) return { ok: true, value: next };
    // Lost the race — retry against the value the winner committed.
  }

  return { ok: false, reason: "conflict" };
}

async function checkKvBucket(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const d1 = await getD1Binding();
  if (!d1) return checkMemoryBucket(key, limit, windowMs);

  const res = await mutateRateLimitStore<Record<string, Bucket>>(d1, (store) => {
    const now = Date.now();
    // Prune first, on the read we are already paying for. This is what stops the
    // blob growing without bound.
    const pruned = capBuckets(pruneExpiredBuckets(store, now, windowMs), now);
    const bucket = pruned[key];

    if (!bucket || now - bucket.windowStart >= windowMs) {
      pruned[key] = { count: 1, windowStart: now };
      return pruned;
    }
    if (bucket.count >= limit) return undefined; // abort: limited
    bucket.count += 1;
    return pruned;
  });

  if (res.ok) return { ok: true };

  if (res.reason === "aborted") return { ok: false, retryAfterMs: windowMs };

  // Contention on the shared row, not a decision about this caller, so the
  // request is allowed through rather than answered 429. Persisting the prune is
  // best-effort: the row is being actively written by the other limiter, and
  // dropping a bounded amount of dead entries costs nothing if it does not land.
  const now = Date.now();
  try {
    await mutateRateLimitStore(d1, (store) => capBuckets(pruneExpiredBuckets(store, now, windowMs), now));
  } catch {
    // Ignore: the entries expire on their own.
  }
  return { ok: true };
}

/** D1-backed IP rate limit (shared across Workers); memory fallback in local dev. */
export async function rateLimitByIp(
  ip: string,
  path: string,
  limit = 120,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const key = `ip:${ip}:${path}`;
  return checkKvBucket(key, limit, windowMs);
}
