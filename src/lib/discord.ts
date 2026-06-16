import { lobbyRunCount } from "@/lib/lobbyDisplay";
import { resolveDiscordEmbedIdentity } from "@/lib/profileImage";
import { getSiteUrl } from "@/lib/siteUrl";

const API = "https://discord.com/api/v10";

let cachedGuildId: string | null = null;
let cachedChannels: { id: string; name: string }[] | null = null;
let lastFetch = 0;

async function discordFetch(path: string, options?: RequestInit) {
   const token = process.env.DISCORD_BOT_TOKEN;
   if (!token) return null;
   const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", ...options?.headers },
   });
   if (!res.ok) {
      console.error(`Discord API error ${res.status}: ${await res.text()}`);
      return null;
   }
   return res.json();
}

async function ensureGuildCache() {
   if (cachedGuildId && cachedChannels && Date.now() - lastFetch < 60000) return;
   const guilds: any[] = await discordFetch("/users/@me/guilds");
   if (!guilds?.length) return;
   cachedGuildId ??= guilds[0].id;
   const channels: any[] = await discordFetch(`/guilds/${cachedGuildId}/channels`);
   if (channels) cachedChannels = channels.map((c: any) => ({ id: c.id, name: c.name }));
   lastFetch = Date.now();
}

function findChannelId(namePatterns: string[]): string | null {
   if (!cachedChannels) return null;
   for (const p of namePatterns) {
      const found = cachedChannels.find(c => c.name === p || c.name.includes(p));
      if (found) return found.id;
   }
   return null;
}

const SITE_URL = getSiteUrl();

function formatRolesProgress(lobby: any): string {
   const roles = lobby.roles || {};
   const accepted = lobby.accepted || [];
   const parts: string[] = [];
   for (const [role, needed] of Object.entries(roles)) {
      const n = Number(needed) || 0;
      if (n <= 0) continue;
      const filled = accepted.filter((m: any) => {
         const r = String(m.role || m.applicantRole || "").toLowerCase();
         return r === role.toLowerCase() && m.status === "confirmed";
      }).length;
      const icon = role === "tank" ? "🛡️" : role === "healer" ? "💚" : "⚔️";
      parts.push(`${icon} ${role.toUpperCase()} \`${filled}/${n}\``);
   }
   return parts.length ? parts.join("  ") : "Open squad";
}

function missionTitle(lobby: any): string {
   if (lobby.category === "leveling") {
      return `Leveling ${lobby.startLevel || "?"} → ${lobby.endLevel || "?"}`;
   }
   const totalRuns = (Object.values(lobby.selectedDungeons || {}) as number[]).reduce(
      (a: number, b: number) => a + b,
      0
   );
   return `${totalRuns || lobby.runsCount || 1}x ${lobby.keyLevel || "+10"}`;
}

function buildInviteEmbedFields(lobby: any, ownerName: string) {
   const runs = lobbyRunCount(lobby);
   return [
      {
         name: "💰 Total Gold",
         value: `**${lobby.totalGold || "?"}K**`,
         inline: true,
      },
      {
         name: "🪙 Per Run",
         value: `**${lobby.goldPerRun || "?"}K**`,
         inline: true,
      },
      {
         name: "🏃 Runs",
         value: `**${runs}**`,
         inline: true,
      },
      {
         name: "📋 Mission",
         value: (lobby.title || missionTitle(lobby)).slice(0, 240),
      },
      {
         name: "👤 Mission Lead",
         value: ownerName,
         inline: true,
      },
      ...(lobby.category !== "leveling" && lobby.keyLevel
         ? [{ name: "🔑 Key", value: String(lobby.keyLevel), inline: true }]
         : []),
   ];
}

