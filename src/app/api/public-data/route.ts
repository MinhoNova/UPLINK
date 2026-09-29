import { NextResponse } from "next/server";
import {
  getPublicDataCached,
  setPublicDataCached,
  publicDataCacheKey,
} from "@/lib/cloudflareBindings";
import {
  publicDataView,
  restrictToPublicKeys,
  isPublicDataKey,
} from "@/lib/publicDataView";

export const dynamic = "force-dynamic";

/** Sentinel for "the caller asked for keys, and none of them were public". */
const NO_PUBLIC_KEYS = "__none__";

/**
 * A cached entry is only reusable if every key in it is still allowlisted.
 * Without this check a stale entry written before the allowlist tightened
 * would keep being served straight from the cache.
 */
function isCacheEntryUsable(cached: Record<string, unknown> | null): cached is Record<string, unknown> {
  if (!cached || typeof cached !== "object") return false;
  return Object.keys(cached).every((key) => isPublicDataKey(key));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const keysParam = url.searchParams.get("keys");
    // `?keys=` narrows the response, it must never widen it. Anything outside
    // the allowlist is dropped, so `?keys=directMessages` resolves to nothing
    // instead of handing the visitor the private store.
    const explicit = keysParam !== null;
    const wanted = explicit ? restrictToPublicKeys(keysParam!.split(",")) : [];
    // `explicit && wanted.length === 0` must not collide with the homepage
    // cache key, or an over-broad request would overwrite it with an empty body.
    const cacheKey = publicDataCacheKey(
      explicit ? (wanted.length > 0 ? wanted.join(",") : NO_PUBLIC_KEYS) : null
    );

    const cached = await getPublicDataCached(cacheKey);
    if (isCacheEntryUsable(cached)) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    if (explicit && wanted.length === 0) {
      return NextResponse.json({}, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: { DB?: D1Database } = {};
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }
    const d1 = env.DB;
    if (!d1) return NextResponse.json({ error: "D1 not available" }, { status: 500 });

    const { results } = await d1.prepare("SELECT key, value FROM kv_store").all<{ key: string; value: string }>();
    const data: Record<string, unknown> = {};
    for (const row of results ?? []) {
      if (wanted.length > 0) {
        if (!wanted.includes(row.key)) continue;
      } else if (!isPublicDataKey(row.key)) {
        continue;
      }
      try {
        data[row.key] = JSON.parse(row.value);
      } catch {
        data[row.key] = row.value;
      }
    }
    // One gate for both public reads: allowlisted keys, chat bodies removed,
    // per-player identifiers removed from the roster.
    const view = publicDataView(data);
    await setPublicDataCached(cacheKey, view);
    return NextResponse.json(view, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
