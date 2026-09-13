/**
 * Prints the current Discord server structure (categories → channels, roles in order).
 * Usage: npm run discord:inspect
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".dev.vars"));

if (!process.env.DISCORD_GUILD_ID) process.env.DISCORD_GUILD_ID = "1497323747198238933";
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild =
    (process.env.DISCORD_GUILD_ID && client.guilds.cache.get(process.env.DISCORD_GUILD_ID)) ||
    client.guilds.cache.first();
  if (!guild) {
    console.error("Bot is not in any server.");
    process.exit(1);
  }

  try {
    const [channels, roles] = await Promise.all([
      guild.channels.fetch(undefined, { force: true }),
      guild.roles.fetch(),
    ]);

    const all = Array.from(channels.values());
    const byParent = new Map();
    const uncategorized = [];
    for (const ch of all) {
      if (ch.type === ChannelType.GuildCategory) continue;
      if (!ch.parentId) uncategorized.push(ch);
      else {
        if (!byParent.has(ch.parentId)) byParent.set(ch.parentId, []);
        byParent.get(ch.parentId).push(ch);
      }
    }

    const categories = all
      .filter((c) => c.type === ChannelType.GuildCategory)
      .sort((a, b) => a.position - b.position);

    console.log("=== CATEGORIES & CHANNELS (in display order) ===");
    for (const cat of categories) {
      const kids = (byParent.get(cat.id) || [])
        .sort((a, b) => a.position - b.position)
        .map((k) => {
          const type =
            k.type === 2 ? "[VOICE] " : k.type === 5 ? "[ANNOUNCE] " : k.type === 13 ? "[STAGE] " : "";
          const topic = k.topic && typeof k.topic === "string" ? `  ${k.topic.slice(0, 60)}` : "";
          return `   ${type}#${k.name}${topic}`;
        });
      console.log(`◆ ${cat.name} ${kids.length ? `(${kids.length})` : ""}`);
      for (const line of kids) console.log(line);
    }
    if (uncategorized.length) {
      console.log("— UNCATEGORIZED —");
      for (const ch of uncategorized) console.log(`  #${ch.name}`);
    }

    console.log("\n=== ROLES (top → bottom) ===");
    const sorted = roles.sorted((a, b) => b.position - a.position);
    for (const r of sorted.values()) {
      if (r.id === guild.id) continue;
      const hex = r.hexColor.toUpperCase();
      console.log(`  ${hex} ${r.name}`);
    }

    console.log("\n=== SERVER ===");
    console.log(`  Name: ${guild.name}`);
    console.log(`  Icon hash: ${guild.icon || "(none)"}`);
    console.log(`  Members: ${guild.memberCount}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(TOKEN);