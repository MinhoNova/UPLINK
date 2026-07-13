// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { syncGuildAutoRoles } from "./src/lib/discordGuild";
import { fetchTopPlayersFromBlizzard, fetchTopPlayersFromRaiderIO, selectTopPlayersBySpec } from "./src/lib/blizzard/leaderboard";
import { aggregateBySpec } from "./src/lib/blizzard/aggregator";
import { getCurrentMythicPlusSeason } from "./src/lib/mythicSeason";

function formatSeasonName(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return slug;
  const expMap: Record<string, string> = { tww: "The War Within", mn: "Midnight", df: "Dragonflight", sl: "Shadowlands" };
  return `${expMap[parts[1]] || parts[1]} — Season ${parts[2]}`;
}

const PTR_SEASON_SLUG = "season-mn-2";

async function runBlizzardPipeline(env: CloudflareEnv) {
  const seasonSlug = (await getCurrentMythicPlusSeason()).slug;

  // 1) Blizzard CR-based leaderboards
  const blizzardPlayers = await fetchTopPlayersFromBlizzard(seasonSlug, env);
  const mergedMap = new Map<string, typeof blizzardPlayers[0]>();
  for (const p of blizzardPlayers) {
    const key = `${p.name}|${p.realm}|${p.region}|${p.specId}`;
    const existing = mergedMap.get(key);
    if (!existing || p.score > existing.score) mergedMap.set(key, p);
  }

  // 2) Count per spec — if any spec < 50, supplement via RaiderIO
  const specCounts = new Map<string, number>();
  for (const p of mergedMap.values()) specCounts.set(p.specId, (specCounts.get(p.specId) || 0) + 1);
  const lowSpecs = [...specCounts.entries()].filter(([, c]) => c < 50).map(([s]) => s);
  if (lowSpecs.length > 0) {
    const rioPlayers = await fetchTopPlayersFromRaiderIO(seasonSlug);
    for (const p of rioPlayers) {
      if (!lowSpecs.includes(p.specId)) continue;
      const key = `${p.name}|${p.realm}|${p.region}|${p.specId}`;
      const existing = mergedMap.get(key);
      if (!existing || p.score > existing.score) mergedMap.set(key, p);
    }
  }

  // 3) Aggregate
  const displayLimit = 50;
  const profileLimit = 50;
  const playersBySpec = selectTopPlayersBySpec(Array.from(mergedMap.values()), displayLimit);
  const specs = await aggregateBySpec(playersBySpec, profileLimit, env);

  // 4) Cache
  const result = { specs, timestamp: Date.now(), season: formatSeasonName(seasonSlug), totalCharacters: mergedMap.size };
  await env.KV_BINDING.put("wow:blizzard-meta", JSON.stringify(result));
  console.log(`[pipeline] ok season=${seasonSlug} chars=${mergedMap.size} lowSpecs=${lowSpecs.length}`);
}

export default {
  fetch: async (request: Request, env: CloudflareEnv, ctx: ExecutionContext) => {
    const url = new URL(request.url);
    // Trigger pipeline via /api/pipeline/trigger (no static asset at this path)
    if (url.pathname === "/api/pipeline/trigger") {
      ctx.waitUntil(runBlizzardPipeline(env));
      return new Response("Pipeline started", { status: 202 });
    }
    return handler.fetch(request, env, ctx);
  },

  async scheduled(_event: ScheduledEvent, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const minute = new Date().getUTCMinutes();
        console.log(`[cron] minute=${minute}`);
        if (minute % 15 !== 0) return;
        console.log(`[cron] pipeline start`);

        try {
          await runBlizzardPipeline(env);
          if (env.CRON_SECRET) {
            const baseUrl = `https://${env.NEXT_PUBLIC_SITE_URL || "uplinklfg.com"}`;
            await fetch(`${baseUrl}/api/news/auto-generate`, {
              method: "POST", headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
              signal: AbortSignal.timeout(30000),
            }).catch(() => {});
          }
        } catch (e) {
          console.error("[pipeline] error:", e);
        }

        // Auto-role sync (background, with timeout)
        try {
          await Promise.race([
            syncGuildAutoRoles(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 30000)),
          ]).then((r: any) => { if (r?.granted > 0) console.log(`[autorole] granted=${r.granted}`); });
        } catch {
          // timeout is fine
        }
      })()
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
