import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";
import { getCurrentMythicPlusSeason } from "@/lib/mythicSeason";

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_KEY = "wow:leaderboard2";
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

const ALL_SPEC_FALLBACK: { specId: string; classId: string; name: string; score: number }[] = [
  { specId: "augmentation-evoker", classId: "evoker", name: "Augmentation Evoker", score: 4340 },
  { specId: "devourer-demon-hunter", classId: "demon-hunter", name: "Devourer Demon Hunter", score: 4337 },
  { specId: "unholy-death-knight", classId: "death-knight", name: "Unholy Death Knight", score: 4333 },
  { specId: "arms-warrior", classId: "warrior", name: "Arms Warrior", score: 4318 },
  { specId: "outlaw-rogue", classId: "rogue", name: "Outlaw Rogue", score: 4318 },
  { specId: "retribution-paladin", classId: "paladin", name: "Retribution Paladin", score: 4318 },
  { specId: "feral-druid", classId: "druid", name: "Feral Druid", score: 4318 },
  { specId: "enhancement-shaman", classId: "shaman", name: "Enhancement Shaman", score: 4318 },
  { specId: "survival-hunter", classId: "hunter", name: "Survival Hunter", score: 4315 },
  { specId: "shadow-priest", classId: "priest", name: "Shadow Priest", score: 4315 },
  { specId: "assassination-rogue", classId: "rogue", name: "Assassination Rogue", score: 4315 },
  { specId: "demonology-warlock", classId: "warlock", name: "Demonology Warlock", score: 4315 },
  { specId: "elemental-shaman", classId: "shaman", name: "Elemental Shaman", score: 4315 },
  { specId: "fury-warrior", classId: "warrior", name: "Fury Warrior", score: 4315 },
  { specId: "subtlety-rogue", classId: "rogue", name: "Subtlety Rogue", score: 4315 },
  { specId: "frost-death-knight", classId: "death-knight", name: "Frost Death Knight", score: 4312 },
  { specId: "windwalker-monk", classId: "monk", name: "Windwalker Monk", score: 4312 },
  { specId: "beast-mastery-hunter", classId: "hunter", name: "Beast Mastery Hunter", score: 4312 },
  { specId: "havoc-demon-hunter", classId: "demon-hunter", name: "Havoc Demon Hunter", score: 4312 },
  { specId: "balance-druid", classId: "druid", name: "Balance Druid", score: 4312 },
  { specId: "fire-mage", classId: "mage", name: "Fire Mage", score: 4310 },
  { specId: "affliction-warlock", classId: "warlock", name: "Affliction Warlock", score: 4310 },
  { specId: "frost-mage", classId: "mage", name: "Frost Mage", score: 4310 },
  { specId: "destruction-warlock", classId: "warlock", name: "Destruction Warlock", score: 4310 },
  { specId: "marksmanship-hunter", classId: "hunter", name: "Marksmanship Hunter", score: 4310 },
  { specId: "arcane-mage", classId: "mage", name: "Arcane Mage", score: 4310 },
  { specId: "holy-paladin", classId: "paladin", name: "Holy Paladin", score: 4308 },
  { specId: "mistweaver-monk", classId: "monk", name: "Mistweaver Monk", score: 4308 },
  { specId: "restoration-druid", classId: "druid", name: "Restoration Druid", score: 4308 },
  { specId: "preservation-evoker", classId: "evoker", name: "Preservation Evoker", score: 4308 },
  { specId: "discipline-priest", classId: "priest", name: "Discipline Priest", score: 4305 },
  { specId: "restoration-shaman", classId: "shaman", name: "Restoration Shaman", score: 4305 },
  { specId: "holy-priest", classId: "priest", name: "Holy Priest", score: 4305 },
  { specId: "blood-death-knight", classId: "death-knight", name: "Blood Death Knight", score: 4305 },
  { specId: "vengeance-demon-hunter", classId: "demon-hunter", name: "Vengeance Demon Hunter", score: 4305 },
  { specId: "brewmaster-monk", classId: "monk", name: "Brewmaster Monk", score: 4302 },
  { specId: "guardian-druid", classId: "druid", name: "Guardian Druid", score: 4302 },
  { specId: "protection-warrior", classId: "warrior", name: "Protection Warrior", score: 4302 },
  { specId: "protection-paladin", classId: "paladin", name: "Protection Paladin", score: 4302 },
  { specId: "devastation-evoker", classId: "evoker", name: "Devastation Evoker", score: 4302 },
];

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
    const charMap = new Map<string, { entry: LeaderboardEntry; runScore: number }>();
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
              score: Math.round(runScore * 8),
              faction: (c.faction || "horde").toLowerCase(),
            };
            charMap.set(charKey, { entry, runScore });
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
