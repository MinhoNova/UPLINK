/**
 * One-shot professional server setup for UPLINK (Aion 2 LFG).
 *
 * Creates (idempotent — never deletes):
 *   - Categories & channels (emoji names matching the bot in src/lib/discord.ts)
 *   - Colored roles (core + class color roles)
 *   - Permission tweaks (Marketplace = bot-posting only, STAFF = hidden)
 *   - Optional animated server icon: --icon public/logo.png (or .gif / .apng)
 *
 * Usage:
 *   npm run discord:setup
 *   npm run discord:setup -- --icon public/logo.png
 *
 * Reads DISCORD_BOT_TOKEN / DISCORD_GUILD_ID from .env.local / .dev.vars.
 */
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".dev.vars"));

if (!process.env.DISCORD_GUILD_ID) {
  process.env.DISCORD_GUILD_ID = "1497323747198238933";
}

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  console.error("Add it to .env.local then run: npm run discord:setup");
  process.exit(1);
}

const iconArgIndex = process.argv.indexOf("--icon");
const iconPath = iconArgIndex > -1 ? process.argv[iconArgIndex + 1] : null;

// ---------------------------------------------------------------------------
// Server blueprint
// ---------------------------------------------------------------------------

const CATEGORIES = [
  {
    name: "📌 SYSTEM",
    channels: [
      {
        name: "rules",
        type: ChannelType.GuildText,
        topic: "📜 Server rules — read before chatting. Breaking any rule = instant action.",
      },
      {
        name: "📢・announcements",
        type: ChannelType.GuildText,
        topic: "📢 Official UPLINK announcements & Aion 2 site updates.",
      },
      {
        name: "welcome-briefing",
        type: ChannelType.GuildText,
        topic: "👋 Welcome to UPLINK — the LFG & boosting hub for Aion 2. Open offers and apply on aion2lfg.com",
      },
    ],
  },
  {
    name: "🗣️ COMMUNITY",
    channels: [
      { name: "🗨️・general-chat", type: ChannelType.GuildText, topic: "Chat with the community — LFG talk, questions, everything." },
      { name: "🎮・aion-2", type: ChannelType.GuildText, topic: "Aion 2 discussions: classes, raids, dungeons, builds." },
      { name: "📸・media-clips", type: ChannelType.GuildText, topic: "Screenshots, clips and highlights from your runs." },
      { name: "❓・help", type: ChannelType.GuildText, topic: "Need help on the site or in game? Ask here." },
      { name: "💡・suggestions", type: ChannelType.GuildText, topic: "Ideas to make UPLINK better — we read everything." },
    ],
  },
  {
    name: "💰 MARKETPLACE",
    // Offers are posted automatically by the UPLINK bot — read-only for everyone.
    channels: [
      { name: "🚀・leveling-offers", type: ChannelType.GuildText, topic: "Leveling offers — posted automatically by UPLINK." },
      { name: "🏰・dungeon-offers", type: ChannelType.GuildText, topic: "Dungeon offers — posted automatically by UPLINK." },
      { name: "⚔️・raid-offers", type: ChannelType.GuildText, topic: "Raid offers — posted automatically by UPLINK." },
      { name: "⚡・pvp-offers", type: ChannelType.GuildText, topic: "PvP offers — posted automatically by UPLINK." },
      { name: "🛠️・profession-offers", type: ChannelType.GuildText, topic: "Profession offers — posted automatically by UPLINK." },
      { name: "💰・boost-auction", type: ChannelType.GuildText, topic: "Blind gold auction requests — post a request, boosters bid." },
    ],
    readOnly: true,
  },
  {
    name: "🎧 HANGOUT",
    channels: [
      { name: "🔊 General", type: ChannelType.GuildVoice },
      { name: "🎮 Squad LFG", type: ChannelType.GuildVoice },
      { name: "💤 AFK", type: ChannelType.GuildVoice },
    ],
  },
  {
    name: "🔒 STAFF",
    hidden: true,
    channels: [
      { name: "🔒・mod-chat", type: ChannelType.GuildText, topic: "Staff coordination. Private." },
    ],
  },
];