export async function sendLobbyEmbed(lobby: any, ownerUser?: any) {
   await ensureGuildCache();
   const channelNames = lobby.category === "leveling"
      ? ["🚀・leveling-squads", "leveling-squads", "leveling"]
      : ["⚔️・mythic-plus", "mythic-plus", "🎮・retail-wow", "lfg-retail-wow", "retail-wow"];
   const channelId = findChannelId(channelNames);
   if (!channelId) {
      console.error("Discord channel not found for category:", lobby.category);
      return;
   }

   const price = lobby.totalGold || 0;
   const rolesNeeded = Object.entries(lobby.roles || {}).filter(([, c]) => (c as number) > 0);
   const rolesStr = rolesNeeded.map(([r, c]) => `**${String(r).toUpperCase()}** ×${c}`).join(" · ") || "Any role";
   const { name: ownerName, avatar: ownerAvatar } = resolveDiscordEmbedIdentity(ownerUser, lobby);
   const title = missionTitle(lobby);
   const squadProgress = formatRolesProgress(lobby);

   const embed = {
      author: {
         name: `${ownerName} · UPLINK Mission Lead`,
         icon_url: ownerAvatar || undefined,
      },
      title: lobby.category === "leveling" ? `🚀 ${title}` : `⚔️ ${title}`,
      description:
         "Apply below — the owner reviews applicants on **UPLINK**. UPLINK is a coordination platform; we do not handle payments or loot.",
      color: lobby.category === "leveling" ? 0x8a2be2 : 0xff007f,
      fields: [
         { name: "💰 Offer", value: `**${price}K** gold`, inline: true },
         { name: "🎯 Open Roles", value: rolesStr, inline: true },
         { name: "📊 Squad", value: squadProgress, inline: false },
         ...(lobby.category !== "leveling" && lobby.minIlvl
            ? [{ name: "⚡ Min iLvl", value: `${lobby.minIlvl}+`, inline: true }] : []),
         ...(lobby.category !== "leveling" && lobby.keyLevel
            ? [{ name: "🔑 Key Level", value: String(lobby.keyLevel), inline: true }] : []),
         ...(lobby.minScore ? [{ name: "🏆 Min IO", value: `${lobby.minScore}`, inline: true }] : []),
         ...(lobby.serverRegion ? [{ name: "🌍 Region", value: String(lobby.serverRegion), inline: true }] : []),
         ...(lobby.notes ? [{ name: "📋 Notes", value: lobby.notes.slice(0, 200) }] : []),
      ],
      footer: { text: `UPLINK · Offer ${lobby.id}` },
      timestamp: new Date().toISOString(),
   };

   const components = [
      {
         type: 1,
         components: [
            {
               type: 2,
               style: 3,
               label: "Apply",
               custom_id: `apply_${lobby.id}`,
               emoji: { name: "⚡" },
            },
            {
               type: 2,
               style: 5,
               label: "Open UPLINK",
               url: `${SITE_URL}/?lobby=${lobby.id}`,
               emoji: { name: "🌐" },
            },
         ],
      },
   ];

   await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ embeds: [embed], components }),
   });
}

async function createDMChannel(discordUserId: string): Promise<string | null> {
   const res = await discordFetch("/users/@me/channels", {
      method: "POST",
      body: JSON.stringify({ recipient_id: discordUserId }),
   });
   return res?.id || null;
}

/** Squad invite DM — mirrors the site Accept Mission modal (60s window). */
export async function sendDiscordInviteDM(
   discordUserId: string,
   lobby: any,
   ownerUser: any,
   notifId: string | number
): Promise<boolean> {
   if (!process.env.DISCORD_BOT_TOKEN) return false;

   const channelId = await createDMChannel(discordUserId);
   if (!channelId) return false;

   const { name: ownerName, avatar: ownerAvatar } = resolveDiscordEmbedIdentity(ownerUser, lobby);

   const payload = {
      content: `<@${discordUserId}> **Mission Invitation** — you have **60 seconds** to respond.`,
      embeds: [
         {
            author: {
               name: ownerName,
               icon_url: ownerAvatar || undefined,
            },
            title: "⚡ Squad Invite",
            description: `**${ownerName}** invited you to join their mission.\nRespond below or on UPLINK before the timer expires.`,
            color: 0x00ffff,
            fields: buildInviteEmbedFields(lobby, ownerName),
            footer: { text: `UPLINK · Expires in 60s · Offer ${lobby.id}` },
            timestamp: new Date().toISOString(),
         },
      ],
      components: [
         {
            type: 1,
            components: [
               {
                  type: 2,
                  style: 3,
                  label: "Accept Mission",
                  custom_id: `discord_accept_${lobby.id}_${notifId}`,
                  emoji: { name: "✅" },
               },
               {
                  type: 2,
                  style: 4,
                  label: "Decline",
                  custom_id: `discord_decline_${lobby.id}_${notifId}`,
               },
               {
                  type: 2,
                  style: 5,
                  label: "Open UPLINK",
                  url: `${SITE_URL}/?lobby=${lobby.id}`,
               },
            ],
         },
      ],
   };

   const res = await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
   });
   return !!res;
}

/** Instant confirmation DM when owner auto-accepts (Secret Club). */
export async function sendDiscordConfirmedDM(
   discordUserId: string,
   lobby: any,
   ownerUser: any
): Promise<boolean> {
   if (!process.env.DISCORD_BOT_TOKEN) return false;

   const channelId = await createDMChannel(discordUserId);
   if (!channelId) return false;

   const { name: ownerName, avatar: ownerAvatar } = resolveDiscordEmbedIdentity(ownerUser, lobby);

   const payload = {
      content: `<@${discordUserId}> You're **confirmed** on a UPLINK mission!`,
      embeds: [
         {
            author: {
               name: ownerName,
               icon_url: ownerAvatar || undefined,
            },
            title: "✅ Mission Confirmed",
            description: `**${ownerName}** accepted you into their squad. Check UPLINK for B.net and payment details when the run starts.`,
            color: 0x00ff88,
            fields: buildInviteEmbedFields(lobby, ownerName),
            footer: { text: `UPLINK · Offer ${lobby.id}` },
            timestamp: new Date().toISOString(),
         },
      ],
      components: [
         {
            type: 1,
            components: [
               {
                  type: 2,
                  style: 5,
                  label: "Open UPLINK",
                  url: `${SITE_URL}/?lobby=${lobby.id}`,
               },
            ],
         },
      ],
   };

   const res = await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
   });
   return !!res;
}
