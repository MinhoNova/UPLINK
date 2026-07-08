import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";
import { fetchTopPlayersFromRaiderIO, fetchTopPlayersFromBlizzard, selectTopPlayersBySpec } from "@/lib/blizzard/leaderboard";
import { aggregateBySpec } from "@/lib/blizzard/aggregator";
import { getCurrentMythicPlusSeason } from "@/lib/mythicSeason";
import type { MetaPipelineResult } from "@/lib/blizzard/types";

const CACHE_KEY = "wow:blizzard-meta";
const PTR_CACHE_KEY = "wow:blizzard-meta-ptr";
const TOP_PLAYERS_PER_SPEC = 50;

async function getKvBinding(): Promise<any | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: any;
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }
    return env?.KV_BINDING ?? null;
  } catch { return null; }
}

function formatSeasonName(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return slug;
  const expMap: Record<string, string> = { tww: "The War Within", mn: "Midnight", df: "Dragonflight", sl: "Shadowlands" };
  return `${expMap[parts[1]] || parts[1]} — Season ${parts[2]}`;
}

async function readCached(cacheKey: string): Promise<MetaPipelineResult | null> {
  // Try Workers KV first (written by custom-worker pipeline), then D1
  const kv = await getKvBinding();
  if (kv) {
    try {
      const raw = await kv.get(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "timestamp" in parsed) return parsed as MetaPipelineResult;
      }
    } catch { /* fall through */ }
  }
  const d1 = await getKV(cacheKey);
  if (d1 && typeof d1 === "object" && "timestamp" in d1) return d1 as MetaPipelineResult;
  return null;
}

export async function GET(request: Request) {
  try {
    await initTables();

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const specFilter = url.searchParams.get("spec");
    const ptr = url.searchParams.get("ptr") === "1";
    const cacheKey = ptr ? PTR_CACHE_KEY : CACHE_KEY;

    // Serve cached data always — never fetch on user requests
    if (!forceRefresh) {
      const cached = await readCached(cacheKey);
      if (cached) {
        if (specFilter) {
          return NextResponse.json({ spec: cached.specs[specFilter] || null, season: cached.season, cached: true, timestamp: cached.timestamp, stale: false });
        }
        return NextResponse.json({ ...cached, cached: true, stale: false });
      }
      return NextResponse.json({ specs: {}, season: "", totalCharacters: 0, cached: false, stale: true });
    }

    // Manual refresh via ?refresh=1 (legacy path — runs pipeline synchronously)
    let seasonSlug: string;
    if (ptr) {
      seasonSlug = "season-mn-2";
    } else {
      const season = await getCurrentMythicPlusSeason();
      seasonSlug = season.slug;
    }

    const raiderPlayers = await fetchTopPlayersFromRaiderIO(seasonSlug);
    const blizzardPlayers = await fetchTopPlayersFromBlizzard(seasonSlug);

    const mergedMap = new Map<string, typeof raiderPlayers[0]>();
    for (const p of [...raiderPlayers, ...blizzardPlayers]) {
      const key = `${p.name}|${p.realm}|${p.region}|${p.specId}`;
      const existing = mergedMap.get(key);
      if (!existing || p.score > existing.score) mergedMap.set(key, p);
    }

    const displayLimit = 50;
    const profileLimit = 15;
    const playersBySpec = selectTopPlayersBySpec(Array.from(mergedMap.values()), displayLimit);
    const specs = await aggregateBySpec(playersBySpec, profileLimit);

    if (specs["havoc-demon-hunter"]) {
      specs["devourer-demon-hunter"] = specs["havoc-demon-hunter"];
    }

    const result: MetaPipelineResult = {
      specs,
      timestamp: Date.now(),
      season: ptr ? "Midnight — Season 2 (PTR Preview)" : formatSeasonName(seasonSlug),
      totalCharacters: mergedMap.size,
    };

    // Write to both KV backends for compatibility
    await setKV(cacheKey, result);
    const kv = await getKvBinding();
    if (kv) await kv.put(cacheKey, JSON.stringify(result));

    if (specFilter) {
      return NextResponse.json({ spec: specs[specFilter] || null, season: result.season, cached: false, timestamp: result.timestamp });
    }

    return NextResponse.json({ ...result, cached: false });
  } catch (err) {
    console.error("Blizzard meta pipeline error:", err);
    return NextResponse.json({ specs: {}, season: "", totalCharacters: 0, cached: true, stale: true }, { status: 500 });
  }
}