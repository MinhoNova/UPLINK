/**
 * Restores normal member access for the UPLINK Discord guild.
 *
 * - Keeps STAFF/private channels hidden.
 * - Makes every public channel visible to @everyone.
 * - Lets members chat in community/LFG channels and connect/speak in voice.
 * - Enables invite creation from public welcome/community channels.
 * - Backfills the Verified Operative role for every current member.
 * - Disables Discord Onboarding, which otherwise makes members manually follow channels.
 *
 * Usage: npm run discord:repair
 */
const fs = require("fs");
const path = require("path");
const { PermissionFlagsBits } = require("discord.js");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".dev.vars"));

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID || "1387155425710833674";
const api = "https://discord.com/api/v10";
const privateCategoryIds = new Set(["1548477707539452086"]);
const privateName = /staff|\bmod\b|admin|support|secret|private|internal|\bonly\b|hidden|\blog\b/i;

if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  process.exit(1);
}

async function discord(pathname, options = {}) {
  const response = await fetch(`${api}${pathname}`, {
    ...options,
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", ...options.headers },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method || "GET"} ${pathname} → ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

function isPrivate(channel) {
  return privateCategoryIds.has(channel.id) || privateCategoryIds.has(channel.parent_id) || privateName.test(channel.name || "");
}

function addEveryoneOverwrite(channel, everyoneId, allowed) {
  const overwrites = (channel.permission_overwrites || []).filter((overwrite) => overwrite.id !== everyoneId);
  const current = (channel.permission_overwrites || []).find((overwrite) => overwrite.id === everyoneId);
  let allow = BigInt(current?.allow || "0");
  let deny = BigInt(current?.deny || "0");
  allow |= allowed;
  deny &= ~allowed;
  overwrites.push({ id: everyoneId, type: 0, allow: allow.toString(), deny: deny.toString() });
  return overwrites;
}

const VIEW = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ReadMessageHistory;
const CHAT = VIEW | PermissionFlagsBits.SendMessages | PermissionFlagsBits.SendMessagesInThreads |
  PermissionFlagsBits.CreatePublicThreads | PermissionFlagsBits.EmbedLinks | PermissionFlagsBits.AttachFiles |
  PermissionFlagsBits.AddReactions | PermissionFlagsBits.UseExternalEmojis;
const VOICE = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak |
  PermissionFlagsBits.Stream | PermissionFlagsBits.UseVAD;
const INVITE = PermissionFlagsBits.CreateInstantInvite;

function accessFor(channel) {
  if (channel.type === 2 || channel.type === 13) return VOICE;
  if (channel.type === 4) return VIEW;
  const name = String(channel.name || "").toLowerCase();
  const isReadOnly = name.includes("rules") || name.includes("announcement") || name.includes("community-updates") ||
    name.includes("-offers") || name.includes("welcome-briefing");
  const canInvite = name.includes("welcome") || name.includes("general") || name.includes("lfg");
  return (isReadOnly ? VIEW : CHAT) | (canInvite ? INVITE : 0n);
}

async function disableOnboarding() {
  try {
    const onboarding = await discord(`/guilds/${guildId}/onboarding`);
    await discord(`/guilds/${guildId}/onboarding`, {
      method: "PUT",
      body: JSON.stringify({
        prompts: onboarding.prompts || [],
        default_channel_ids: onboarding.default_channel_ids || [],
        enabled: false,
        mode: onboarding.mode ?? 1,
      }),
    });
    console.log("Disabled Discord Onboarding so members no longer need to follow channels.");
  } catch (error) {
    console.warn(`Could not disable Onboarding: ${error.message}`);
  }
}

async function main() {
  const [guild, channels, roles, members] = await Promise.all([
    discord(`/guilds/${guildId}`),
    discord(`/guilds/${guildId}/channels`),
    discord(`/guilds/${guildId}/roles`),
    discord(`/guilds/${guildId}/members?limit=1000`),
  ]);
  const verified = roles.find((role) => role.name === "💠 Verified Operative");
  if (!verified) throw new Error('Role "💠 Verified Operative" was not found.');

  let opened = 0;
  for (const channel of channels) {
    if (isPrivate(channel)) continue;
    await discord(`/channels/${channel.id}`, {
      method: "PATCH",
      body: JSON.stringify({ permission_overwrites: addEveryoneOverwrite(channel, guild.id, accessFor(channel)) }),
    });
    opened += 1;
  }
  console.log(`Restored public access on ${opened} channels/categories.`);

  let granted = 0;
  for (const member of members) {
    if (!member.user?.id || member.user.bot || member.roles?.includes(verified.id)) continue;
    await discord(`/guilds/${guildId}/members/${member.user.id}/roles/${verified.id}`, { method: "PUT" });
    granted += 1;
  }
  console.log(`Granted ${verified.name} to ${granted} existing members.`);
  await disableOnboarding();
}

main().catch((error) => {
  console.error(`Discord access repair failed: ${error.message}`);
  process.exit(1);
});
