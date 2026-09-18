/**
 * Assigns a role to EVERY member of the UPLINK Discord server.
 *
 * Usage:
 *   node scripts/grant-role-to-all.cjs "arabic chat"
 *
 * The role is created if it doesn't already exist.
 * Reads DISCORD_BOT_TOKEN from .env.local / .dev.vars automatically.
 * Requires the bot to have the Server Members privileged intent enabled.
 */
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");

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
const ROLE_NAME = process.argv[2];
const ONLY_MISSING = process.argv.includes("--only-missing");

if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  console.error("Add it to .env.local then run: node scripts/grant-role-to-all.cjs \"role name\"");
  process.exit(1);
}
if (!ROLE_NAME) {
  console.error('Pass the role name, e.g.: node scripts/grant-role-to-all.cjs "arabic chat"');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", async () => {
  const guild =
    (process.env.DISCORD_GUILD_ID &&
      client.guilds.cache.get(process.env.DISCORD_GUILD_ID)) ||
    client.guilds.cache.first();

  if (!guild) {
    console.error("Bot is not in any server. Invite the bot first.");
    process.exit(1);
  }

  console.log(`Guild: ${guild.name} (${guild.id})`);
  console.log(`Role: ${ROLE_NAME}`);
  console.log("Fetching roles and members...");

  try {
    await guild.roles.fetch();
    await guild.members.fetch();

    let role = guild.roles.cache.find((r) => r.name === ROLE_NAME);
    if (!role) {
      role = await guild.roles.create({
        name: ROLE_NAME,
        reason: `Role "${ROLE_NAME}" was missing — created by grant-role-to-all`,
      });
      console.log(`Created role: ${role.name} (${role.id})`);
    } else {
      console.log(`Found role: ${role.name} (${role.id})`);
    }

    const members = [...guild.members.cache.values()];
    console.log(`Members fetched: ${members.length}`);

    let granted = 0;
    let skipped = 0;

    for (const member of members) {
      if (member.roles.cache.has(role.id)) {
        skipped++;
        continue;
      }
      await member.roles.add(role, `Grant-role-to-all: ${ROLE_NAME}`);
      granted++;
      if (granted % 50 === 0) {
        console.log(`Progress: ${granted} granted, ${skipped} skipped`);
      }
    }

    console.log("Done.");
    console.log(`Granted: ${granted} | Already had it: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(TOKEN);