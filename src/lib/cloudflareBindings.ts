import type { KVNamespace } from "@cloudflare/workers-types";

export async function getKVBinding(): Promise<KVNamespace | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: any;
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }
    return env.KV_BINDING ?? null;
  } catch {
    return null;
  }
}

const PUBLIC_DATA_CACHE_PREFIX = "public-data:v1:";
export const FULL_DATA_CACHE_KEY = "public-data:v1:full";
const PUBLIC_DATA_CACHE_TTL = 15;

type PublicDataMap = Record<string, unknown>;

export function publicDataCacheKey(keysParam: string | null): string {
  return PUBLIC_DATA_CACHE_PREFIX + (keysParam ? keysParam.split(",").sort().join(",") : "home");
}

export async function getPublicDataCached(cacheKey: string): Promise<PublicDataMap | null> {
  try {
    const kv = await getKVBinding();
    if (!kv) return null;
    const raw = await kv.get(cacheKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PublicDataMap;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export async function setPublicDataCached(cacheKey: string, data: PublicDataMap) {
  try {
    const kv = await getKVBinding();
    if (!kv) return;
    await kv.put(cacheKey, JSON.stringify(data), { expirationTtl: PUBLIC_DATA_CACHE_TTL });
  } catch {
    /* cache is best-effort */
  }
}

export async function invalidatePublicDataCache() {
  try {
    const kv = await getKVBinding();
    if (!kv) return;
    const keys = await kv.list({ prefix: PUBLIC_DATA_CACHE_PREFIX });
    for (const item of keys.keys) {
      await kv.delete(item.name);
    }
  } catch {
    /* cache is best-effort */
  }
}
