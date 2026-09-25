/**
 * Posts the self-service entry-channel picker (NA / EU / ARABIC CHAT) into the
 * guild channel configured via DISCORD_ENTRY_PICKER_CHANNEL_ID (or "welcome-briefing").
 * Skips if a picker message (footer "UPLINK Channel Picker") is already present.
 *
 * Usage:
 *   npm run discord:postpicker            (skip if already posted)
 *   npm run discord:postpicker -- --force (delete existing picker and post fresh)
 *
 * Reads DISCORD_BOT_TOKEN / DISCORD_GUILD_ID / DISCORD_ENTRY_* / DISCORD_ENTRY_PICKER_CHANNEL_ID
 * from .env.local / .dev.vars.
 */
const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".dev.vars"));

const API = "https://discord.com/api/v10";
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1387155425710833674";
const PICKER_FOOTER = "UPLINK Channel Picker";
const PICKER_CHANNEL = process.env.DISCORD_ENTRY_PICKER_CHANNEL_ID?.trim() || "welcome-briefing";

const MAX_ENTRY_ROLES = 2;

const ENTRY_ROLES = [
  { key: "naEast", name: process.env.DISCORD_ENTRY_ROLE_NA_EAST?.trim() || "NA East", customId: "role_naEast", label: "NA East", emoji: "🌎", desc: "NA East channels" },
  { key: "naWest", name: process.env.DISCORD_ENTRY_ROLE_NA_WEST?.trim() || "NA West", customId: "role_naWest", label: "NA West", emoji: "🌍", desc: "NA West channels" },
  { key: "eu", name: process.env.DISCORD_ENTRY_ROLE_EU?.trim() || "EU", customId: "role_eu", label: "EU", emoji: "🇪🇺", desc: "Europe channels" },
  { key: "arabicChat", name: process.env.DISCORD_ENTRY_ROLE_ARABIC_CHAT?.trim() || "ARABIC CHAT", customId: "role_arabicChat", label: "ARABIC CHAT", emoji: "🕌", desc: "Arabic chat channel" },
];

const embed = {
  title: "🚪 Pick your channels",
  description: `Welcome, Explorer! Choose the channels you want to unlock. You can hold up to **${MAX_ENTRY_ROLES}** roles — click a button again to remove it.\n\n${ENTRY_ROLES.map((r) => `${r.emoji} **${r.name}** — ${r.desc}`).join("\n")}`,
  color: 0x00d9ff,
  footer: { text: PICKER_FOOTER },
};

const components = [
  {
    type: 1,
    components: ENTRY_ROLES.map((r) => ({
      type: 2,
      style: 2,
      label: r.label,
      custom_id: r.customId,
      emoji: { name: r.emoji },
    })),
  },
];

const FORCE = process.argv.slice(2).includes("--force");

async function main() {
  if (!TOKEN) {
    console.error("No DISCORD_BOT_TOKEN found in .env.local / .dev.vars");
    process.exit(1);
  }

  const chRes = await fetch(`${API}/guilds/${GUILD_ID}/channels`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  });
  if (chRes.status !== 200) {
    console.error(`Failed to load channels (${chRes.status})`);
    process.exit(1);
  }
  const channels = await chRes.json();
  const target =
    channels.find((c) => c.type === 0 && (c.id === PICKER_CHANNEL || c.name === PICKER_CHANNEL)) ||
    channels.find((c) => c.type === 0 && c.name === "welcome-briefing") ||
    channels.find((c) => c.type === 0);
  if (!target) {
    console.error("No text channel found to post the picker.");
    process.exit(1);
  }
  console.log(`Picker target channel: ${target.name} (${target.id})`);

  const recentRes = await fetch(`${API}/channels/${target.id}/messages?limit=10`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  });
  const recent = await recentRes.json();
  const existing = (Array.isArray(recent) ? recent : []).find(
    (m) => m.embeds && m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text === PICKER_FOOTER
  );
  if (existing && !FORCE) {
    console.log(`Picker already posted: https://discord.com/channels/${GUILD_ID}/${target.id}/${existing.id}`);
    return;
  }
  if (existing) {
    const del = await fetch(`${API}/channels/${target.id}/messages/${existing.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bot ${TOKEN}` },
    });
    console.log(`Removed old picker (${del.status})`);
  }

  const post = await fetch(`${API}/channels/${target.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed], components }),
  });
  if (post.status !== 200) {
    console.error(`Failed to post picker (${post.status}): ${await post.text()}`);
    process.exit(1);
  }
  const body = await post.json();
  console.log(`Posted picker: https://discord.com/channels/${GUILD_ID}/${target.id}/${body.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});