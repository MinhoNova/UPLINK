/** Applies the approved professional UPLINK Discord role structure. */
const fs = require("fs");
const path = require("path");
const { PermissionFlagsBits } = require("discord.js");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[match[1].trim()]) process.env[match[1].trim()] = value;
  }
}

const root = path.join(__dirname, "..");
loadEnv(path.join(root, ".env.local"));
loadEnv(path.join(root, ".dev.vars"));
const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID || "1387155425710833674";
const API = "https://discord.com/api/v10";
if (!token) throw new Error("DISCORD_BOT_TOKEN is not set.");

async function api(url, options = {}) {
  const response = await fetch(`${API}${url}`, { ...options, headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", ...options.headers } });
  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url}: ${response.status} ${text.slice(0, 240)}`);
  return text ? JSON.parse(text) : null;
}

const combine = (...items) => items.reduce((total, item) => total | item, 0n).toString();
const rolesToKeep = [
  ["👑 UPLINK Owner", "👑 UPLINK Owner", 0xffd700, combine(PermissionFlagsBits.Administrator)],
  ["⚡ Admin", "⚡ Admin", 0xef4444, combine(PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ModerateMembers)],
  ["🛡️ Moderator", "🛡️ Moderator", 0x3b82f6, combine(PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ModerateMembers)],
  ["__support__", "🧰 Support", 0x22c55e, combine(PermissionFlagsBits.ManageMessages)],
  ["👑 Mission Lead", "🎯 Event Host", 0x8b5cf6, combine(PermissionFlagsBits.ManageMessages)],
  ["🔥 Elite Booster", "💎 Premium", 0xd4af37, "0"],
  ["🌟 Secret Club", "⭐ VIP", 0xa855f7, "0"],
  ["📡 Community", "🌐 Community Member", 0x38bdf8, "0"],
  ["💠 Verified Operative", "💠 Verified Operative", 0x14b8a6, "0"],
];
const legacyNames = new Set(["🛡️ Vanguard", "💠 Daeva", "🌙 Night Raider", "🌙 Nightwalker", "⚔️ Blade Dancer", "🔥 Flameborn", "🌿 Elysian", "🔮 Asmodian", "ChillZone🌌", "✨ Luminary", "🛡️ Tank", "💚 Healer", "⚔️ DPS", "Aetheria"]);

(async () => {
  let roles = await api(`/guilds/${guildId}/roles`);
  const me = await api("/users/@me");
  const botMember = await api(`/guilds/${guildId}/members/${me.id}`);
  const botRoleIds = new Set(botMember.roles || []);
  const botTop = Math.max(...roles.filter((role) => botRoleIds.has(role.id)).map((role) => role.position));
  const orderedIds = [];

  for (const [oldName, name, color, permissions] of rolesToKeep) {
    let role = roles.find((item) => item.name === oldName || item.name === name);
    const payload = { name, color, permissions, mentionable: false, hoist: false };
    if (role) {
      if (role.position >= botTop) { console.log(`Kept above-bot role unchanged: ${role.name}`); continue; }
      role = await api(`/guilds/${guildId}/roles/${role.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      console.log(`Updated: ${name}`);
    } else {
      role = await api(`/guilds/${guildId}/roles`, { method: "POST", body: JSON.stringify(payload) });
      console.log(`Created: ${name}`);
    }
    orderedIds.push(role.id);
    roles = await api(`/guilds/${guildId}/roles`);
  }

  const verified = roles.find((role) => role.name === "💠 Verified Operative");
  if (!verified) throw new Error("Verified role is missing.");
  const members = await api(`/guilds/${guildId}/members?limit=1000`);
  let verifiedCount = 0;
  for (const member of members) {
    if (!member.user?.bot && !member.roles.includes(verified.id)) {
      await api(`/guilds/${guildId}/members/${member.user.id}/roles/${verified.id}`, { method: "PUT" });
      verifiedCount++;
    }
  }
  console.log(`Verified members added: ${verifiedCount}`);

  roles = await api(`/guilds/${guildId}/roles`);
  for (const role of roles) {
    if (!legacyNames.has(role.name) || role.managed || role.position >= botTop) continue;
    await api(`/guilds/${guildId}/roles/${role.id}`, { method: "DELETE" });
    console.log(`Removed legacy role: ${role.name}`);
  }

  const positions = orderedIds.map((id, index) => ({ id, position: botTop - 1 - index }));
  if (positions.length) await api(`/guilds/${guildId}/roles`, { method: "PATCH", body: JSON.stringify(positions) });
  console.log("Professional role structure applied.");
})().catch((error) => { console.error(error.message); process.exit(1); });
