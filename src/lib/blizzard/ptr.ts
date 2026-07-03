import { getBlizzardToken } from "./auth";
import { SPECS } from "@/lib/wowData";

/** Hardcoded Blizzard season IDs from Raider.IO static-data */
const BLIZZARD_SEASON_IDS: Record<string, number> = {
  "season-mn-1": 17,
  "season-mn-2": 18,
};

/** Build a reverse map from (className, specName) → our specId */
const BLIZZARD_SPEC_MAP: Record<string, string> = {};
for (const spec of SPECS) {
  const specPart = spec.id.slice(0, -spec.classId.length - 1);
  const blizzSpecName = specPart.replace(/-/g, " ").toLowerCase().trim();
  const blizzClassName = spec.classId.replace(/-/g, " ").toLowerCase().trim();
  BLIZZARD_SPEC_MAP[`${blizzClassName}|${blizzSpecName}`] = spec.id;
}

export interface PtrEntry {
  name: string;
  realm: string;
  region: string;
  specId: string;
  classId: string;
  faction: string;
  score: number;
}

/**
 * Fetch Mythic+ leaderboard data from Blizzard's PTR API.
 * Uses https://ptr.api.blizzard.com with dynamic-ptr-us namespace.
 */
export async function fetchPtrMythicPlusData(seasonSlug = "season-mn-2"): Promise<{
  entries: PtrEntry[];
  seasonSlug: string;
}> {
  const token = await getBlizzardToken();
  if (!token) return { entries: [], seasonSlug };

  const blizzSeasonId = BLIZZARD_SEASON_IDS[seasonSlug];
  if (!blizzSeasonId) return { entries: [], seasonSlug };

  try {
    // Step 1: Fetch season info to get dungeon leaderboard IDs
    const seasonUrl = `https://ptr.api.blizzard.com/data/wow/mythic-keystone/season/${blizzSeasonId}?namespace=dynamic-ptr-us&locale=en_US`;
    const seasonRes = await fetch(seasonUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!seasonRes.ok) return { entries: [], seasonSlug };

    const seasonData = await seasonRes.json();
    const leaderboards: { id: number; dungeon: { name: string } }[] = (seasonData.leaderboards || []).map(
      (lb: any) => ({
        id: lb.keystone_leaderboard?.id || 0,
        dungeon: lb.dungeon || { name: "Unknown" },
      })
    );

    if (leaderboards.length === 0) return { entries: [], seasonSlug };

    // Step 2: Fetch each dungeon leaderboard
    const entries: PtrEntry[] = [];
    const seen = new Set<string>();

    const leaderboardResults = await Promise.allSettled(
      leaderboards.map((lb) =>
        fetch(
          `https://ptr.api.blizzard.com/data/wow/mythic-keystone/leaderboard/${lb.id}?namespace=dynamic-ptr-us&locale=en_US`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        ).then((r) => (r.ok ? r.json() : null))
      )
    );

    for (const result of leaderboardResults) {
      if (result.status !== "fulfilled" || !result.value?.entries) continue;
      for (const entry of result.value.entries) {
        const c = entry.character;
        if (!c) continue;

        const className = (c.playable_class?.name || "").toLowerCase().trim();
        const specName = (c.playable_spec?.name || "").toLowerCase().trim();
        const mapKey = `${className}|${specName}`;
        const specId = BLIZZARD_SPEC_MAP[mapKey];
        if (!specId) continue;

        const charKey = `${c.name}|${c.realm?.slug || ""}`;
        const mythicRating = entry.mythic_rating || 0;

        // Keep the best score per character
        const existing = seen.has(charKey);
        if (existing && entries.find((e) => `${e.name}|${e.realm}` === charKey && e.score >= mythicRating)) continue;

        if (existing) {
          const idx = entries.findIndex((e) => `${e.name}|${e.realm}` === charKey);
          if (idx >= 0) entries[idx].score = Math.max(entries[idx].score, mythicRating);
        } else {
          seen.add(charKey);
          entries.push({
            name: c.name || "Unknown",
            realm: c.realm?.name || c.realm?.slug || "Unknown",
            region: "US",
            specId,
            classId: className.replace(/\s+/g, "-"),
            faction: (c.faction?.type || "horde").toLowerCase(),
            score: Math.round(mythicRating),
          });
        }
      }
    }

    return { entries, seasonSlug };
  } catch {
    return { entries: [], seasonSlug };
  }
}
