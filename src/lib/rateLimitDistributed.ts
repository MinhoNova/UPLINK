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

async function readRateLimitStore(d1: D1Database): Promise<Record<string, Bucket>> {
  const row = await d1
    .prepare("SELECT value FROM kv_store WHERE key = ?")
    .bind(RATE_LIMITS_KEY)
    .first<{ value: string }>();
  if (!row?.value) return {};
  try {
    return JSON.parse(row.value) as Record<string, Bucket>;
  } catch {
    return {};
  }
}

async function writeRateLimitStore(d1: D1Database, store: Record<string, Bucket>): Promise<void> {
  await d1
    .prepare(
      "INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .bind(RATE_LIMITS_KEY, JSON.stringify(store))
    .run();
}

async function checkKvBucket(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const d1 = await getD1Binding();
  if (!d1) return checkMemoryBucket(key, limit, windowMs);

  const store = await readRateLimitStore(d1);
  const now = Date.now();
  // Prune first, on the read we are already paying for. This is what stops the
  // blob growing without bound.
  const pruned = capBuckets(pruneExpiredBuckets(store, now, windowMs), now);
  const bucket = pruned[key];

  if (!bucket || now - bucket.windowStart >= windowMs) {
    pruned[key] = { count: 1, windowStart: now };
    await writeRateLimitStore(d1, pruned);
    return { ok: true };
  }

  if (bucket.count >= limit) {
    // Persist the pruning even on the denied path, so a flood cannot keep the
    // dead entries alive.
    if (pruned !== store) await writeRateLimitStore(d1, pruned);
    return { ok: false, retryAfterMs: windowMs - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  await writeRateLimitStore(d1, pruned);
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
