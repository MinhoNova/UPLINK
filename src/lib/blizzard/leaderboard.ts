import { getBlizzardToken } from "./auth";
import { SPECS } from "@/lib/wowData";


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

const BLIZZARD_SPECIALIZATION_IDS: Record<string, number> = {
  "arcane-mage": 62, "fire-mage": 63, "frost-mage": 64,
  "holy-paladin": 65, "protection-paladin": 66, "retribution-paladin": 70,
  "arms-warrior": 71, "fury-warrior": 72, "protection-warrior": 73,
  "balance-druid": 102, "feral-druid": 103, "guardian-druid": 104, "restoration-druid": 105,
  "blood-death-knight": 250, "frost-death-knight": 251, "unholy-death-knight": 252,
  "beast-mastery-hunter": 253, "marksmanship-hunter": 254, "survival-hunter": 255,
  "discipline-priest": 256, "holy-priest": 257, "shadow-priest": 258,
  "assassination-rogue": 259, "outlaw-rogue": 260, "subtlety-rogue": 261,
  "elemental-shaman": 262, "enhancement-shaman": 263, "restoration-shaman": 264,
  "affliction-warlock": 265, "demonology-warlock": 266, "destruction-warlock": 267,
  "brewmaster-monk": 268, "windwalker-monk": 269, "mistweaver-monk": 270,
  "havoc-demon-hunter": 577, "vengeance-demon-hunter": 581,
  "devastation-evoker": 1467, "preservation-evoker": 1468, "augmentation-evoker": 1473,
  "devourer-demon-hunter": 1480,
};

const BLIZZARD_SPEC_ID_FROM_BLIZZARD: Record<number, string> = {};
for (const [slug, blizzId] of Object.entries(BLIZZARD_SPECIALIZATION_IDS)) {
  BLIZZARD_SPEC_ID_FROM_BLIZZARD[blizzId] = slug;
}

const SPEC_CLASS_LOOKUP: Record<string, string> = {};
for (const spec of SPECS) {
  SPEC_CLASS_LOOKUP[spec.id] = spec.classId;
}

const REGION_HOSTS: Record<string, string> = {
  us: "https://us.api.blizzard.com",
  eu: "https://eu.api.blizzard.com",
  kr: "https://kr.api.blizzard.com",
  tw: "https://tw.api.blizzard.com",
};

const REGION_MAX_CRS: Record<string, number> = {
  us: 40,
  eu: 30,
  kr: 4,
  tw: 5,
};

/** Maps hero talent spec keys to their parent spec for data collection purposes. */
const HERO_TO_PARENT: Record<string, string> = {
  "devourer-demon-hunter": "havoc-demon-hunter",
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchRaiderIORegion(seasonSlug: string, region: string, expectedSpecs: string[], minPlayers: number, maxPages: number): Promise<(LeaderboardChar & { runScore: number })[]> {
  const charMap = new Map<string, LeaderboardChar & { runScore: number }>();
  for (let page = 0; page < maxPages; page++) {
    const specCounts = new Map<string, number>();
    for (const [, v] of charMap) {
      specCounts.set(v.specId, (specCounts.get(v.specId) || 0) + 1);
    }
    if (expectedSpecs.every((s) => (specCounts.get(s) || 0) >= minPlayers)) break;
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
          if (!expectedSpecs.includes(resolvedKey)) continue;
          const charKey = `${c.name}|${c.realm?.slug || ""}|${region}`;
          const existing = charMap.get(charKey);
          if (existing && runScore <= existing.runScore) continue;
          const runLevel = ranking.run.mythic_level || 0;
          const ALL_TIMED: Record<number, number> = {2:1240,3:1360,4:1480,5:1720,6:1840,7:2080,8:2200,9:2320,10:2560,11:2680,12:2920,13:3040,14:3160,15:3280,16:3400,17:3520,18:3640,19:3760,20:3880,21:4000,22:4120,23:4240,24:4360,25:4480,26:4600,27:4720,28:4840,29:4960};
          const estimatedTotal = runLevel >= 2 ? Math.round((ALL_TIMED[runLevel] || runScore * 8) * 0.88) : Math.round(runScore * 6);
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
      await sleep(350);
    } catch { continue; }
  }
  return Array.from(charMap.values());
}

export async function fetchTopPlayersFromRaiderIO(seasonSlug: string): Promise<LeaderboardChar[]> {
  const regions = ["us", "eu", "kr", "tw"];
  const MIN_PLAYERS_PER_SPEC = 50;
  const MAX_PAGES = 50;
  const PAGE_DELAY_MS = 350;
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

  // Fetch regions sequentially to respect RaiderIO rate limits (10 req/10 sec)
  const mergedMap = new Map<string, LeaderboardChar & { runScore: number }>();
  for (const region of regions) {
    const regionChars = await fetchRaiderIORegion(seasonSlug, region, EXPECTED_SPECS, MIN_PLAYERS_PER_SPEC, MAX_PAGES);
    for (const c of regionChars) {
      const key = `${c.name}|${c.realm}|${c.region}|${c.specId}`;
      const existing = mergedMap.get(key);
      if (!existing || c.score > existing.score) mergedMap.set(key, c);
    }
    await sleep(2000);
  }
  return Array.from(mergedMap.values());
}

