// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { syncGuildAutoRoles } from "./src/lib/discordGuild";

export default {
  fetch: async (request: Request, env: CloudflareEnv, ctx: ExecutionContext) => {
    return handler.fetch(request, env, ctx);
  },

  async scheduled(_event: ScheduledEvent, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        // Auto-news (RSS + meta report)
        const siteUrl = env.NEXT_PUBLIC_SITE_URL || "https://uplinklfg.com";
        const baseUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
        fetch(`${baseUrl}/api/news/auto-generate`, {
          method: "POST",
          ...(env.CRON_SECRET ? { headers: { Authorization: `Bearer ${env.CRON_SECRET}` } } : {}),
          signal: AbortSignal.timeout(30000),
        }).catch((e) => console.error("[auto-news] fetch error:", e));

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
