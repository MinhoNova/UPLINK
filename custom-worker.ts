// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { syncGuildAutoRoles } from "./src/lib/discordGuild";

export default {
  fetch: handler.fetch,

  async scheduled(_event: ScheduledEvent, _env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      syncGuildAutoRoles().then(({ checked, granted }) => {
        if (granted > 0) {
          console.log(`[cron/autorole] checked=${checked} granted=${granted}`);
        }
      })
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
