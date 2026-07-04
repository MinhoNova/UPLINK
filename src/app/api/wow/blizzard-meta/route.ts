import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";
import { fetchTopPlayersFromRaiderIO, selectTopPlayersBySpec } from "@/lib/blizzard/leaderboard";
import { aggregateBySpec } from "@/lib/blizzard/aggregator";
import { getCurrentMythicPlusSeason } from "@/lib/mythicSeason";
import type { MetaPipelineResult, AggregatedSpecData } from "@/lib/blizzard/types";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = "wow:blizzard-meta";
const PTR_CACHE_KEY = "wow:blizzard-meta-ptr";
const TOP_PLAYERS_PER_SPEC = 5;

function formatSeasonName(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return slug;
  const expMap: Record<string, string> = { tww: "The War Within", mn: "Midnight", df: "Dragonflight", sl: "Shadowlands" };
  return `${expMap[parts[1]] || parts[1]} — Season ${parts[2]}`;
}

export async function GET(request: Request) {
  try {
    await initTables();

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const specFilter = url.searchParams.get("spec");
    const ptr = url.searchParams.get("ptr") === "1";
    const cacheKey = ptr ? PTR_CACHE_KEY : CACHE_KEY;

    // Check cache
    if (!forceRefresh) {
      const cached = await getKV(cacheKey);
      if (cached && typeof cached === "object" && "timestamp" in cached) {
        const age = Date.now() - (cached as any).timestamp;
        if (age < CACHE_TTL_MS) {
          const data = (cached as MetaPipelineResult);
          if (specFilter) {
            return NextResponse.json({ spec: data.specs[specFilter] || null, season: data.season, cached: true, timestamp: data.timestamp });
          }
          return NextResponse.json({ ...data, cached: true });
        }
      }
    }

    // Determine season
    let seasonSlug: string;
    if (ptr) {
      seasonSlug = "season-mn-2";
    } else {
      const season = await getCurrentMythicPlusSeason();
      seasonSlug = season.slug;
    }

    // Step 1: Fetch top players from Raider.IO
    let allPlayers = await fetchTopPlayersFromRaiderIO(seasonSlug);

    // Step 2: If empty (PTR etc.), try Blizzard API directly
    if (allPlayers.length === 0) {
      const { fetchTopPlayersFromBlizzard } = await import("@/lib/blizzard/leaderboard");
      allPlayers = await fetchTopPlayersFromBlizzard(seasonSlug);
    }

    // Step 3: Select top N per spec
    const playersBySpec = selectTopPlayersBySpec(allPlayers, TOP_PLAYERS_PER_SPEC);

    // Step 4: Fetch character profiles and aggregate
    const specs = await aggregateBySpec(playersBySpec);

    // Step 5: Build result
    const result: MetaPipelineResult = {
      specs,
      timestamp: Date.now(),
      season: ptr ? "Midnight — Season 2 (PTR Preview)" : formatSeasonName(seasonSlug),
      totalCharacters: allPlayers.length,
    };

    // Cache it
    await setKV(cacheKey, result);

    // Return
    if (specFilter) {
      return NextResponse.json({ spec: specs[specFilter] || null, season: result.season, cached: false, timestamp: result.timestamp });
    }

    return NextResponse.json({ ...result, cached: false });
  } catch (err) {
    console.error("Blizzard meta pipeline error:", err);
    return NextResponse.json({ specs: {}, season: "", totalCharacters: 0, cached: true, stale: true }, { status: 500 });
  }
}
