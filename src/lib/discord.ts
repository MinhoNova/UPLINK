import { lobbyRunCount } from "@/lib/lobbyDisplay";
import { classThumbUrl } from "@/lib/classThumb";
import { configuredOfferChannelId } from "@/lib/discordConstants";

const API = "https://discord.com/api/v10";

let cachedGuildId: string | null = null;
let cachedChannels: { id: string; name: string }[] | null = null;
let cachedEmojis: { id: string; name: string; animated?: boolean }[] | null = null;
let lastFetch = 0;

async function discordFetch(path: string, options?: RequestInit): Promise<any | null> {
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
   if (cachedGuildId && cachedChannels && cachedEmojis && Date.now() - lastFetch < 60000) return;
   const guilds: any[] = await discordFetch("/users/@me/guilds");
   if (!guilds?.length) return;
   const configuredGuildId = process.env.DISCORD_GUILD_ID?.trim();
   cachedGuildId ??= guilds.find((guild) => guild.id === configuredGuildId)?.id ?? guilds[0].id;
   const channels: any[] = await discordFetch(`/guilds/${cachedGuildId}/channels`);
   if (channels) cachedChannels = channels.map((c: any) => ({ id: c.id, name: c.name }));
   // Nitro servers upload their own emoji. Reading them back lets an offer embed
   // use the guild's art instead of the flat unicode blocks we had, without
   // asking the operator to paste snowflake ids into environment variables.
   const emojis: any[] = await discordFetch(`/guilds/${cachedGuildId}/emojis`);
   if (emojis) cachedEmojis = emojis.map((e: any) => ({ id: e.id, name: e.name, animated: e.animated }));
   lastFetch = Date.now();
}

/**
 * Resolves a guild emoji by name, tolerating the prefixes Discord adds when a
 * server owner renames one. Returns the mention form Discord actually renders,
 * or null so callers can fall back to unicode.
 */
function guildEmoji(...candidates: string[]): string | null {
   if (!cachedEmojis?.length) return null;
   const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
   for (const candidate of candidates) {
      const want = norm(candidate);
      if (!want) continue;
      const hit =
         cachedEmojis.find((e) => norm(e.name) === want) ||
         cachedEmojis.find((e) => norm(e.name).includes(want) || want.includes(norm(e.name)));
      if (hit) return hit.animated ? `<a:${hit.name}:${hit.id}>` : `<:${hit.name}:${hit.id}>`;
   }
   return null;
}

const EMBED_GLYPH: Record<string, string> = {
   leveling: "🚀",
   dungeons: "🏰",
   raids: "⚔️",
   professions: "🛠️",
};

/** Guild art first, unicode second. */
function categoryGlyph(category: string): string {
   const byCategory = CATEGORY_EMOJI[category];
   const custom = guildEmoji(byCategory || "", `${category}-offers`, category, EMBED_GLYPH[category] || "");
   return custom || byCategory || "🎮";
}

function absoluteSiteUrl(path: string): string {
   const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || SITE_URL).replace(/\/+$/, "");
   return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Picks the one class worth putting in the embed corner. An offer can name many
 * classes in `requiredClasses`, and a thumbnail of the wrong one is worse than
 * none, so this only speaks up when a single class is in play.
 */
