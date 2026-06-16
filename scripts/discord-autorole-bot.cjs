/**
 * Grants 💠 Verified Operative when someone joins the UPLINK Discord server.
 *
 * Prerequisites:
 *   1. Bot → Privileged Gateway Intents → Server Members Intent = ON
 *   2. Bot role must be above "Verified Operative" in Server Settings → Roles
 *   3. node scripts/discord-sync-roles.cjs (creates roles first)
 *
 * Usage:
 *   node scripts/discord-autorole-bot.cjs
 *
 * Keep this process running (PM2, screen, or a small VPS).
 */
const { Client, GatewayIntentBits, Events } = require("discord.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const AUTO_ROLE_NAME =
  process.env.DISCORD_AUTO_ROLE_NAME || "💠 Verified Operative";

if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Autorole bot online as ${c.user.tag}`);
  console.log(`Will assign "${AUTO_ROLE_NAME}" on member join.`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const guild =
      process.env.DISCORD_GUILD_ID &&
      member.guild.id !== process.env.DISCORD_GUILD_ID
        ? null
        : member.guild;

    if (!guild) return;

    const role = guild.roles.cache.find((r) => r.name === AUTO_ROLE_NAME);
    if (!role) {
      console.warn(`Role not found: ${AUTO_ROLE_NAME}`);
      return;
    }

    if (member.roles.cache.has(role.id)) return;

    await member.roles.add(role, "UPLINK auto-role on join");
    console.log(`Granted ${AUTO_ROLE_NAME} → ${member.user.tag}`);
  } catch (err) {
    console.error("Autorole failed:", err.message);
  }
});

client.login(TOKEN);
