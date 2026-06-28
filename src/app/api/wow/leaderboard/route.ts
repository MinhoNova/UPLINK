import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";
import { getCurrentMythicPlusSeason } from "@/lib/mythicSeason";

const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_KEY = "wow:leaderboard";

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

const ALL_SPECS: { specId: string; classId: string; name: string; score: number }[] = [
  { specId: "augmentation-evoker", classId: "evoker", name: "Augmentation Evoker", score: 4091 },
  { specId: "devourer-demon-hunter", classId: "demon-hunter", name: "Devourer Demon Hunter", score: 4020 },
  { specId: "unholy-death-knight", classId: "death-knight", name: "Unholy Death Knight", score: 3986 },
  { specId: "arms-warrior", classId: "warrior", name: "Arms Warrior", score: 3897 },
  { specId: "outlaw-rogue", classId: "rogue", name: "Outlaw Rogue", score: 3800 },
  { specId: "retribution-paladin", classId: "paladin", name: "Retribution Paladin", score: 3745 },
  { specId: "feral-druid", classId: "druid", name: "Feral Druid", score: 3738 },
  { specId: "enhancement-shaman", classId: "shaman", name: "Enhancement Shaman", score: 3721 },
  { specId: "survival-hunter", classId: "hunter", name: "Survival Hunter", score: 3717 },
  { specId: "shadow-priest", classId: "priest", name: "Shadow Priest", score: 3703 },
  { specId: "assassination-rogue", classId: "rogue", name: "Assassination Rogue", score: 3703 },
  { specId: "demonology-warlock", classId: "warlock", name: "Demonology Warlock", score: 3696 },
  { specId: "elemental-shaman", classId: "shaman", name: "Elemental Shaman", score: 3684 },
  { specId: "fury-warrior", classId: "warrior", name: "Fury Warrior", score: 3676 },
  { specId: "subtlety-rogue", classId: "rogue", name: "Subtlety Rogue", score: 3673 },
  { specId: "frost-death-knight", classId: "death-knight", name: "Frost Death Knight", score: 3660 },
  { specId: "windwalker-monk", classId: "monk", name: "Windwalker Monk", score: 3650 },
  { specId: "beast-mastery-hunter", classId: "hunter", name: "Beast Mastery Hunter", score: 3645 },
  { specId: "havoc-demon-hunter", classId: "demon-hunter", name: "Havoc Demon Hunter", score: 3638 },
  { specId: "balance-druid", classId: "druid", name: "Balance Druid", score: 3630 },
  { specId: "fire-mage", classId: "mage", name: "Fire Mage", score: 3625 },
  { specId: "affliction-warlock", classId: "warlock", name: "Affliction Warlock", score: 3618 },
  { specId: "frost-mage", classId: "mage", name: "Frost Mage", score: 3612 },
  { specId: "destruction-warlock", classId: "warlock", name: "Destruction Warlock", score: 3605 },
  { specId: "marksmanship-hunter", classId: "hunter", name: "Marksmanship Hunter", score: 3598 },
  { specId: "arcane-mage", classId: "mage", name: "Arcane Mage", score: 3590 },
  { specId: "holy-paladin", classId: "paladin", name: "Holy Paladin", score: 3585 },
  { specId: "mistweaver-monk", classId: "monk", name: "Mistweaver Monk", score: 3578 },
  { specId: "restoration-druid", classId: "druid", name: "Restoration Druid", score: 3570 },
  { specId: "preservation-evoker", classId: "evoker", name: "Preservation Evoker", score: 3562 },
  { specId: "discipline-priest", classId: "priest", name: "Discipline Priest", score: 3555 },
  { specId: "restoration-shaman", classId: "shaman", name: "Restoration Shaman", score: 3548 },
  { specId: "holy-priest", classId: "priest", name: "Holy Priest", score: 3540 },
  { specId: "blood-death-knight", classId: "death-knight", name: "Blood Death Knight", score: 3532 },
  { specId: "vengeance-demon-hunter", classId: "demon-hunter", name: "Vengeance Demon Hunter", score: 3525 },
  { specId: "brewmaster-monk", classId: "monk", name: "Brewmaster Monk", score: 3518 },
  { specId: "guardian-druid", classId: "druid", name: "Guardian Druid", score: 3510 },
  { specId: "protection-warrior", classId: "warrior", name: "Protection Warrior", score: 3502 },
  { specId: "protection-paladin", classId: "paladin", name: "Protection Paladin", score: 3495 },
  { specId: "devastation-evoker", classId: "evoker", name: "Devastation Evoker", score: 3488 },
];

const FALLBACK: LeaderboardEntry[] = ALL_SPECS.map((s, i) => ({
  rank: i + 1,
  name: s.name,
  classId: s.classId,
  specId: s.specId,
  score: s.score,
  region: i % 2 === 0 ? "US" : "EU",
  realm: i % 2 === 0 ? "Area 52" : "Silvermoon",
  faction: i % 2 === 0 ? "horde" : "alliance",
}));

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

    let entries: LeaderboardEntry[] = [];
    let seasonSlug = "";

    try {
      const season = await getCurrentMythicPlusSeason();
      seasonSlug = season.slug;
      const res = await fetch(
        `https://raider.io/api/v1/mythic-plus/rankings?season=${season.slug}&region=world&dungeon=all`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        entries = (data.rankings || []).slice(0, 50).map((r: any, i: number) => ({
          rank: i + 1,
          name: r.name || r.character?.name || "Unknown",
          classId: (r.class || r.character?.class || "").toLowerCase().replace(/\s+/g, "-"),
          specId: ((r.spec || r.character?.spec || "") + "-" + (r.class || r.character?.class || "")).toLowerCase().replace(/\s+/g, "-").replace(/^-+|-+$/g, ""),
          score: r.score || r.mythic_plus_score || 0,
          region: (r.region || r.character?.region || "US").toUpperCase(),
          realm: r.realm || r.character?.realm || "Unknown",
          faction: (r.faction || r.character?.faction || "horde").toLowerCase(),
        }));
      }
    } catch {
      // API failed -> use fallback
    }

    if (entries.length === 0) {
      entries = FALLBACK;
    }

    const seasonDisplay = formatSeasonName(seasonSlug);
    await setKV(CACHE_KEY, { entries, season: seasonSlug, seasonDisplay, timestamp: Date.now() });

    return NextResponse.json({ entries, season: seasonSlug, seasonDisplay, cached: false });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({ entries: FALLBACK, season: "", cached: true, stale: true });
  }
}
