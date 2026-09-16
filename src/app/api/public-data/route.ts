import { NextResponse } from "next/server";
import {
  getPublicDataCached,
  setPublicDataCached,
  publicDataCacheKey,
} from "@/lib/cloudflareBindings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const keysParam = url.searchParams.get("keys");
    const HOMEPAGE_KEYS = new Set([
      "lobbies", "goldOffers", "notifications", "registeredUsers",
      "characters", "applications", "bannedUsers", "bannedUserIds",
    ]);
    const cacheKey = publicDataCacheKey(keysParam);

    const cached = await getPublicDataCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
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
      if (keysParam) {
        const wanted = keysParam.split(",").filter(Boolean);
        if (!wanted.includes(row.key)) continue;
      } else if (!HOMEPAGE_KEYS.has(row.key)) {
        continue;
      }
      try {
        data[row.key] = JSON.parse(row.value);
      } catch {
        data[row.key] = row.value;
      }
    }
    await setPublicDataCached(cacheKey, data);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}