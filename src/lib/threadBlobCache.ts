/**
 * Per-isolate read cache for the two blobs the offer thread touches.
 *
 * `lobbies` and `registeredUsers` are the two largest values in the store, and
 * the thread page reads both of them on every render: once server-side for the
 * shell, then again for the client poll. Opening a few threads in a row meant
 * several full reads plus parses of both blobs per click, which is what tipped
 * the worker into Error 1102.
 *
 * Held separately from `@/lib/kvCache` so `@/lib/db` can drop it on write
 * without importing the cache module that depends on it. Writes go through
 * `updateKVAtomic`/`setKV` in `db.ts`, which call `invalidateThreadBlobCache`
 * so the person who just edited an offer always reads their own change back.
 */
type Entry = { expiresAt: number; value: any };

const blobs = new Map<string, Entry>();

const DEFAULT_TTL_MS = 3000;

export function getThreadBlob(key: string, ttlMs: number = DEFAULT_TTL_MS): Entry | undefined {
  const hit = blobs.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt <= Date.now()) {
    blobs.delete(key);
    return undefined;
  }
  return hit;
}

export function setThreadBlob(key: string, value: any, ttlMs: number = DEFAULT_TTL_MS): void {
  blobs.set(key, { expiresAt: Date.now() + ttlMs, value });
}

/** Called after any write to `lobbies` / `registeredUsers`. */
export function invalidateThreadBlobCache(key?: string): void {
  if (key) blobs.delete(key);
  else blobs.clear();
}
