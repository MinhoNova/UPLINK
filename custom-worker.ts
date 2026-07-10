// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { syncGuildAutoRoles } from "./src/lib/discordGuild";
import { fetchTopPlayersFromRaiderIO, fetchTopPlayersFromBlizzard, selectTopPlayersBySpec } from "./src/lib/blizzard/leaderboard";
import { aggregateBySpec } from "./src/lib/blizzard/aggregator";
import { getCurrentMythicPlusSeason } from "./src/lib/mythicSeason";

function formatSeasonName(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return slug;
  const expMap: Record<string, string> = { tww: "The War Within", mn: "Midnight", df: "Dragonflight", sl: "Shadowlands" };
  return `${expMap[parts[1]] || parts[1]} — Season ${parts[2]}`;
}

const PTR_SEASON_SLUG = "season-mn-2";

async function runBlizzardPipeline(env: CloudflareEnv, ptr?: boolean) {
  const seasonSlug = ptr ? PTR_SEASON_SLUG : (await getCurrentMythicPlusSeason()).slug;
  const raiderPlayers = await fetchTopPlayersFromRaiderIO(seasonSlug);
  const blizzardPlayers = ptr ? [] : await fetchTopPlayersFromBlizzard(seasonSlug);
  const mergedMap = new Map<string, typeof raiderPlayers[0]>();
  for (const p of [...raiderPlayers, ...blizzardPlayers]) {
    const key = `${p.name}|${p.realm}|${p.region}|${p.specId}`;
    const existing = mergedMap.get(key);
    if (!existing || p.score > existing.score) mergedMap.set(key, p);
  }
  const displayLimit = 50;
  const profileLimit = 50;
  const playersBySpec = selectTopPlayersBySpec(Array.from(mergedMap.values()), displayLimit);
  const specs = await aggregateBySpec(playersBySpec, profileLimit, env);

  const cacheKey = ptr ? "wow:blizzard-meta-ptr" : "wow:blizzard-meta";
  const result = {
    specs,
    timestamp: Date.now(),
    season: ptr ? "Midnight — Season 2 (PTR Preview)" : formatSeasonName(seasonSlug),
    totalCharacters: mergedMap.size,
  };

  await env.KV_BINDING.put(cacheKey, JSON.stringify(result));
  console.log(`[pipeline] ${ptr ? "ptr" : "live"} ok season=${seasonSlug} chars=${mergedMap.size}`);
}

export default {
  fetch: handler.fetch,

  async scheduled(_event: ScheduledEvent, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        // Refresh auto-roles
        const { checked, granted } = await syncGuildAutoRoles();
        if (granted > 0) console.log(`[cron/autorole] checked=${checked} granted=${granted}`);

        // Refresh Blizzard meta data — run directly to avoid HTTP/CPU timeouts
        const minute = new Date().getUTCMinutes();
        if (minute % 15 === 0) {
          await Promise.all([
            (async () => {
              try {
                await runBlizzardPipeline(env, false);
                if (env.CRON_SECRET) {
                  const baseUrl = `https://${env.NEXT_PUBLIC_SITE_URL || "uplinklfg.com"}`;
                  await fetch(`${baseUrl}/api/news/auto-generate`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
                    signal: AbortSignal.timeout(30000),
                  });
                }
              } catch (e) {
                console.error("[pipeline/live] error:", e);
              }
            })(),
            (async () => {
              try {
                await runBlizzardPipeline(env, true);
                if (env.CRON_SECRET) {
                  const baseUrl = `https://${env.NEXT_PUBLIC_SITE_URL || "uplinklfg.com"}`;
                  await fetch(`${baseUrl}/api/news/auto-generate?ptr=1`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
                    signal: AbortSignal.timeout(30000),
                  });
                }
              } catch (e) {
                console.error("[pipeline/ptr] error:", e);
              }
            })(),
          ]);
        }
      })()
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
