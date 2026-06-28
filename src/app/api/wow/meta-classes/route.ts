import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";

const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_KEY = "wow:meta-classes";

const FALLBACK_RANKINGS: Record<string, number> = {
  "affliction-warlock": 3200, "arcane-mage": 3300, "arms-warrior": 3800,
  "assassination-rogue": 2950, "augmentation-evoker": 4050, "balance-druid": 3100,
  "beast-mastery-hunter": 3550, "blood-death-knight": 3650, "brewmaster-monk": 3600,
  "demonology-warlock": 3050, "destruction-warlock": 3400, "devastation-evoker": 2650,
  "devourer-demon-hunter": 4000, "discipline-priest": 3700, "elemental-shaman": 3700,
  "enhancement-shaman": 3750, "feral-druid": 2900, "fire-mage": 3500,
  "frost-death-knight": 3200, "frost-mage": 3450, "fury-warrior": 3600,
  "guardian-druid": 3050, "havoc-demon-hunter": 2850, "holy-paladin": 3950,
  "holy-priest": 3150, "marksmanship-hunter": 2750, "mistweaver-monk": 3400,
  "outlaw-rogue": 3780, "preservation-evoker": 3900, "protection-paladin": 3850,
  "protection-warrior": 3450, "restoration-druid": 2950, "restoration-shaman": 3600,
  "retribution-paladin": 3750, "shadow-priest": 3500, "subtlety-rogue": 2800,
  "survival-hunter": 3550, "unholy-death-knight": 3900, "vengeance-demon-hunter": 3500,
  "windwalker-monk": 3150,
};

function shouldRefresh(req: Request): boolean {
  const url = new URL(req.url);
  return url.searchParams.get("refresh") === "1";
}

function formatSeasonName(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return slug;
  const expMap: Record<string, string> = { tww: "The War Within", mn: "Midnight", df: "Dragonflight", sl: "Shadowlands" };
  const exp = expMap[parts[1]] || parts[1];
  const num = parts[2];
  return `${exp} — Season ${num}`;
}

function estimateHighestKey(score: number): string {
  if (score >= 4200) return "27";
  if (score >= 4000) return "26";
  if (score >= 3800) return "25";
  if (score >= 3600) return "24";
  if (score >= 3400) return "23";
  if (score >= 3200) return "22";
  if (score >= 3000) return "21";
  if (score >= 2800) return "20";
  if (score >= 2600) return "19";
  if (score >= 2400) return "18";
  if (score >= 2200) return "17";
  if (score >= 2000) return "16";
  if (score >= 1800) return "15";
  if (score >= 1400) return "14";
  return "12";
}

function assignTier(score: number, maxScore: number, minScore: number): string {
  if (score === 0) return "F";
  const range = maxScore - minScore || 1;
  const pct = (score - minScore) / range;
  if (pct >= 0.85) return "S";
  if (pct >= 0.65) return "A";
  if (pct >= 0.40) return "B";
  if (pct >= 0.15) return "C";
  if (pct > 0) return "D";
  return "F";
}

interface MetaSpec {
  id: string;
  score: number;
  highestKey: string;
  tier: string;
}

export async function GET(req: Request) {
  try {
    await initTables();
    const forceRefresh = shouldRefresh(req);
    const cached = await getKV(CACHE_KEY);
    if (!forceRefresh && cached && typeof cached === "object" && "timestamp" in cached) {
      const age = Date.now() - (cached as any).timestamp;
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ ...(cached as any), cached: true });
      }
    }

    let seasonSlug = "";
    let rankings: any[] = [];

    try {
      const { getCurrentMythicPlusSeason } = await import("@/lib/mythicSeason");
      const season = await getCurrentMythicPlusSeason();
      seasonSlug = season.slug;
      const res = await fetch(
        `https://raider.io/api/v1/mythic-plus/rankings?season=${season.slug}&region=world&dungeon=all`,
        { cache: "no-store", signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        rankings = data.rankings || [];
      }
    } catch {
      // fallback
    }

    const { SPECS } = await import("@/lib/wowData");
    const roles = ["dps", "healer", "tank"] as const;

    const bestBySpec: Record<string, number> = {};
    for (const r of rankings) {
      const specName = (r.character?.spec || "").toLowerCase().replace(/\s+/g, "-");
      const className = (r.character?.class || "").toLowerCase().replace(/\s+/g, "-");
      const specKey = specName && className ? `${specName}-${className}` : "";
      const score = r.score || r.mythic_plus_score || 0;
      if (specKey && (!bestBySpec[specKey] || score > bestBySpec[specKey])) {
        bestBySpec[specKey] = score;
      }
    }
    if (Object.keys(bestBySpec).length < 10) {
      for (const [key, score] of Object.entries(FALLBACK_RANKINGS)) {
        bestBySpec[key] = score;
      }
    }

    const result: Record<string, { specs: MetaSpec[]; maxScore: number; minScore: number }> = {};

    for (const role of roles) {
      const roleSpecs = SPECS.filter((s: any) => s.role === role);
      const specs: MetaSpec[] = roleSpecs.map((spec: any) => {
        const score = bestBySpec[spec.id] || 0;
        return {
          id: spec.id,
          score,
          highestKey: estimateHighestKey(score),
          tier: "F",
        };
      });

      const validScores = specs.filter((s) => s.score > 0).map((s) => s.score);
      const maxScore = validScores.length ? Math.max(...validScores) : 0;
      const minScore = validScores.length ? Math.min(...validScores) : 0;

      for (const spec of specs) {
        spec.tier = assignTier(spec.score, maxScore, minScore);
      }

      result[role] = { specs, maxScore, minScore };
    }

    const payload = { roles: result, season: seasonSlug, seasonDisplay: formatSeasonName(seasonSlug), timestamp: Date.now() };
    await setKV(CACHE_KEY, payload);

    return NextResponse.json({ ...payload, cached: false });
  } catch (err) {
    console.error("Meta classes fetch error:", err);
    return NextResponse.json({ error: "Failed to load meta classes data" }, { status: 500 });
  }
}
