/**
 * Deletes legacy WoW-era channels / categories from the UPLINK Discord server.
 * Conservative: only removes known WoW names + obvious WoW patterns, plus a
 * duplicated welcome-briefing that isn't inside the 📌 SYSTEM category.
 *
 * Usage:
 *   npm run discord:cleanup
 */
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

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
  process.exit(1);
}

const WOW_CATEGORIES = new Set([
  "📡 COMMAND CENTER",
  "⚔️ ACTIVE MISSIONS (LFG)",
  "💰 GOLD MARKET",
  "🎧 SECURE COMMS",
]);

const WOW_CHANNELS = new Set([
  "lfg-mythic-plus",
  "lfg-retail-wow",
  "🎮・retail-wow",
  "retail-wow",
  "leveling-squads",
  "wtb-wts-gold",
  "Lobby Alpha",
  "Lobby Bravo",
  "uplink-announcements",
]);

const chat = new Client({ intents: [GatewayIntentBits.Guilds] });

chat.once("ready", async () => {
  const guild =
    (process.env.DISCORD_GUILD_ID &&
      chat.guilds.cache.get(process.env.DISCORD_GUILD_ID)) ||
    chat.guilds.cache.first();

  if (!guild) {
    console.error("Bot is not in any server.");
    process.exit(1);
  }

  console.log(`Scanning ${guild.name} (${guild.id})...\n`);

  try {
    const channels = await guild.channels.fetch(undefined, { force: true });

    const toDeleteChannels = [];
    const toDeleteCategories = [];
    const systemWelcomeCount = 0;

    for (const ch of channels.values()) {
      const name = ch.name;
      if (ch.type === ChannelType.GuildCategory) {
        if (WOW_CATEGORIES.has(name)) {
          toDeleteCategories.push(ch);
          console.log(`category → delete: ${name}`);
        }
        continue;
      }

      const isWow =
        WOW_CHANNELS.has(name) ||
        name.toLowerCase().includes("mythic") ||
        name.toLowerCase().includes("retail-wow") ||
        name.toLowerCase().includes("wow");

      if (isWow) {
        toDeleteChannels.push(ch);
        console.log(`#${name} → delete (wow-era)`);
        continue;
      }

      // Keep exactly one welcome-briefing: the one under 📌 SYSTEM.
      if (name === "welcome-briefing") {
        const parentName = ch.parent?.name ?? "";
        if (parentName !== "📌 SYSTEM") {
          toDeleteChannels.push(ch);
          console.log(`#${name} → delete (duplicate outside 📌 SYSTEM)`);
        }
      }
    }

    if (!toDeleteChannels.length && !toDeleteCategories.length) {
      console.log("Nothing to clean — server already WoW-free.");
      process.exit(0);
    }

    for (const ch of toDeleteChannels) {
      await ch.delete("UPLINK WoW cleanup");
      console.log(`Deleted #${ch.name}`);
    }

    for (const cat of toDeleteCategories) {
      await cat.delete("UPLINK WoW cleanup");
      console.log(`Deleted category ${cat.name}`);
    }

    console.log("\nCleanup complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

chat.login(TOKEN);