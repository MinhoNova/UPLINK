import { getDiscordInviteUrl } from "@/lib/discordConstants";
import { getSiteUrl } from "@/lib/siteUrl";

const API = "https://discord.com/api/v10";

const PROMO_FOOTER = "UPLINK · Promotion";

async function discordFetch(path: string, options?: RequestInit): Promise<any | null> {
   const token = process.env.DISCORD_BOT_TOKEN;
   if (!token) return null;
   const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", ...options?.headers },
   });
   if (!res.ok) {
      console.error(`Discord promo API ${res.status}: ${await res.text()}`);
      return null;
   }
   if (res.status === 204) return {};
   return res.json();
}

const PROMO_CHANNEL_PREFERENCES = [
   "welcome-briefing",
   "announcements",
   "welcome",
   "rules",
   "general",
   "lfg",
];

async function findPromoChannelId(): Promise<string | null> {
   const guildId = process.env.DISCORD_GUILD_ID?.trim();
   if (!guildId) return null;
   const channels: { id: string; name: string; type: number }[] | null = await discordFetch(
      `/guilds/${guildId}/channels`
   );
   if (!channels) return null;
   const textChannels = channels.filter((c) => c.type === 0);
   for (const pref of PROMO_CHANNEL_PREFERENCES) {
      const found = textChannels.find((c) => c.name === pref);
      if (found) return found.id;
   }
   return textChannels[0]?.id || null;
}

export async function isSitePromoPinned(channelId: string): Promise<boolean> {
   const pinned: { embeds?: { footer?: { text?: string } }[] }[] | null = await discordFetch(
      `/channels/${channelId}/pins`
   );
   if (!Array.isArray(pinned)) return false;
   return pinned.some((m) =>
      m.embeds?.some((e) => e.footer?.text?.startsWith(PROMO_FOOTER))
   );
}

/**
 * Posts (and pins) a UPLINK promotional embed with the site + invite links.
 * Idempotent: if a promo is already pinned in the target channel, it does nothing.
 */
export async function postSitePromo(): Promise<{
   posted: boolean;
   pinned: boolean;
   channelId?: string;
   messageId?: string;
   error?: string;
}> {
   const channelId = await findPromoChannelId();
   if (!channelId) {
      return {
         posted: false,
         pinned: false,
         error: "DISCORD_GUILD_ID missing or no text channel found",
      };
   }

   if (await isSitePromoPinned(channelId)) {
      return { posted: false, pinned: true, channelId, error: "Promo already pinned in this channel" };
   }

   const siteUrl = getSiteUrl();
   const inviteUrl = getDiscordInviteUrl();

   const embed = {
      title: "🌐 UPLINK — Aion 2 LFG Platform",
      description:
         "Create offers, fill your squad, and coordinate runs for **Leveling, Dungeons, Raids & Professions**.\n\nVerified game characters, live squad tracking, and payout coordination — all on the site.",
      color: 0x00ffff,
      fields: [
         { name: "🌐 Website", value: siteUrl, inline: true },
         { name: "💬 Discord", value: inviteUrl, inline: true },
      ],
      footer: { text: PROMO_FOOTER },
      timestamp: new Date().toISOString(),
   };

   const components = [
      {
         type: 1,
         components: [
            { type: 2, style: 5, label: "Open UPLINK", url: siteUrl },
            { type: 2, style: 5, label: "Join Discord", url: inviteUrl },
         ],
      },
   ];

   const msg = await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ embeds: [embed], components }),
   });
   if (!msg?.id) {
      return { posted: false, pinned: false, channelId, error: "Message post failed (bot permissions?)" };
   }

   await discordFetch(`/channels/${channelId}/pins/${msg.id}`, { method: "PUT" });
   return { posted: true, pinned: true, channelId, messageId: msg.id };
}