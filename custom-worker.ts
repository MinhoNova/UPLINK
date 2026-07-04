// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { syncGuildAutoRoles } from "./src/lib/discordGuild";

export default {
  fetch: handler.fetch,

  async scheduled(_event: ScheduledEvent, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        // Refresh auto-roles
        const { checked, granted } = await syncGuildAutoRoles();
        if (granted > 0) console.log(`[cron/autorole] checked=${checked} granted=${granted}`);

        // Refresh Blizzard meta data every hour (skip most minutes)
        const minute = new Date().getUTCMinutes();
        if (minute === 0) {
          try {
            const baseUrl = `https://${env.NEXT_PUBLIC_SITE_URL || "uplinklfg.com"}`;
            const [live, ptr] = await Promise.all([
              fetch(`${baseUrl}/api/wow/blizzard-meta?refresh=1`, { signal: AbortSignal.timeout(120000) }),
              fetch(`${baseUrl}/api/wow/blizzard-meta?ptr=1&refresh=1`, { signal: AbortSignal.timeout(120000) }),
            ]);
            console.log(`[cron/blizzard-meta] live=${live.ok ? "ok" : "fail"} ptr=${ptr.ok ? "ok" : "fail"}`);
          } catch (e) {
            console.error("[cron/blizzard-meta] error:", e);
          }
        }
      })()
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