const ROLE_SPECS = [
  { name: "👑 UPLINK Owner", color: "#ffd700", permissions: [PermissionsBitField.Flags.Administrator] },
  {
    name: "⚡ Admin",
    color: "#ff007f",
    permissions: [
      PermissionsBitField.Flags.ManageGuild,
      PermissionsBitField.Flags.ManageRoles,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.BanMembers,
      PermissionsBitField.Flags.ModerateMembers,
    ],
  },
  {
    name: "🛡️ Moderator",
    color: "#00ffff",
    permissions: [
      PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.ModerateMembers,
      PermissionsBitField.Flags.ManageMessages,
    ],
  },
  { name: "👑 Mission Lead", color: "#8a2be2", permissions: [PermissionsBitField.Flags.ManageMessages] },
  { name: "🔥 Elite Booster", color: "#ff4500", permissions: [] },
  { name: "🌟 Secret Club", color: "#c084fc", permissions: [] },
  { name: "📡 Community", color: "#38bdf8", permissions: [] },
  { name: "💠 Verified Operative", color: "#00ffff", permissions: [] },
];

// Self-assignable colorful class roles (matching Aion 2 archetypes).
const CLASS_ROLES = [
  { name: "🛡️ Tank", color: "#02a9ff", permissions: [] },
  { name: "💚 Healer", color: "#23a55a", permissions: [] },
  { name: "⚔️ DPS", color: "#ff7300", permissions: [] },
];

const STAFF_ROLE_NAMES = ["👑 UPLINK Owner", "⚡ Admin", "🛡️ Moderator"];

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

