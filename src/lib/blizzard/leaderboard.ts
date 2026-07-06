import { getBlizzardToken } from "./auth";
import { SPECS } from "@/lib/wowData";
import type { BlizzardMythicSeason, BlizzardMythicLeaderboard } from "./types";

interface LeaderboardChar {
  name: string;
  realm: string;
  region: string;
  specId: string;
  classId: string;
  faction: string;
  score: number;
}

const BLIZZARD_SEASON_IDS: Record<string, number> = {
  "season-mn-1": 17,
  "season-mn-2": 18,
};

const BLIZZARD_SPEC_MAP: Record<string, string> = {};
for (const spec of SPECS) {
  const specPart = spec.id.slice(0, -spec.classId.length - 1);
  const blizzSpecName = specPart.replace(/-/g, " ").toLowerCase().trim();
  const blizzClassName = spec.classId.replace(/-/g, " ").toLowerCase().trim();
  BLIZZARD_SPEC_MAP[`${blizzClassName}|${blizzSpecName}`] = spec.id;
}

const REGION_HOSTS: Record<string, string> = {
  us: "https://us.api.blizzard.com",
  eu: "https://eu.api.blizzard.com",
};

export async function fetchTopPlayersFromRaiderIO(seasonSlug: string): Promise<LeaderboardChar[]> {
  try {
    const res = await fetch(
      `https://raider.io/api/v1/mythic-plus/rankings?season=${seasonSlug}&region=world&dungeon=all`,
      { cache: "no-store", headers: { "User-Agent": "Uplink/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const rankings = data.rankings || [];
    if (!Array.isArray(rankings) || rankings.length === 0) return [];

    const charMap = new Map<string, LeaderboardChar>();

    for (const r of rankings) {
      if (!r.character) continue;
      const c = r.character;
      const specName = (c.spec || "").toLowerCase().replace(/\s+/g, "-");
      const className = (c.class || "").toLowerCase().replace(/\s+/g, "-");
      const specId = specName ? `${specName}-${className}` : "";
      if (!specId) continue;

      const name = c.name || "Unknown";
      const realm = c.realm || "Unknown";
      const region = (c.region || "us").toUpperCase();
      const score = Math.round(r.score || r.mythic_plus_score || 0);
      if (score === 0) continue;

      const charKey = `${name}|${realm}|${region}`;
      const existing = charMap.get(charKey);
      if (existing && score <= existing.score) continue;

      charMap.set(charKey, {
        name,
        realm,
        region,
        specId,
        classId: className,
        faction: (c.faction || "horde").toLowerCase(),
        score,
      });
    }

    return Array.from(charMap.values());
  } catch {
    return [];
  }
}

export async function fetchTopPlayersFromBlizzard(seasonSlug: string): Promise<LeaderboardChar[]> {
  const token = await getBlizzardToken();
  if (!token) return [];

  const blizzSeasonId = BLIZZARD_SEASON_IDS[seasonSlug];
  if (!blizzSeasonId) return [];

  const allEntries: LeaderboardChar[] = [];
  const seen = new Map<string, number>();

  for (const [region, host] of Object.entries(REGION_HOSTS)) {
    try {
      const seasonUrl = `${host}/data/wow/mythic-keystone/season/${blizzSeasonId}?namespace=dynamic-${region}&locale=en_US`;
      const seasonRes = await fetch(seasonUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!seasonRes.ok) continue;

      const seasonData: BlizzardMythicSeason = await seasonRes.json();
      const leaderboardIds: number[] = (seasonData.leaderboards || [])
        .map((lb) => lb.keystone_leaderboard?.id)
        .filter(Boolean);

      const boardResults = await Promise.allSettled(
        leaderboardIds.map((lbId) =>
          fetch(`${host}/data/wow/mythic-keystone/leaderboard/${lbId}?namespace=dynamic-${region}&locale=en_US`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }).then((r) => (r.ok ? r.json() : null))
        )
      );

      for (const result of boardResults) {
        if (result.status !== "fulfilled" || !result.value?.leaders) continue;
        const board: BlizzardMythicLeaderboard = result.value;
        for (const leader of board.leaders) {
          const c = leader.character;
          if (!c) continue;
          const className = (c.playable_class?.name || "").toLowerCase().trim();
          const specName = (c.playable_spec?.name || "").toLowerCase().trim();
          const mapKey = `${className}|${specName}`;
          const specId = BLIZZARD_SPEC_MAP[mapKey];
          if (!specId) continue;

          const charKey = `${c.name}|${c.realm?.slug || ""}|${region}`;
          const mythicRating = leader.mythic_rating || 0;
          const existing = seen.get(charKey);
          if (existing && existing >= mythicRating) continue;

          seen.set(charKey, mythicRating);
          allEntries.push({
            name: c.name || "Unknown",
            realm: c.realm?.name || c.realm?.slug || "Unknown",
            region: region.toUpperCase(),
            specId,
            classId: c.playable_class?.name?.toLowerCase().replace(/\s+/g, "-") || "",
            faction: (c.faction?.type || "horde").toLowerCase(),
            score: Math.round(mythicRating),
          });
        }
      }
    } catch {
      continue;
    }
  }

  return allEntries;
}

export function selectTopPlayersBySpec(players: LeaderboardChar[], topPerSpec = 5): Map<string, LeaderboardChar[]> {
  const bySpec = new Map<string, LeaderboardChar[]>();
  for (const p of players) {
    if (!bySpec.has(p.specId)) bySpec.set(p.specId, []);
    bySpec.get(p.specId)!.push(p);
  }
  for (const [specId, list] of bySpec) {
    bySpec.set(specId, list.sort((a, b) => b.score - a.score).slice(0, topPerSpec));
  }
  return bySpec;
}
