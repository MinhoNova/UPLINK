/**
 * Uploads a server emoji to UPLINK. Needs a boosted server (custom emoji).
 *
 * Usage:
 *   npm run discord:emoji -- --name uplink --file public/og.png
 *   npm run discord:emoji -- --name uplink_wave --file public/default-profile-banner.gif --animated
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

const args = process.argv.slice(2);
const argVal = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const name = argVal("--name") || "uplink";
const file = argVal("--file") || "public/og.png";
const animated = args.includes("--animated");

if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

const ext = path.extname(file).toLowerCase();
const mime = ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : ext === ".apng" ? "image/apng" : "image/png";
const b64 = fs.readFileSync(file).toString("base64");

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
    const emojis = await guild.emojis.fetch();
    let existing = emojis.find((e) => e.name === name);
    if (existing) {
      await existing.edit({ image: `data:${mime};base64,${b64}`, reason: "UPLINK emoji update" });
      console.log(`Updated :${name}: — https://emoji ${existing.id}`);
    } else {
      const emoji = await guild.emojis.create({
        name,
        attachment: `data:${mime};base64,${b64}`,
        reason: "UPLINK brand emoji",
      });
      console.log(`Created :${name}: (id ${emoji.id}) — animated=${animated}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(TOKEN);