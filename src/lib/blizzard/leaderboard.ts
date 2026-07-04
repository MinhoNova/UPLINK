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

const RUNS_PAGES = 12;

function estimateTotalScore(runScore: number, mythicLevel: number): number {
  const ALL_TIMED_SCORES: Record<number, number> = {
    29: 4960, 28: 4840, 27: 4720, 26: 4600, 25: 4480,
    24: 4360, 23: 4240, 22: 4120, 21: 4000, 20: 3880,
    19: 3760, 18: 3640, 17: 3520, 16: 3400, 15: 3280,
    14: 3160, 13: 3040, 12: 2920, 11: 2680, 10: 2560,
    9: 2320, 8: 2200, 7: 2080, 6: 1840, 5: 1720, 4: 1480,
    3: 1360, 2: 1240,
  };
  const allTimed = ALL_TIMED_SCORES[mythicLevel];
  if (allTimed) return Math.round(allTimed * 0.75);
  return Math.round(runScore * 6);
}

export async function fetchTopPlayersFromRaiderIO(seasonSlug: string): Promise<LeaderboardChar[]> {
  const charMap = new Map<string, LeaderboardChar & { runScore: number }>();

  const pages = await Promise.all(
    Array.from({ length: RUNS_PAGES }, (_, i) =>
      fetch(`https://raider.io/api/v1/mythic-plus/runs?season=${seasonSlug}&region=world&page=${i}`, {
        cache: "no-store",
        headers: { "User-Agent": "Uplink/1.0" },
        signal: AbortSignal.timeout(6000),
      }).then((r) => (r.ok ? r.json() : null))
    )
  );

  for (const page of pages) {
    if (!page?.rankings) continue;
    for (const ranking of page.rankings) {
      const runScore = ranking.score || 0;
      const runLevel = ranking.run?.mythic_level || 0;
      for (const member of ranking.run?.roster || []) {
        const c = member.character;
        if (!c) continue;
        const specKey = `${(c.spec?.slug || "").toLowerCase()}-${(c.class?.slug || "").toLowerCase()}`;
        const charKey = `${c.name}|${c.realm?.slug || ""}|${c.region?.slug || ""}`;
        const existing = charMap.get(charKey);
        if (existing && runScore <= existing.runScore) continue;
        charMap.set(charKey, {
          name: c.name || "Unknown",
          realm: c.realm?.name || c.realm?.slug || "Unknown",
          region: (c.region?.slug || "us").toUpperCase(),
          specId: specKey,
          classId: (c.class?.slug || "").toLowerCase(),
          faction: (c.faction || "horde").toLowerCase(),
          score: estimateTotalScore(runScore, runLevel),
          runScore,
        });
      }
    }
  }

  return Array.from(charMap.values());
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
