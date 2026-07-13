import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { news } from "@/db/schema";
import { and, desc, eq, like } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";

const RSS_URL = "https://www.bluetracker.gg/rss/wow/";
const GENERATED_TAG = "auto-meta-report";
const PIPELINE_TAGS = ["blizzard-tracker", "auto-generated"];

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

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("class tuning")) return "Class Tuning";
  if (lower.includes("mythic") || lower.includes("dungeon")) return "Dungeons";
  if (lower.includes("hotfix")) return "Hotfixes";
  if (lower.includes("ptr") || lower.includes("development notes") || lower.includes("testing")) return "PTR";
  if (lower.includes("blog") || lower.includes("wow weekly") || lower.includes("wowcast")) return "Blog";
  if (lower.includes("feedback")) return "Feedback";
  if (lower.includes("patch") || lower.includes("content update")) return "Patch Notes";
  if (lower.includes("pvp")) return "PvP";
  if (lower.includes("class") || lower.includes("spec") || lower.includes("talent")) return "Classes";
  return "General";
}

async function postPipelineItems() {
  try {
    const res = await fetch(RSS_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const doc = parser.parse(xml);
    const items = doc?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) return;

    const db = await getDb();
    let posted = 0;
    for (const item of items) {
      const title: string = item.title || "";
      const link: string = item.link || "";
      const description: string = item.description || "";
      const category = inferCategory(title + " " + description);
      if (category !== "Dungeons") continue;

      // Dedup by link
      const existing = await db.select({ id: news.id }).from(news).where(like(news.content, `%${link}%`)).limit(1);
      if (existing.length > 0) continue;

      const cleanTitle = title.replace(/^\[US\]\s*|^\[EU\]\s*/, "");
      const content = `${description}\n\n[Read on Blizzard Forums](${link})`;
      const now = Date.now();
      await db.insert(news).values({
        title: cleanTitle,
        content,
        section: "dungeons",
        tags: JSON.stringify(["dungeons", ...PIPELINE_TAGS]),
        authorId: "000000000000000000",
        authorName: "Blizzard Tracker",
        createdAt: now,
        updatedAt: now,
      });
      posted++;
    }
    if (posted > 0) console.log(`[auto-news] posted ${posted} pipeline items`);
  } catch { /* ignore */ }
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
    const url = new URL(request.url);
    const ptr = url.searchParams.get("ptr") === "1";

    const kv = await getKvBinding();
    if (!kv) return NextResponse.json({ error: "No KV binding" }, { status: 500 });

    // Always post new pipeline items (dedup by link)
    await postPipelineItems();

    const cacheKey = ptr ? "wow:blizzard-meta-ptr" : "wow:blizzard-meta";
    const raw = await kv.get(cacheKey);
    if (!raw) return NextResponse.json({ error: "No pipeline data yet" }, { status: 503 });

    const data = JSON.parse(raw);
    const specs = data.specs || {};
    const season = data.season || "Unknown Season";
    const today = todayStr();
    const label = ptr ? "PTR" : "Live";
    const title = `Mythic+ Meta Report — ${label} — ${today}`;

    // Check if already posted today (separate check for PTR vs Live)
    const db = await getDb();
    const existing = await db
      .select({ id: news.id })
      .from(news)
      .where(and(eq(news.section, "dungeons"), like(news.title, `%${label}%${today}%`)))
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

    const ptrWarning = ptr ? `\n\n*⚡ Projected data from PTR — values may change before live patch.*\n` : "";
    const content = [
      `**Season:** ${season}`,
      `**Date:** ${today}`,
      ``,
      `---`,
      ptrWarning,
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
      `*Auto-generated from${ptr ? " PTR " : " "}raid leaderboard data. Updates daily.*`,
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
