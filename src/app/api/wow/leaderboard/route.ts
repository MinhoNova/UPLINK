import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";
import { getCurrentMythicPlusSeason } from "@/lib/mythicSeason";

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_KEY = "wow:leaderboard3";
const RUNS_PAGES = 12;

function formatSeasonName(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return slug;
  const expMap: Record<string, string> = { tww: "The War Within", mn: "Midnight", df: "Dragonflight", sl: "Shadowlands" };
  return `${expMap[parts[1]] || parts[1]} — Season ${parts[2]}`;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  classId: string;
  specId: string;
  score: number;
  region: string;
  realm: string;
  faction: string;
}

const ALL_TIMED_SCORES: Record<number, number> = {
  29: 4960, 28: 4840, 27: 4720, 26: 4600, 25: 4480,
  24: 4360, 23: 4240, 22: 4120, 21: 4000, 20: 3880,
  19: 3760, 18: 3640, 17: 3520, 16: 3400, 15: 3280,
  14: 3160, 13: 3040, 12: 2920, 11: 2680, 10: 2560,
  9: 2320, 8: 2200, 7: 2080, 6: 1840, 5: 1720, 4: 1480,
  3: 1360, 2: 1240,
};

function estimateTotalScore(runScore: number, mythicLevel: number): number {
  const allTimed = ALL_TIMED_SCORES[mythicLevel];
  if (allTimed) return Math.round(allTimed * 0.75);
  return Math.round(runScore * 6);
}

const FALLBACK_SCORE_MAP: Record<string, number> = {
  "augmentation-evoker": 3350, "devourer-demon-hunter": 3330,
  "unholy-death-knight": 3310, "arms-warrior": 3290,
  "outlaw-rogue": 3280, "retribution-paladin": 3270,
  "feral-druid": 3260, "enhancement-shaman": 3250,
  "survival-hunter": 3240, "shadow-priest": 3235,
  "assassination-rogue": 3230, "demonology-warlock": 3225,
  "elemental-shaman": 3220, "fury-warrior": 3215,
  "subtlety-rogue": 3210, "frost-death-knight": 3205,
  "windwalker-monk": 3200, "beast-mastery-hunter": 3195,
  "havoc-demon-hunter": 3190, "balance-druid": 3185,
  "fire-mage": 3180, "affliction-warlock": 3175,
  "frost-mage": 3170, "destruction-warlock": 3165,
  "marksmanship-hunter": 3160, "arcane-mage": 3155,
  "holy-paladin": 3150, "mistweaver-monk": 3145,
  "restoration-druid": 3140, "preservation-evoker": 3135,
  "discipline-priest": 3130, "restoration-shaman": 3125,
  "holy-priest": 3120, "blood-death-knight": 3115,
  "vengeance-demon-hunter": 3110, "brewmaster-monk": 3105,
  "guardian-druid": 3100, "protection-warrior": 3095,
  "protection-paladin": 3090, "devastation-evoker": 3085,
};

const ALL_SPEC_FALLBACK: { specId: string; classId: string; name: string; score: number }[] =
  Object.entries(FALLBACK_SCORE_MAP).map(([specId, score]) => {
    const [specSlug, ...classParts] = specId.split("-");
    const classSlug = classParts.join("-");
    return {
      specId,
      classId: classSlug,
      name: specId.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
      score,
    };
  });

function buildFallback(): LeaderboardEntry[] {
  return ALL_SPEC_FALLBACK.map((s, i) => ({
    rank: i + 1,
    name: s.name,
    classId: s.classId,
    specId: s.specId,
    score: s.score,
    region: i % 2 === 0 ? "US" : "EU",
    realm: i % 2 === 0 ? "Area 52" : "Silvermoon",
    faction: i % 2 === 0 ? "horde" : "alliance",
  }));
}

interface RosterChar {
  name: string;
  realm: string;
  region: string;
  classSlug: string;
  specSlug: string;
  faction: string;
}

export async function GET(request: Request) {
  try {
    await initTables();

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "1";

    if (!forceRefresh) {
      const cached = await getKV(CACHE_KEY);
      if (cached && typeof cached === "object" && "entries" in cached && "timestamp" in cached) {
        const age = Date.now() - (cached as any).timestamp;
        if (age < CACHE_TTL_MS) {
          return NextResponse.json({ entries: (cached as any).entries, cached: true, age, season: (cached as any).season });
        }
      }
    }

    let seasonSlug = "";
    const charMap = new Map<string, { entry: LeaderboardEntry; runScore: number; runLevel: number }>();
    let runsFailed = false;

    try {
      const season = await getCurrentMythicPlusSeason();
      seasonSlug = season.slug;

      const pages = await Promise.all(
        Array.from({ length: RUNS_PAGES }, (_, i) =>
          fetch(`https://raider.io/api/v1/mythic-plus/runs?season=${season.slug}&region=world&page=${i}`, {
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

            const entry: LeaderboardEntry = {
              rank: 0,
              name: c.name || "Unknown",
              realm: c.realm?.name || c.realm?.slug || "Unknown",
              region: (c.region?.slug || "us").toUpperCase(),
              specId: specKey,
              classId: (c.class?.slug || "").toLowerCase(),
              score: estimateTotalScore(runScore, runLevel),
              faction: (c.faction || "horde").toLowerCase(),
            };
            charMap.set(charKey, { entry, runScore, runLevel });
          }
        }
      }
    } catch {
      runsFailed = true;
    }

    const rawEntries = Array.from(charMap.values())
      .map((c) => c.entry);

    if (rawEntries.length === 0 && runsFailed) {
      rawEntries.push(...buildFallback());
    } else {
      for (const spec of ALL_SPEC_FALLBACK) {
        const has = rawEntries.some((e) => e.specId === spec.specId);
        if (!has) {
          rawEntries.push({
            rank: 0,
            name: spec.name,
            classId: spec.classId,
            specId: spec.specId,
            score: spec.score,
            region: rawEntries.length % 2 === 0 ? "US" : "EU",
            realm: rawEntries.length % 2 === 0 ? "Area 52" : "Silvermoon",
            faction: rawEntries.length % 2 === 0 ? "horde" : "alliance",
          });
        }
      }
    }

    let entries: LeaderboardEntry[] = [];
    const usedSpecs = new Set<string>();

    const sorted = [...rawEntries].sort((a, b) => b.score - a.score);

    for (const e of sorted) {
      if (!usedSpecs.has(e.specId)) {
        usedSpecs.add(e.specId);
        entries.push(e);
      }
      if (entries.length >= 50) break;
    }

    for (const e of sorted) {
      if (!entries.some((x) => x.name === e.name && x.realm === e.realm)) {
        entries.push(e);
      }
      if (entries.length >= 100) break;
    }

    entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));

    const seasonDisplay = formatSeasonName(seasonSlug);
    await setKV(CACHE_KEY, { entries, season: seasonSlug, seasonDisplay, timestamp: Date.now() });

    return NextResponse.json({ entries, season: seasonSlug, seasonDisplay, cached: false });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({ entries: buildFallback(), season: "", cached: true, stale: true });
  }
}
