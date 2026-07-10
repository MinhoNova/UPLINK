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
  race?: string;
  itemLevel?: number;
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

/** Maps hero talent spec keys to their parent spec for data collection purposes. */
const HERO_TO_PARENT: Record<string, string> = {
  "devourer-demon-hunter": "havoc-demon-hunter",
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchTopPlayersFromRaiderIO(seasonSlug: string): Promise<LeaderboardChar[]> {
  const charMap = new Map<string, LeaderboardChar & { runScore: number }>();
  const regions = ["us", "eu", "kr", "tw"];
  const MIN_PLAYERS_PER_SPEC = 50;
  const MAX_PAGES = 150;
  const EXPECTED_SPECS = [
    "affliction-warlock","arcane-mage","arms-warrior","assassination-rogue",
    "augmentation-evoker","balance-druid","beast-mastery-hunter","blood-death-knight",
    "brewmaster-monk","demonology-warlock","destruction-warlock","devastation-evoker",
    "discipline-priest","elemental-shaman","enhancement-shaman","feral-druid",
    "fire-mage","frost-death-knight","frost-mage","fury-warrior","guardian-druid",
    "havoc-demon-hunter","holy-paladin","holy-priest","marksmanship-hunter",
    "mistweaver-monk","outlaw-rogue","preservation-evoker","protection-paladin",
    "protection-warrior","restoration-druid","restoration-shaman","retribution-paladin",
    "shadow-priest","subtlety-rogue","survival-hunter","unholy-death-knight",
    "vengeance-demon-hunter","windwalker-monk",
  ];

  for (const region of regions) {
    for (let page = 0; page < MAX_PAGES; page++) {
      // Check if all expected specs have enough players
      const specCounts = new Map<string, number>();
      for (const [, v] of charMap) {
        specCounts.set(v.specId, (specCounts.get(v.specId) || 0) + 1);
      }
      const allCovered = EXPECTED_SPECS.every((s) => (specCounts.get(s) || 0) >= MIN_PLAYERS_PER_SPEC);
      if (allCovered) break;

      try {
        const res = await fetch(
          `https://raider.io/api/v1/mythic-plus/runs?season=${seasonSlug}&region=${region}&page=${page}`,
          { cache: "no-store", headers: { "User-Agent": "Uplink/1.0" }, signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) continue;

        const data = await res.json();
        const rankings = data.rankings || [];
        if (!Array.isArray(rankings) || rankings.length === 0) break;

        for (const ranking of rankings) {
          const runScore = ranking.score || 0;
          if (!ranking.run?.roster) continue;
          for (const member of ranking.run.roster) {
            const c = member.character;
            if (!c) continue;
            const specKey = `${(c.spec?.slug || "").toLowerCase()}-${(c.class?.slug || "").toLowerCase()}`;
            if (!specKey || specKey === "-") continue;
            const resolvedKey = HERO_TO_PARENT[specKey] || specKey;
            if (!EXPECTED_SPECS.includes(resolvedKey)) continue;
            const charKey = `${c.name}|${c.realm?.slug || ""}|${region}`;
            const existing = charMap.get(charKey);
            if (existing && runScore <= existing.runScore) continue;
          // Estimate total M+ score from mythic level
          const runLevel = ranking.run.mythic_level || 0;
          const ALL_TIMED: Record<number, number> = {2:1240,3:1360,4:1480,5:1720,6:1840,7:2080,8:2200,9:2320,10:2560,11:2680,12:2920,13:3040,14:3160,15:3280,16:3400,17:3520,18:3640,19:3760,20:3880,21:4000,22:4120,23:4240,24:4360,25:4480,26:4600,27:4720,28:4840,29:4960};
          const estimatedTotal = runLevel >= 2 ? Math.round((ALL_TIMED[runLevel] || runScore * 8) * 0.75) : Math.round(runScore * 6);
          charMap.set(charKey, {
            name: c.name || "Unknown",
            realm: c.realm?.name || c.realm?.slug || "Unknown",
            region: region.toUpperCase(),
            specId: resolvedKey,
            classId: (c.class?.slug || "").toLowerCase(),
            faction: (c.faction || "horde").toLowerCase(),
            score: Math.max(runScore, estimatedTotal),
            runScore,
            race: c.race?.name || undefined,
            itemLevel: c.item_level ? Math.round(c.item_level) : undefined,
          });
          }
        }

        await sleep(300);
      } catch {
        continue;
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
