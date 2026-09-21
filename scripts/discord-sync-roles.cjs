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
  process.env.DISCORD_GUILD_ID = "1387155425710833674";
}

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const OWNER_USER_ID = process.env.DISCORD_OWNER_USER_ID || "1497295886223544471";

const ROLE_SPECS = [
  {
    key: "owner",
    name: "👑 UPLINK Owner",
    color: "#ffd700",
    hoist: true,
    permissions: [
      PermissionsBitField.Flags.Administrator,
    ],
  },
  {
    key: "admin",
    name: "⚡ Admin",
    color: "#ff007f",
    hoist: true,
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
    color: "#06b6d4",
    hoist: true,
    permissions: [
      PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.ModerateMembers,
      PermissionsBitField.Flags.ManageMessages,
    ],
  },
  {
    key: "support",
    name: "🕊️ Support",
    color: "#22d3ee",
    permissions:
      Object.entries(PermissionsBitField.Flags)
        .filter(([k]) => k !== "Administrator")
        .map(([, v]) => v),
  },
  {
    key: "missionLead",
    name: "👑 Mission Lead",
    color: "#8a2be2",
    hoist: true,
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
    color: "#0ea5e9",
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
      try {
        if (!role) {
          role = await guild.roles.create({
            name: spec.name,
            color: spec.color,
            permissions: spec.permissions,
            hoist: spec.hoist ?? false,
            reason: "UPLINK role sync",
          });
          console.log(`Created role: ${spec.name}`);
        } else {
          await role.edit({
            color: spec.color,
            permissions: spec.permissions,
            hoist: spec.hoist ?? false,
            reason: "UPLINK role sync",
          });
          console.log(`Updated role: ${spec.name}`);
        }
      } catch (err) {
        console.warn(
          `Skipped ${spec.name} — not permitted (${err.message}). Move the bot role above it or edit manually.`
        );
        continue;
      }
      created[spec.key] = role;
    }

    // Hierarchy: owner highest (below bot), verified lowest of custom roles
    const botRole = guild.members.me?.roles.highest;
    let position = (botRole?.position ?? 1) - 1;
    const order = [
      "owner",
      "admin",
      "support",
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
      try {
        await role.setPosition(position, { reason: "UPLINK role hierarchy" });
      } catch {
        console.warn(`Could not reposition ${role.name} — not permitted (above the bot role).`);
      }
      position -= 1;
    }

    const ownerRole = created.owner;
    if (ownerRole) {
      const member = await guild.members.fetch(OWNER_USER_ID).catch(() => null);
      if (member) {
        try {
          await member.roles.add(ownerRole, "UPLINK owner assignment");
          console.log(`Assigned ${ownerRole.name} to ${member.user.tag}`);
        } catch {
          console.warn(
            `Could not assign ${ownerRole.name} — the bot role sits below it. Assign it manually in Discord.`
          );
        }
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
