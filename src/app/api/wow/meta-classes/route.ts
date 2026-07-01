import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";

const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_KEY = "wow:meta-classes";
const CACHE_KEY_PTR = "wow:meta-classes-ptr";

const FALLBACK_RANKINGS: Record<string, number> = {
  "augmentation-evoker": 3350, "devourer-demon-hunter": 3330, "unholy-death-knight": 3310,
  "arms-warrior": 3290, "outlaw-rogue": 3280, "retribution-paladin": 3270,
  "feral-druid": 3260, "enhancement-shaman": 3250, "survival-hunter": 3240,
  "shadow-priest": 3235, "assassination-rogue": 3230, "demonology-warlock": 3225,
  "elemental-shaman": 3220, "fury-warrior": 3215, "subtlety-rogue": 3210,
  "frost-death-knight": 3205, "windwalker-monk": 3200, "beast-mastery-hunter": 3195,
  "havoc-demon-hunter": 3190, "balance-druid": 3185, "fire-mage": 3180,
  "affliction-warlock": 3175, "frost-mage": 3170, "destruction-warlock": 3165,
  "marksmanship-hunter": 3160, "arcane-mage": 3155, "holy-paladin": 3150,
  "mistweaver-monk": 3145, "restoration-druid": 3140, "preservation-evoker": 3135,
  "discipline-priest": 3130, "restoration-shaman": 3125, "holy-priest": 3120,
  "blood-death-knight": 3115, "vengeance-demon-hunter": 3110, "brewmaster-monk": 3105,
  "guardian-druid": 3100, "protection-warrior": 3095, "protection-paladin": 3090,
  "devastation-evoker": 3085,
};

function shouldRefresh(req: Request): boolean {
  const url = new URL(req.url);
  return url.searchParams.get("refresh") === "1";
}

function isPtr(req: Request): boolean {
  const url = new URL(req.url);
  return url.searchParams.get("ptr") === "1";
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
  if (score >= 3400) return "25";
  if (score >= 3300) return "24";
  if (score >= 3200) return "23";
  if (score >= 3100) return "22";
  if (score >= 3000) return "21";
  if (score >= 2900) return "20";
  if (score >= 2800) return "19";
  if (score >= 2700) return "18";
  if (score >= 2600) return "17";
  if (score >= 2500) return "16";
  if (score >= 2400) return "15";
  if (score >= 2200) return "14";
  if (score >= 2000) return "13";
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
    const ptr = isPtr(req);
    const cacheKey = ptr ? CACHE_KEY_PTR : CACHE_KEY;
    const cached = await getKV(cacheKey);
    if (!forceRefresh && cached && typeof cached === "object" && "timestamp" in cached) {
      const age = Date.now() - (cached as any).timestamp;
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ ...(cached as any), cached: true });
      }
    }

    let seasonSlug = ptr ? "season-mn-2" : "";
    let seasonDisplay = ptr ? "Midnight — Season 2 (PTR Preview)" : "";
    let rankings: any[] = [];

    if (ptr) {
      try {
        const res = await fetch(
          `https://raider.io/api/v1/mythic-plus/rankings?season=season-mn-2&region=world&dungeon=all`,
          { cache: "no-store", signal: AbortSignal.timeout(10000) }
        );
        if (res.ok) {
          const data = await res.json();
          rankings = data.rankings || [];
        }
      } catch {
        // PTR API unavailable — use projected data
      }
    } else {
      try {
        const { getCurrentMythicPlusSeason } = await import("@/lib/mythicSeason");
        const season = await getCurrentMythicPlusSeason();
        seasonSlug = season.slug;
        seasonDisplay = formatSeasonName(season.slug);
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
      const fallback = ptr
        ? Object.fromEntries(Object.entries(FALLBACK_RANKINGS).map(([k, v], i) => [k, v + (37 - i) * 3]))
        : FALLBACK_RANKINGS;
      for (const [key, score] of Object.entries(fallback)) {
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

    const payload = { roles: result, season: seasonSlug, seasonDisplay, ptr, timestamp: Date.now() };
    await setKV(cacheKey, payload);

    return NextResponse.json({ ...payload, cached: false });
  } catch (err) {
    console.error("Meta classes fetch error:", err);
    return NextResponse.json({ error: "Failed to load meta classes data" }, { status: 500 });
  }
}
