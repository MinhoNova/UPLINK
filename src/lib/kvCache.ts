import { getKV, initTables } from "@/lib/db";

/**
 * Tiny in-memory TTL cache for hot KV reads (per Worker isolate).
 *
 * The chat routes were reading the ENTIRE registeredUsers array on every poll
 * (every 4s per open chat widget) just to resolve message authors. Under load
 * that is ~15 full-array reads/minute/client. This collapses concurrent
 * requests into one D1 read per TTL window per isolate.
 *
 * Only use for read-mostly data where a few seconds of staleness is harmless
 * (profile display names/images) — never for money/counts.
 */
const cache = new Map<string, { expiresAt: number; value: any }>();

export async function getKVCached(key: string, ttlMs = 5000): Promise<any | null> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;

  await initTables();
  const value = await getKV(key);
  cache.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

/** Drop the cache for a key after a write that must be visible immediately. */
export function invalidateKVCache(key: string) {
  cache.delete(key);
}