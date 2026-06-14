import type { D1Database } from "@cloudflare/workers-types";

type Bucket = { count: number; windowStart: number };

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
  const bucket = store[key];

  if (!bucket || now - bucket.windowStart >= windowMs) {
    store[key] = { count: 1, windowStart: now };
    await writeRateLimitStore(d1, store);
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: windowMs - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  store[key] = bucket;
  await writeRateLimitStore(d1, store);
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
