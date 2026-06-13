import { lobbyRunCount } from "@/lib/lobbyDisplay";

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

const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function sendLobbyEmbed(lobby: any) {
   await ensureGuildCache();
   const channelNames = lobby.category === "leveling"
      ? ["🚀・leveling-squads", "leveling-squads", "leveling"]
      : ["🎮・retail-wow", "lfg-retail-wow", "retail-wow"];
   const channelId = findChannelId(channelNames);
   if (!channelId) {
      console.error("Discord channel not found for category:", lobby.category);
      return;
   }

   const price = lobby.totalGold || 0;
   const rolesNeeded = Object.entries(lobby.roles || {}).filter(([, c]) => (c as number) > 0);
   const rolesStr = rolesNeeded.map(([r, c]) => `**${r.toUpperCase()}** x${c}`).join(" • ") || "Any";

   const categoryEmoji = lobby.category === "leveling" ? "🚀" : "⚔️";

   const title = lobby.category === "leveling"
      ? `Leveling ${lobby.startLevel || "1"} → ${lobby.endLevel || "70"}`
      : (() => {
         const totalRuns = (Object.values(lobby.selectedDungeons || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
         return `${totalRuns}x ${lobby.keyLevel || "+10"}`;
      })();

   const ownerName = lobby.ownerDiscordName || lobby.ownerHandle || "Unknown";

   const embed = {
      title: `${categoryEmoji} ${title}`,
      color: lobby.category === "leveling" ? 0x8a2be2 : 0x00ffff,
      fields: [
         { name: "💰 Price", value: `${price}K`, inline: true },
         { name: "🎯 Roles", value: rolesStr, inline: true },
         ...(lobby.category !== "leveling" && lobby.minIlvl
            ? [{ name: "⚡ Min iLvl", value: `${lobby.minIlvl}+`, inline: true }] : []),
         ...(lobby.category !== "leveling" && lobby.keyLevel
            ? [{ name: "🔑 Key Level", value: lobby.keyLevel, inline: true }] : []),
         ...(lobby.minScore ? [{ name: "🏆 Min Score", value: `${lobby.minScore}`, inline: true }] : []),
         ...(lobby.notes ? [{ name: "📋 Notes", value: lobby.notes.slice(0, 200) }] : []),
      ],
      footer: { text: `${ownerName} • ID: ${lobby.id}` },
      timestamp: new Date().toISOString(),
   };

   const components = [
      {
         type: 1,
         components: [
            {
               type: 2,
               style: 3,
               label: "APPLY",
               custom_id: `apply_${lobby.id}`,
               emoji: { name: "⚡" },
            },
            {
               type: 2,
               style: 5,
               label: "VIEW ON SITE",
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

export async function sendDiscordInviteDM(
   discordUserId: string,
   lobby: any,
   ownerUser: any,
   notifId: string | number
): Promise<boolean> {
   if (!process.env.DISCORD_BOT_TOKEN) return false;

   const channelId = await createDMChannel(discordUserId);
   if (!channelId) return false;

   const runs = lobbyRunCount(lobby);
   const ownerName = ownerUser?.displayName || ownerUser?.name || lobby.ownerDiscordName || "Mission Lead";

   const payload = {
      content: `<@${discordUserId}> You received a squad invite on **UPLINK**!`,
      embeds: [
         {
            title: "⚡ Squad Invite",
            description: `**${ownerName}** invited you to their offer.`,
            color: 0x00ffff,
            fields: [
               { name: "💰 Total Gold", value: `${lobby.totalGold || "?"}K`, inline: true },
               { name: "🪙 Per Run", value: `${lobby.goldPerRun || "?"}K`, inline: true },
               { name: "🏃 Runs", value: String(runs), inline: true },
               { name: "📋 Mission", value: (lobby.title || String(lobby.id)).slice(0, 240) },
            ],
            footer: { text: `Offer ID ${lobby.id}` },
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
                  label: "ACCEPT",
                  custom_id: `discord_accept_${lobby.id}_${notifId}`,
               },
               {
                  type: 2,
                  style: 4,
                  label: "DECLINE",
                  custom_id: `discord_decline_${lobby.id}_${notifId}`,
               },
               {
                  type: 2,
                  style: 5,
                  label: "OPEN UPLINK",
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
