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

const FALLBACK: LeaderboardEntry[] = [
  { rank: 1, name: "Augmentation Evoker", classId: "evoker", specId: "augmentation-evoker", score: 4091, region: "US", realm: "Area 52", faction: "horde" },
  { rank: 2, name: "Devourer Demon Hunter", classId: "demon-hunter", specId: "devourer-demon-hunter", score: 4020, region: "EU", realm: "Twisting Nether", faction: "horde" },
  { rank: 3, name: "Unholy Death Knight", classId: "death-knight", specId: "unholy-death-knight", score: 3986, region: "US", realm: "Illidan", faction: "horde" },
  { rank: 4, name: "Arms Warrior", classId: "warrior", specId: "arms-warrior", score: 3897, region: "EU", realm: "Silvermoon", faction: "alliance" },
  { rank: 5, name: "Outlaw Rogue", classId: "rogue", specId: "outlaw-rogue", score: 3800, region: "US", realm: "Stormrage", faction: "alliance" },
  { rank: 6, name: "Retribution Paladin", classId: "paladin", specId: "retribution-paladin", score: 3745, region: "EU", realm: "Silvermoon", faction: "alliance" },
  { rank: 7, name: "Feral Druid", classId: "druid", specId: "feral-druid", score: 3738, region: "US", realm: "Illidan", faction: "horde" },
  { rank: 8, name: "Enhancement Shaman", classId: "shaman", specId: "enhancement-shaman", score: 3721, region: "EU", realm: "Draenor", faction: "horde" },
  { rank: 9, name: "Survival Hunter", classId: "hunter", specId: "survival-hunter", score: 3717, region: "US", realm: "Area 52", faction: "horde" },
  { rank: 10, name: "Shadow Priest", classId: "priest", specId: "shadow-priest", score: 3703, region: "EU", realm: "Ravencrest", faction: "horde" },
  { rank: 11, name: "Assassination Rogue", classId: "rogue", specId: "assassination-rogue", score: 3703, region: "US", realm: "Tichondrius", faction: "horde" },
  { rank: 12, name: "Demonology Warlock", classId: "warlock", specId: "demonology-warlock", score: 3696, region: "EU", realm: "Draenor", faction: "horde" },
  { rank: 13, name: "Elemental Shaman", classId: "shaman", specId: "elemental-shaman", score: 3684, region: "US", realm: "Area 52", faction: "horde" },
  { rank: 14, name: "Fury Warrior", classId: "warrior", specId: "fury-warrior", score: 3676, region: "EU", realm: "Tarren Mill", faction: "horde" },
  { rank: 15, name: "Subtlety Rogue", classId: "rogue", specId: "subtlety-rogue", score: 3673, region: "US", realm: "Stormrage", faction: "alliance" },
];

export async function GET() {
  try {
    await initTables();

    const cached = await getKV(CACHE_KEY);
    if (cached && typeof cached === "object" && "entries" in cached && "timestamp" in cached) {
      const age = Date.now() - (cached as any).timestamp;
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ entries: (cached as any).entries, cached: true, age, season: (cached as any).season });
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
