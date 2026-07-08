import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { news } from "@/db/schema";
import { and, desc, eq, like } from "drizzle-orm";

const GENERATED_TAG = "auto-meta-report";

async function getKvBinding(): Promise<any | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: any;
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }
    return env?.KV_BINDING ?? null;
  } catch { return null; }
}

function todayStr(): string {
  const d = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const kv = await getKvBinding();
    if (!kv) return NextResponse.json({ error: "No KV binding" }, { status: 500 });

    const raw = await kv.get("wow:blizzard-meta");
    if (!raw) return NextResponse.json({ error: "No pipeline data yet" }, { status: 503 });

    const data = JSON.parse(raw);
    const specs = data.specs || {};
    const season = data.season || "Unknown Season";
    const today = todayStr();
    const title = `Mythic+ Meta Report — ${today}`;

    // Check if already posted today
    const db = await getDb();
    const existing = await db
      .select({ id: news.id })
      .from(news)
      .where(and(eq(news.section, "dungeons"), like(news.title, `%${today}%`)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ skipped: true, reason: "Already posted today", id: existing[0].id });
    }

    // Sort specs by avg score (use totalPlayers as proxy for now)
    const specEntries = Object.entries(specs)
      .filter(([, s]: any) => s.totalPlayers > 0)
      .map(([id, s]: any) => ({ id, ...s }));

    // Categorize by role based on spec id patterns
    const tankSpecs = specEntries.filter(s => ["blood-death-knight","brewmaster-monk","guardian-druid","protection-paladin","protection-warrior","vengeance-demon-hunter"].includes(s.id));
    const healerSpecs = specEntries.filter(s => ["discipline-priest","holy-paladin","holy-priest","mistweaver-monk","preservation-evoker","restoration-druid","restoration-shaman"].includes(s.id));
    const dpsSpecs = specEntries.filter(s => !tankSpecs.some(t => t.id === s.id) && !healerSpecs.some(h => h.id === s.id));

    const topByScore = (list: any[]) => list.sort((a, b) => b.totalPlayers - a.totalPlayers).slice(0, 5);

    const formatTop = (list: any[], role: string): string => {
      if (list.length === 0) return `No ${role} specs with data yet.\n`;
      return list.map((s, i) => `  ${ordinal(i + 1)}. **${formatSpecName(s.id)}** — ${s.totalPlayers} players`).join("\n") + "\n";
    };

    // Get current affixes
    const affixLine = getAffixLine();

    const content = [
      `**Season:** ${season}`,
      `**Date:** ${today}`,
      ``,
      `---`,
      `**Top DPS Specs**`,
      formatTop(topByScore(dpsSpecs), "DPS"),
      ``,
      `**Top Healer Specs**`,
      formatTop(topByScore(healerSpecs), "healer"),
      ``,
      `**Top Tank Specs**`,
      formatTop(topByScore(tankSpecs), "tank"),
      ``,
      `---`,
      affixLine,
      ``,
      `*Auto-generated from raid leaderboard data. Updates daily.*`,
    ].join("\n");

    const now = Date.now();
    const result = await db.insert(news).values({
      title,
      content,
      section: "dungeons",
      tags: JSON.stringify(["mythic-plus", "meta-report", "auto-generated", "dungeons"]),
      authorId: "000000000000000000",
      authorName: "UPLINK Bot",
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ created: true, id: result[0]?.id, title });
  } catch (err) {
    console.error("Auto-generate error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function formatSpecName(specId: string): string {
  return specId
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getAffixLine(): string {
  try {
    const seasonStart = new Date("2026-03-24T15:00:00Z");
    const weekNumber = Math.floor((Date.now() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const baseIdx = (weekNumber - 1) % 2;
    const baseAffixes = ["Fortified", "Tyrannical"];
    const pool = ["Bolstering", "Raging", "Sanguine", "Storming", "Bursting", "Volcanic", "Necrotic", "Inspiring", "Spiteful", "Grievous", "Explosive", "Quaking", "Teeming", "Overflowing"];
    const rotIdx = ((weekNumber - 1) * 2) % pool.length;
    return `**This Week's Affixes:** ${baseAffixes[baseIdx]}, ${pool[rotIdx]}, ${pool[(rotIdx + 1) % pool.length]}`;
  } catch {
    return "**Affixes:** Check in-game for current affixes";
  }
}
