import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";
import { XMLParser } from "fast-xml-parser";

const RSS_URL = "https://www.bluetracker.gg/rss/wow/";
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY = "wow:pipeline";

export interface PipelineItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  region: "US" | "EU";
  category: string;
}

async function fetchAndParseFeed(): Promise<PipelineItem[]> {
  const res = await fetch(RSS_URL, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item;

  if (!items || !Array.isArray(items)) return [];

  return items.map((item: any): PipelineItem => {
    const title: string = item.title || "";
    const region = title.startsWith("[US]") ? "US" : title.startsWith("[EU]") ? "EU" : "US";
    return {
      title: title.replace(/^\[US\]\s*|^\[EU\]\s*/, ""),
      link: item.link || "",
      description: (item.description || "").replace(/^\[Blue Topic\]\s*/, ""),
      pubDate: item.pubDate || "",
      region,
      category: inferCategory(title + " " + (item.description || "")),
    };
  });
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("class tuning")) return "Class Tuning";
  if (lower.includes("hotfix")) return "Hotfixes";
  if (lower.includes("ptr") || lower.includes("development notes") || lower.includes("testing")) return "PTR";
  if (lower.includes("blog") || lower.includes("wow weekly") || lower.includes("wowcast")) return "Blog";
  if (lower.includes("feedback")) return "Feedback";
  if (lower.includes("patch") || lower.includes("content update")) return "Patch Notes";
  if (lower.includes("mythic") || lower.includes("dungeon")) return "Dungeons";
  if (lower.includes("pvp") || lower.includes("pvp")) return "PvP";
  if (lower.includes("class") || lower.includes("spec") || lower.includes("talent") || lower.includes("set bonus") || lower.includes("set bonus")) return "Classes";
  return "General";
}

export async function GET() {
  try {
    await initTables();

    const cached = await getKV(CACHE_KEY);
    if (cached && typeof cached === "object" && "items" in cached && "timestamp" in cached) {
      const age = Date.now() - (cached as any).timestamp;
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ items: (cached as any).items, cached: true, age });
      }
    }

    const items = await fetchAndParseFeed();

    await setKV(CACHE_KEY, { items, timestamp: Date.now() });

    return NextResponse.json({ items, cached: false });
  } catch (err) {
    console.error("Pipeline fetch error:", err);

    const cached = await getKV(CACHE_KEY);
    if (cached && typeof cached === "object" && "items" in cached) {
      return NextResponse.json({ items: (cached as any).items, cached: true, stale: true });
    }

    return NextResponse.json({ items: [], error: "Failed to fetch pipeline data" }, { status: 500 });
  }
}