console.log(`Loading server setup for guild: ${process.env.DISCORD_GUILD_ID}`);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild =
    (process.env.DISCORD_GUILD_ID &&
      client.guilds.cache.get(process.env.DISCORD_GUILD_ID)) ||
    client.guilds.cache.first();

  if (!guild) {
    console.error("Bot is not in any server. Invite the bot first.");
    process.exit(1);
  }

  console.log(`\n=== Setting up ${guild.name} (${guild.id}) ===\n`);

  try {
    await guild.channels.fetch();
    await guild.roles.fetch();

    // 1. Roles -------------------------------------------------------------
    const allRoleSpecs = [...ROLE_SPECS, ...CLASS_ROLES];
    const createdRoles = new Map();
    for (const spec of allRoleSpecs) {
      let role = guild.roles.cache.find((r) => r.name === spec.name);
      if (!role) {
        role = await guild.roles.create({
          name: spec.name,
          color: spec.color,
          permissions: spec.permissions,
          reason: "UPLINK server setup",
        });
        console.log(`＋ role: ${spec.name}`);
      } else {
        await role.edit({
          color: spec.color,
          permissions: spec.permissions,
          reason: "UPLINK server setup",
        });
        console.log(`＝ role: ${spec.name}`);
      }
      createdRoles.set(spec.name, role);
    }

    // 2. Categories & channels --------------------------------------------
    const categoryPos = {};
    const catPositions = {};
    CATEGORIES.forEach((cat, i) => {
      catPositions[cat.name] = i;
    });

    for (const cat of CATEGORIES) {
      let category = guild.channels.cache.find(
        (c) => c.name === cat.name && c.type === ChannelType.GuildCategory
      );
      if (!category) {
        category = await guild.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
          reason: "UPLINK server setup",
        });
        console.log(`＋ category: ${cat.name}`);
      } else {
        console.log(`＝ category: ${cat.name}`);
      }
      categoryPos[cat.name] = category;

      for (const spec of cat.channels || []) {
        let channel = guild.channels.cache.find((c) => c.name === spec.name);
        if (!channel) {
          channel = await guild.channels.create({
            name: spec.name,
            type: spec.type,
            parent: category.id,
            topic: spec.topic ?? "",
            reason: "UPLINK server setup",
          });
          console.log(`　＋ #${spec.name}`);
        } else {
          console.log(`　＝ #${spec.name}`);
        }

        // Permission overrides -------------------------------------------
        const overwrites = [];

        if (cat.readOnly) {
          overwrites.push({
            id: guild.roles.everyone.id,
            deny: [
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.AddReactions,
              PermissionsBitField.Flags.CreatePublicThreads,
              PermissionsBitField.Flags.CreatePrivateThreads,
            ],
          });
        }

        if (cat.hidden) {
          overwrites.push({
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          });
          for (const rn of STAFF_ROLE_NAMES) {
            const staffRole = createdRoles.get(rn);
            if (staffRole) {
              overwrites.push({
                id: staffRole.id,
                allow: [PermissionsBitField.Flags.ViewChannel],
              });
            }
          }
        }

        if (overwrites.length) {
          await channel.permissionOverwrites.set(overwrites, "UPLINK server setup");
          console.log(`　　→ permissions set on #${spec.name}`);
        }
      }
    }

    // 3. Order categories & channels (best-effort) -------------------------
    try {
      for (const cat of CATEGORIES) {
        const category = categoryPos[cat.name];
        if (!category) continue;
        await category.setPosition(catPositions[cat.name]);
      }
    } catch {
      console.log("Note: skipping category reordering (drag manually if needed).");
    }

    // 4. Server icon (optional) -------------------------------------------
    if (iconPath) {
      const abs = path.isAbsolute(iconPath) ? iconPath : path.join(root, iconPath);
      if (!fs.existsSync(abs)) {
        console.warn(`Icon file not found: ${abs} — skipping icon.`);
      } else {
        const ext = path.extname(abs).toLowerCase().replace(".", "");
        const mime = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "gif" ? "image/gif" : ext === "apng" ? "image/apng" : null;
        if (!mime) {
          console.warn(`Unsupported icon type "${ext}" — use png, jpg, gif or apng.`);
        } else {
          const b64 = fs.readFileSync(abs).toString("base64");
          await guild.setIcon(`data:${mime};base64,${b64}`, "UPLINK server setup");
          console.log(`\n✨ Server icon set (${ext}). Animated renders after board level 1 (2 boosts).`);
        }
      }
    }

    // 5. Info for handoff ------------------------------------------------
    const welcome =
      guild.channels.cache.find(
        (c) => c.name === "welcome-briefing" && c.isTextBased()
      ) ||
      guild.channels.cache.find((c) => c.isTextBased() && c.type === 0);

    let inviteUrl = null;
    if (welcome?.isTextBased()) {
      const invite = await welcome.createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: false,
        reason: "UPLINK server setup",
      });
      inviteUrl = invite.url;
    }

    console.log("\n=== CORE & CLASS ROLES READY ===");
    for (const spec of allRoleSpecs) console.log(`  ${spec.name} (${spec.color})`);
    console.log("\n=== CHANNELS READY ===");
    for (const cat of CATEGORIES) {
      console.log(`  ${cat.name}`);
      for (const spec of cat.channels || []) console.log(`    #${spec.name}`);
    }

    console.log("\n=== NEXT STEPS (1 minute, in Server Settings) ===");
    console.log(" 1. Community  → Enable Community, pick #rules & #📢・announcements.");
    console.log(" 2. Roles → assign the colorful class roles as 'self-serve' (so users pick Tank/Healer/DPS).");
    console.log(" 3. Post an invite/embed in #welcome-briefing with the site link.");
    if (!inviteUrl) {
      console.log(" 4. Add `NEXT_PUBLIC_DISCORD_INVITE_URL` env to the site.");
    }

    console.log(`\nDone. Invite link: ${inviteUrl || "see #welcome-briefing"}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(TOKEN);