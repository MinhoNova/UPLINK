// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { syncGuildAutoRoles } from "./src/lib/discordGuild";
import { fetchTopPlayersFromRaiderIO, selectTopPlayersBySpec } from "./src/lib/blizzard/leaderboard";
import { aggregateBySpec } from "./src/lib/blizzard/aggregator";
import { getCurrentMythicPlusSeason } from "./src/lib/mythicSeason";

function formatSeasonName(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return slug;
  const expMap: Record<string, string> = { tww: "The War Within", mn: "Midnight", df: "Dragonflight", sl: "Shadowlands" };
  return `${expMap[parts[1]] || parts[1]} — Season ${parts[2]}`;
}

async function runBlizzardPipeline(env: CloudflareEnv) {
  const season = await getCurrentMythicPlusSeason();
  const raiderPlayers = await fetchTopPlayersFromRaiderIO(season.slug);
  const mergedMap = new Map<string, typeof raiderPlayers[0]>();
  for (const p of raiderPlayers) {
    const key = `${p.name}|${p.realm}|${p.region}|${p.specId}`;
    const existing = mergedMap.get(key);
    if (!existing || p.score > existing.score) mergedMap.set(key, p);
  }
  const displayLimit = 50;
  const profileLimit = 15;
  const playersBySpec = selectTopPlayersBySpec(Array.from(mergedMap.values()), displayLimit);
  const specs = await aggregateBySpec(playersBySpec, profileLimit, env);

  // Alias hero talent specs to their parent spec data
  if (specs["havoc-demon-hunter"]) {
    specs["devourer-demon-hunter"] = specs["havoc-demon-hunter"];
  }

  const result = {
    specs,
    timestamp: Date.now(),
    season: formatSeasonName(season.slug),
    totalCharacters: mergedMap.size,
  };

  await env.KV_BINDING.put("wow:blizzard-meta", JSON.stringify(result));
  console.log(`[pipeline] ok season=${season.slug} chars=${mergedMap.size}`);
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
          try {
            await runBlizzardPipeline(env);
          } catch (e) {
            console.error("[pipeline] error:", e);
          }
        }
      })()
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