async function fetchCRLeaderboards(token: string, host: string, region: string, crId: number): Promise<LeaderboardChar[]> {
  const entries: LeaderboardChar[] = [];
  let lbs: { id: number; key: { href: string } }[] = [];
  let periodId = "";

  try {
    const lbIndexUrl = `${host}/data/wow/connected-realm/${crId}/mythic-leaderboard/index?namespace=dynamic-${region}&locale=en_US`;
    const lbIndexRes = await fetch(lbIndexUrl, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (!lbIndexRes.ok) return [];
    const lbIndex: { current_leaderboards: { id: number; key: { href: string } }[] } = await lbIndexRes.json();
    lbs = lbIndex.current_leaderboards || [];
    if (lbs.length === 0) return [];
    const periodMatch = lbs[0].key.href.match(/\/period\/(\d+)/);
    if (!periodMatch) return [];
    periodId = periodMatch[1];
  } catch {
    return [];
  }

  const results = await Promise.allSettled(
    lbs.map((lb) =>
      fetch(`${host}/data/wow/connected-realm/${crId}/mythic-leaderboard/${lb.id}/period/${periodId}?namespace=dynamic-${region}&locale=en_US`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(10000),
      })
        .then((r) => (r.ok ? r.json() : null))
    )
  );

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value?.leading_groups) continue;
    const groups: {
      mythic_rating?: { rating: number };
      members: { profile: { name: string; realm: { slug: string } }; faction: { type: string }; specialization: { id: number } }[];
    }[] = result.value.leading_groups;

    for (const group of groups) {
      const groupScore = group.mythic_rating?.rating ?? 0;
      for (const member of group.members) {
        const specId = member.specialization?.id;
        if (!specId) continue;
        const specSlug = BLIZZARD_SPEC_ID_FROM_BLIZZARD[specId];
        if (!specSlug) continue;
        const resolvedSpec = HERO_TO_PARENT[specSlug] || specSlug;
        entries.push({
          name: member.profile.name,
          realm: member.profile.realm.slug,
          region: region.toUpperCase(),
          specId: resolvedSpec,
          classId: SPEC_CLASS_LOOKUP[resolvedSpec] || "",
          faction: (member.faction?.type || "HORDE").toLowerCase(),
          score: Math.round(groupScore),
        });
      }
    }
  }

  return entries;
}

async function processRegion(token: string, region: string, host: string): Promise<LeaderboardChar[]> {
  const regionEntries: LeaderboardChar[] = [];
  const regionSeen = new Map<string, number>();

  let sampledCRs: { href: string }[] = [];
  try {
    const crIndexRes = await fetch(`${host}/data/wow/connected-realm/index?namespace=dynamic-${region}&locale=en_US`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!crIndexRes.ok) return [];
    const crIndex: { connected_realms: { href: string }[] } = await crIndexRes.json();
    sampledCRs = (crIndex.connected_realms || []).slice(0, REGION_MAX_CRS[region] || 10);
  } catch {
    return [];
  }

  for (let i = 0; i < sampledCRs.length; i += 5) {
    const batch = sampledCRs.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map((crRef) => {
        const m = crRef.href.match(/\/(\d+)\?/);
        return m ? fetchCRLeaderboards(token, host, region, parseInt(m[1])) : Promise.resolve([]);
      })
    );

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const entry of result.value) {
        const charKey = `${entry.name}|${entry.realm}|${entry.region}|${entry.specId}`;
        const existing = regionSeen.get(charKey);
        if (existing && existing >= entry.score) continue;
        regionSeen.set(charKey, entry.score);
        regionEntries.push(entry);
      }
    }
  }

  return regionEntries;
}

export async function fetchTopPlayersFromBlizzard(seasonSlug: string, env?: { BATTLENET_CLIENT_ID?: string; BATTLENET_CLIENT_SECRET?: string }): Promise<LeaderboardChar[]> {
  const token = await getBlizzardToken(env);
  if (!token) return [];

  const allEntries: LeaderboardChar[] = [];
  const seenKeys = new Map<string, number>();

  for (const [region, host] of Object.entries(REGION_HOSTS)) {
    const regionEntries = await processRegion(token, region, host);
    for (const entry of regionEntries) {
      const charKey = `${entry.name}|${entry.realm}|${entry.region}|${entry.specId}`;
      const existing = seenKeys.get(charKey);
      if (existing && existing >= entry.score) continue;
      seenKeys.set(charKey, entry.score);
      allEntries.push(entry);
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
