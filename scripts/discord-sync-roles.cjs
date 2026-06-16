/**
 * Creates / updates UPLINK Discord roles and assigns Owner to the project lead.
 *
 * Usage:
 *   npm run discord:roles
 *
 * Reads DISCORD_BOT_TOKEN from .env.local / .dev.vars automatically.
 */
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

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
const OWNER_USER_ID = process.env.DISCORD_OWNER_USER_ID || "1497295886223544471";

const ROLE_SPECS = [
  {
    key: "owner",
    name: "👑 UPLINK Owner",
    color: "#ffd700",
    permissions: [
      PermissionsBitField.Flags.Administrator,
    ],
  },
  {
    key: "admin",
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
    key: "moderator",
    name: "🛡️ Moderator",
    color: "#00ffff",
    permissions: [
      PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.ModerateMembers,
      PermissionsBitField.Flags.ManageMessages,
    ],
  },
  {
    key: "missionLead",
    name: "👑 Mission Lead",
    color: "#8a2be2",
    permissions: [PermissionsBitField.Flags.ManageMessages],
  },
  {
    key: "booster",
    name: "🔥 Elite Booster",
    color: "#ff4500",
    permissions: [],
  },
  {
    key: "secretClub",
    name: "🌟 Secret Club",
    color: "#c084fc",
    permissions: [],
  },
  {
    key: "community",
    name: "📡 Community",
    color: "#38bdf8",
    permissions: [],
  },
  {
    key: "verified",
    name: "💠 Verified Operative",
    color: "#00ffff",
    permissions: [],
  },
];

if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  console.error("Add it to .env.local then run: npm run discord:roles");
  process.exit(1);
}

console.log(`Guild ID: ${process.env.DISCORD_GUILD_ID}`);
console.log("Connecting to Discord...");

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

  console.log(`Syncing roles in: ${guild.name} (${guild.id})`);

  try {
    await guild.roles.fetch();
    const created = {};

    for (const spec of ROLE_SPECS) {
      let role = guild.roles.cache.find((r) => r.name === spec.name);
      if (!role) {
        role = await guild.roles.create({
          name: spec.name,
          color: spec.color,
          permissions: spec.permissions,
          reason: "UPLINK role sync",
        });
        console.log(`Created role: ${spec.name}`);
      } else {
        await role.edit({
          color: spec.color,
          permissions: spec.permissions,
          reason: "UPLINK role sync",
        });
        console.log(`Updated role: ${spec.name}`);
      }
      created[spec.key] = role;
    }

    // Hierarchy: owner highest (below bot), verified lowest of custom roles
    const botRole = guild.members.me?.roles.highest;
    let position = (botRole?.position ?? 1) - 1;
    const order = [
      "owner",
      "admin",
      "moderator",
      "missionLead",
      "booster",
      "secretClub",
      "community",
      "verified",
    ];
    for (const key of order) {
      const role = created[key];
      if (!role || position < 1) continue;
      await role.setPosition(position, { reason: "UPLINK role hierarchy" });
      position -= 1;
    }

    const ownerRole = created.owner;
    if (ownerRole) {
      const member = await guild.members.fetch(OWNER_USER_ID).catch(() => null);
      if (member) {
        await member.roles.add(ownerRole, "UPLINK owner assignment");
        console.log(`Assigned ${ownerRole.name} to ${member.user.tag}`);
      } else {
        console.warn(
          `Could not find member ${OWNER_USER_ID} in guild — join the server first, then re-run.`
        );
      }
    }

    const welcome = guild.channels.cache.find(
      (c) => c.name === "welcome-briefing" && c.isTextBased()
    );
    const targetChannel =
      welcome ||
      guild.channels.cache.find((c) => c.isTextBased() && c.type === 0);

    if (targetChannel?.isTextBased()) {
      const invite = await targetChannel.createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: false,
        reason: "UPLINK site invite link",
      });
      console.log("\n--- Add this to wrangler.jsonc / Cloudflare secrets ---");
      console.log(`NEXT_PUBLIC_DISCORD_INVITE_URL=${invite.url}`);
      console.log(`DISCORD_GUILD_ID=${guild.id}`);
    }

    console.log("\nRoles synced. Auto-role runs on the site via Cloudflare cron.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(TOKEN);
