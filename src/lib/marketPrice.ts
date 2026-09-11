import { getKVPairs, setKV } from "@/lib/db";

export const MARKET_KEY = "marketHistory";
const MAX_PER_SERVICE = 60;
const AVERAGE_WINDOW = 20;

export interface MarketRecord {
  serviceName: string;
  priceKina: number;
  ts: number;
}

/** Record a completed (paid) run so the market engine can re-price the catalog. */
export async function recordMarketCompletion(serviceName: string, priceKina: number): Promise<void> {
  const sn = String(serviceName || "").trim();
  const price = Number(priceKina);
  if (!sn || !(price > 0)) return;
  try {
    const kv = await getKVPairs();
    const history: MarketRecord[] = Array.isArray(kv[MARKET_KEY]) ? (kv[MARKET_KEY] as MarketRecord[]) : [];
    const rec: MarketRecord = { serviceName: sn, priceKina: price, ts: Date.now() };
    const byService = new Map<string, MarketRecord[]>();
    for (const h of history) {
      const key = String(h.serviceName || "");
      if (!key) continue;
      const list = byService.get(key) || [];
      list.push(h);
      byService.set(key, list);
    }
    const next: MarketRecord[] = [];
    for (const [, list] of byService) {
      next.push(...list.slice(-MAX_PER_SERVICE));
    }
    next.push(rec);
    await setKV(MARKET_KEY, next);
  } catch (err) {
    console.error("recordMarketCompletion failed:", err);
  }
}

/** Average price per service of recent completed runs (last 20 per service). */
export function getMarketAverageByService(history: any[]): Record<string, number> {
  const byService = new Map<string, number[]>();
  for (const h of Array.isArray(history) ? history : []) {
    const key = String(h?.serviceName || "");
    const price = Number(h?.priceKina);
    if (!key || !(price > 0)) continue;
    const list = byService.get(key) || [];
    list.push(price);
    byService.set(key, list);
  }
  const out: Record<string, number> = {};
  for (const [k, list] of byService) {
    const window = list.slice(-AVERAGE_WINDOW);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    out[k] = Math.round(avg * 100) / 100;
  }
  return out;
}