function offerClassThumb(lobby: any): { url: string } | undefined {
   const single = (() => {
      if (lobby.aionClass) return String(lobby.aionClass);
      if (lobby.ownerClass) return String(lobby.ownerClass);
      const req = lobby.requiredClasses;
      if (Array.isArray(req)) {
         const clean = req.map((c: any) => String(c || "").trim()).filter(Boolean);
         return clean.length === 1 ? clean[0] : "";
      }
      return "";
   })();
   if (!single) return undefined;
   return { url: absoluteSiteUrl(classThumbUrl(single)) };
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

const CATEGORY_CHANNELS: Record<string, string[]> = {
   leveling: ["🚀・leveling-offers", "leveling-offers", "leveling-squads", "leveling"],
   dungeons: ["🏰・dungeon-offers", "dungeon-offers", "dungeons"],
   raids: ["⚔️・raid-offers", "raid-offers", "raids"],
   professions: ["🛠️・profession-offers", "profession-offers", "professions"],
};
// plural keys for historic consistency; use discordCategoryKey() to normalize

const CATEGORY_EMOJI: Record<string, string> = {
   leveling: "🚀",
   dungeons: "🏰",
   raids: "⚔️",
   professions: "🛠️",
};

/**
 * The channel tables above are keyed on the plural spelling, but offers are
 * written as the singular `dungeon` / `raid`. Looking the raw value up meant
 * every new dungeon and raid offer missed its channel and silently fell through
 * to the catch-all `general`. Fold the singular onto the plural here.
 */
function discordCategoryKey(category: string | null | undefined): string {
   const c = String(category || "").toLowerCase();
   if (c === "dungeon") return "dungeons";
   if (c === "raid") return "raids";
   return c;
}

function channelPatternsFor(category: string | null | undefined): string[] {
   return CATEGORY_CHANNELS[discordCategoryKey(category)] || ["🎮・lfg", "lfg", "general"];
}

export async function sendLobbyEmbed(lobby: any) {
   await ensureGuildCache();
   const category = discordCategoryKey(lobby.category);
   const channelNames = channelPatternsFor(lobby.category);
   // An explicit channel id always wins. The name lookup is a fuzzy substring
   // match, so renaming a channel silently stopped offers from posting with no
   // error anywhere; ids do not rot.
   const channelId = configuredOfferChannelId(category) || findChannelId(channelNames);
   if (!channelId) {
      console.error("Discord channel not found for category:", lobby.category);
      return;
   }

   const price = lobby.totalGold || 0;
   const rolesNeeded = Object.entries(lobby.roles || {}).filter(([, c]) => (c as number) > 0);
   const rolesStr = rolesNeeded.map(([r, c]) => `**${String(r).toUpperCase()}** ×${c}`).join(" · ") || "Any role";
   const ownerName = lobby.ownerDiscordName || lobby.ownerHandle || "Unknown";
   const categoryEmoji = categoryGlyph(category);
   const title = missionTitle(lobby);
   const squadProgress = formatRolesProgress(lobby);

   const embed = {
      author: {
         name: `${ownerName} · UPLINK Mission Lead`,
         icon_url: lobby.ownerImage || undefined,
      },
      title: `${categoryEmoji} ${title}`,
      description:
         "Apply below — the owner reviews applicants on **UPLINK**. UPLINK is a coordination platform; we do not handle payments or loot.",
      color: CATEGORY_CHANNELS[discordCategoryKey(lobby.category)] ? (category === "leveling" ? 0x8a2be2 : category === "raids" ? 0xff007f : category === "professions" ? 0x22c55e : 0x00b7ff) : 0xff007f,
      // Discord renders this in the 80x80 slot on the right. Pre-rasterized webp
      // from public/classes-thumb, which is the only class art the site has.
      thumbnail: offerClassThumb(lobby),
      fields: [
         { name: "💰 Price / Run / Player", value: `**${lobby.pricePerRun || lobby.goldPerRun || 0}M**`, inline: true },
         { name: "💎 Total / Player", value: `**${Number(lobby.totalGold || (Number(lobby.pricePerRun||0)*(Number(lobby.runsCount)||1))).toFixed(2)}M**`, inline: true },
         { name: "🏃 Runs", value: `**${lobbyRunCount(lobby)}**`, inline: true },
         { name: "🎯 Open Roles", value: rolesStr, inline: false },
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

   const applyUrl = absoluteSiteUrl(`/apply/${lobby.id}`);
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
               url: applyUrl,
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

   const ownerName = ownerUser?.displayName || ownerUser?.name || lobby.ownerDiscordName || "Mission Lead";
   const ownerAvatar = ownerUser?.customAvatar || ownerUser?.profileGif || ownerUser?.avatar || lobby.ownerImage;

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
                  url: `${absoluteSiteUrl(`/manage/${lobby.id}`)}`,
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

   const ownerName = ownerUser?.displayName || ownerUser?.name || lobby.ownerDiscordName || "Mission Lead";
   const ownerAvatar = ownerUser?.customAvatar || ownerUser?.profileGif || ownerUser?.avatar || lobby.ownerImage;

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
                  url: `${absoluteSiteUrl(`/manage/${lobby.id}`)}`,
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
