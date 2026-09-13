/**
 * Enables Discord Onboarding ("first-join" screen) for UPLINK:
 *  - Required prompt: choose your squad role (Tank / Healer / DPS)
 *  - Optional prompt: pick a class color (Blade Dancer, Vanguard, ...)
 *  - Default channels a new member lands in: welcome, rules, general, aion-2
 *
 * Usage: npm run discord:onboarding
 */
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, PermissionFlagsBits } = require("discord.js");

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

const ROLE_PROMPTS = {
  tank: { name: "🛡️ Tank", emoji: { name: "🛡️" } },
  healer: { name: "💚 Healer", emoji: { name: "💚" } },
  dps: { name: "⚔️ DPS", emoji: { name: "⚔️" } },
};
const CLASS_ROLES = [
  { name: "⚔️ Blade Dancer", emoji: { name: "⚔️" } },
  { name: "🛡️ Vanguard", emoji: { name: "🛡️" } },
  { name: "💠 Daeva", emoji: { name: "💠" } },
  { name: "🌙 Night Raider", emoji: { name: "🌙" } },
  { name: "🌙 Nightwalker", emoji: { name: "🌙" } },
  { name: "🔥 Flameborn", emoji: { name: "🔥" } },
  { name: "🌿 Elysian", emoji: { name: "🌿" } },
  { name: "🔮 Asmodian", emoji: { name: "🔮" } },
  { name: "✨ Luminary", emoji: { name: "✨" } },
];

const DEFAULT_CHANNELS = ["welcome-briefing", "rules", "🗨️・general-chat", "🎮・aion-2"];

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
    const [roles, channels] = await Promise.all([guild.roles.fetch(), guild.channels.fetch(undefined, { force: true })]);
    const findRole = (name) => roles.find((r) => r.name === name && !r.managed && r.id !== guild.id);
    const findChannel = (name) => channels.find((c) => c.name === name);

    const roleOptions = (list) =>
      list
        .map(({ name, emoji }) => {
          const role = findRole(name);
          return role
            ? {
                id: role.id,
                title: name,
                description: name.split(" ").slice(1).join(" ") || name,
                emoji,
                role_ids: [role.id],
                channel_ids: [],
              }
            : null;
        })
        .filter(Boolean);

    const PROMPT_IDS = ["9000000000000000001", "9000000000000000002"];

    const rolePrompt = {
      id: PROMPT_IDS[0],
      title: "⚔️ Choose your squad role",
      type: 1, // single choice
      single_select: true,
      required: true,
      in_onboarding: true,
      options: roleOptions(Object.values(ROLE_PROMPTS)),
    };
    const classPrompt = {
      id: PROMPT_IDS[1],
      title: "🎨 Pick a class color",
      type: 0, // multiple choice
      single_select: false,
      required: false,
      in_onboarding: true,
      options: roleOptions(CLASS_ROLES),
    };

    const defaultChannels = DEFAULT_CHANNELS
      .map((n) => findChannel(n))
      .filter(Boolean);

    for (const c of defaultChannels) {
      const view = c
        .permissionsFor(guild.roles.everyone)
        .has(PermissionFlagsBits.ViewChannel);
      if (!view) {
        await c.permissionOverwrites.edit(guild.id, { ViewChannel: true }, { reason: "Onboarding default channel — @everyone needs view access." });
        console.log(`Granted @everyone VIEW on #${c.name}`);
      }
    }

    const defaultChannelIds = defaultChannels.map((c) => c.id);

    const data = {
      prompts: [rolePrompt, classPrompt],
      default_channel_ids: defaultChannelIds,
      enabled: true,
      mode: 1,
    };

    console.log("Applying onboarding payload...");
    const res = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/onboarding`, {
      method: "PUT",
      headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (res.status >= 400) {
      console.error("Onboarding update failed:", JSON.stringify(body).slice(0, 600));
      process.exit(1);
    }
    console.log("Onboarding updated (enabled:", body.enabled, "| prompts:", body.prompts?.length, ")");

    console.log("Default channels:", defaultChannelIds.length, "| role prompt options:", rolePrompt.options.length, "| class prompt options:", classPrompt.options.length);
    console.log(
      "Chosen defaults:",
      (await Promise.all(defaultChannelIds.map(async (id) => (await channels.get(id))?.name))).join(", ") || "(none)"
    );
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(TOKEN);