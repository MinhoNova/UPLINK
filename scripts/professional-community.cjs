/**
 * One-shot professional UPLINK community setup:
 *  - Ensures the core role set (Owner/Admin/Moderator/Support/Event Host/Premium/VIP/Member/Verified)
 *  - Creates region roles + one private category per region (EU / NA East / NA West)
 *    with channels only visible to that region's role (+ staff)
 *  - Makes every public channel visible to @everyone (so nothing "disappears")
 *  - Rewrites Onboarding:
 *      · REQUIRED single-select prompt "Choose your region" → grants region role + Verified,
 *        reveals that region's channels
 *      · default_channel_ids = ALL public channels (no more follow-to-see)
 *  - Non-destructive: creates/updates only, never deletes roles or channels.
 *
 * Usage:
 *   npm run discord:community
 *   npm run discord:community -- --dry-run
 */
const fs = require("fs");
const path = require("path");
const { PermissionFlagsBits } = require("discord.js");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[m[1].trim()]) process.env[m[1].trim()] = value;
  }
}

const root = path.join(__dirname, "..");
loadEnv(path.join(root, ".env.local"));
loadEnv(path.join(root, ".dev.vars"));
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1387155425710833674";
const API = "https://discord.com/api/v10";
const DRY = process.argv.includes("--dry-run");
if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN is not set.");

async function api(url, options = {}) {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json", ...options.headers },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${options.method || "GET"} ${url}: ${res.status} ${text.slice(0, 240)}`);
  return text ? JSON.parse(text) : null;
}

const combine = (...items) => items.reduce((total, item) => total | item, 0n).toString();

/* ── Core roles (mirrors professionalize-discord-roles.cjs — idempotent) ── */
const CORE_ROLES = [
  ["👑 UPLINK Owner", "Owner", 0xffd700, combine(PermissionFlagsBits.Administrator)],
  ["⚡ Admin", "Administrators", 0xef4444, combine(PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ModerateMembers)],
  ["🛡️ Moderator", "Moderators", 0x3b82f6, combine(PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ModerateMembers)],
  ["🧰 Support", "Support Team", 0x22c55e, combine(PermissionFlagsBits.ManageMessages)],
  ["🎯 Event Host", "Community Management", 0x8b5cf6, combine(PermissionFlagsBits.ManageMessages)],
  ["💎 Premium", "Premium", 0xd4af37, "0"],
  ["⭐ VIP", "VIP", 0xa855f7, "0"],
  ["🌐 Community Member", "Member", 0x38bdf8, "0"],
  ["💠 Verified Operative", "Verified", 0x14b8a6, "0"],
];

/* Staff roles that may view region-gated categories. */
const STAFF_ACCESSORS = ["Owner", "Administrators", "Moderators", "Support Team"];

/* ── Regions (labels match the app: EU / NA (EAST) / NA (WEST)) ── */
const REGIONS = [
  {
    key: "eu",
    label: "EU",
    role: "🇪🇺 EU",
    color: 0x2b3a9c,
    category: "🇪🇺 EUROPE",
    channels: [
      { name: "eu-general", topic: "EU region chat — hang out and plan your runs." },
      { name: "eu-lfg", topic: "EU region looking-for-group. Find your squad here." },
    ],
  },
  {
    key: "na-east",
    label: "NA (EAST)",
    role: "🇺🇸 NA East",
    color: 0x0ea5e9,
    category: "🇺🇸 NA EAST",
    channels: [
      { name: "na-east-general", topic: "NA East region chat — hang out and plan your runs." },
      { name: "na-east-lfg", topic: "NA East region looking-for-group. Find your squad here." },
    ],
  },
  {
    key: "na-west",
    label: "NA (WEST)",
    role: "🇺🇸 NA West",
    color: 0xf59e0b,
    category: "🇺🇸 NA WEST",
    channels: [
      { name: "na-west-general", topic: "NA West region chat — hang out and plan your runs." },
      { name: "na-west-lfg", topic: "NA West region looking-for-group. Find your squad here." },
    ],
  },
];

/* Categories that must never be opened to @everyone. */
const BRANDED_CATEGORIES = ["📌 SYSTEM", "⚔️ AION-2 LFG", "🗣️ COMMUNITY", "🎮 SQUAD CENTER", "🎧 HANGOUT", "🔒 STAFF"];
/* Private channels never opened to @everyone. */
const BLOCKED_NAME_TOKENS = [/staff/i, /admin/i, /mod-chat/i, /support/i, /secret/i, /private/i, /internal/i, /\bonly\b/i, /hidden/i, /\blog\b/i];
function isPrivate(ch) {
  if (REGIONS.some((r) => r.category === ch.name)) return true;
  if (BRANDED_CATEGORIES.some((n) => n === ch.name)) return true;
  if (BLOCKED_NAME_TOKENS.some((t) => t.test(String(ch.name || "")))) return true;
  return REGIONS.some((r) => r.channels.some((c) => c.name === ch.name));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log(`◆ ${DRY ? "DRY RUN — no changes will be applied." : "Applying professional community setup…"}`);

  const [guild, roles, channels] = await Promise.all([
    api(`/guilds/${GUILD_ID}`),
    api(`/guilds/${GUILD_ID}/roles`),
    api(`/guilds/${GUILD_ID}/channels`),
  ]);
  const everyoneId = guild.id;
  const findRole = (name) => roles.find((r) => r.name === name && !r.managed && r.id !== everyoneId);
  const findChannel = (name) => channels.find((c) => c.name === name);
  const byName = (list, name) => list.find((c) => c.name === name);

  /* 1 ── Ensure core roles */
  const roleIdFor = new Map();
  for (const [oldName, name, color, permissions] of CORE_ROLES) {
    let role = findRole(name) || findRole(oldName);
    if (role) {
      if (!DRY) {
        role = await api(`/guilds/${GUILD_ID}/roles/${role.id}`, { method: "PATCH", body: JSON.stringify({ name, color, permissions, hoist: false }) });
      }
      console.log(`[role] ensure ${name}`);
    } else if (!DRY) {
      role = await api(`/guilds/${GUILD_ID}/roles`, { method: "POST", body: JSON.stringify({ name, color, permissions, hoist: false }) });
      console.log(`[role] created ${name}`);
    }
    if (role) roleIdFor.set(name, role.id);
  }

  /* 2 ── Ensure region roles + private categories/channels */
  const regionRoles = new Map();
  const regionCategoryIds = new Map();
  const regionChannelIds = new Map();
  for (const region of REGIONS) {
    let role = findRole(region.role) || roles.find((r) => r.name === region.label && !r.managed);
    if (role) {
      if (!DRY) {
        role = await api(`/guilds/${GUILD_ID}/roles/${role.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: region.role, color: region.color, permissions: "0", hoist: false }),
        });
      }
      console.log(`[region:${region.label}] ensure role ${region.role}`);
    } else if (!DRY) {
      role = await api(`/guilds/${GUILD_ID}/roles`, {
        method: "POST",
        body: JSON.stringify({ name: region.role, color: region.color, permissions: "0", hoist: false }),
      });
      console.log(`[region:${region.label}] created role ${region.role}`);
    }
    if (role) {
      regionRoles.set(region.key, role.id);
      if (!DRY) roles.push(role);
    }

    let cat = byName(channels, region.category);
    if (cat) {
      console.log(`[region:${region.label}] category exists ${region.category}`);
    } else if (!DRY) {
      cat = await api(`/guilds/${GUILD_ID}/channels`, {
        method: "POST",
        body: JSON.stringify({ name: region.category, type: 4 }),
      });
      channels.push(cat);
      console.log(`[region:${region.label}] created category ${region.category}`);
    }
    if (cat) regionCategoryIds.set(region.key, cat.id);

    const kids = [];
    for (const def of region.channels) {
      let ch = findChannel(def.name);
      if (ch) {
        console.log(`[region:${region.label}] channel exists #${def.name}`);
      } else if (!DRY) {
        ch = await api(`/guilds/${GUILD_ID}/channels`, {
          method: "POST",
          body: JSON.stringify({
            name: def.name,
            type: 0,
            parent_id: cat?.id,
            topic: def.topic,
          }),
        });
        channels.push(ch);
        console.log(`[region:${region.label}] created #${def.name}`);
      }
      if (ch) kids.push(ch);
    }
    regionChannelIds.set(region.key, kids.map((k) => k.id));

    /* Region category overwrites: hide from @everyone, open only to region + staff */
    if (cat) {
      const overwrites = [
        { id: everyoneId, type: 0, allow: "0", deny: String(PermissionFlagsBits.ViewChannel) },
        { id: regionRoles.get(region.key), type: 0, allow: String(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages), deny: "0" },
      ];
      for (const staffName of STAFF_ACCESSORS) {
        const sid = roleIdFor.get(staffName);
        if (sid) overwrites.push({ id: sid, type: 0, allow: String(PermissionFlagsBits.ViewChannel), deny: "0" });
      }
      if (!DRY) {
        await api(`/channels/${cat.id}`, {
          method: "PATCH",
          body: JSON.stringify({ permission_overwrites: overwrites }),
        });
      }
      console.log(`[region:${region.label}] gated category ${region.category}`);
      for (const ch of kids) {
        if (!DRY) {
          await api(`/channels/${ch.id}`, {
            method: "PATCH",
            body: JSON.stringify({ parent_id: cat.id, permission_overwrites: overwrites }),
          });
        }
        console.log(`[region:${region.label}] gated #${ch.name}`);
        await sleep(250);
      }
    }
  }

  /* 3 ── Make every public channel visible to @everyone (fix disappearing channels) */
  let opened = 0;
  for (const ch of channels) {
    if (isPrivate(ch)) continue;
    const existing = (ch.permission_overwrites || []).find((o) => o.id === everyoneId);
    let allow = existing ? BigInt(existing.allow || 0) : 0n;
    let deny = existing ? BigInt(existing.deny || 0) : 0n;
    allow |= BigInt(PermissionFlagsBits.ViewChannel);
    deny &= ~BigInt(PermissionFlagsBits.ViewChannel);
    if (deny === (existing ? BigInt(existing.deny || 0) : 0n) && allow === (existing ? BigInt(existing.allow || 0) : 0n)) {
      continue;
    }
    const ow = (ch.permission_overwrites || []).filter((o) => o.id !== everyoneId);
    ow.push({ id: everyoneId, type: 0, allow: allow.toString(), deny: deny.toString() });
    if (!DRY) {
      await api(`/channels/${ch.id}`, { method: "PATCH", body: JSON.stringify({ permission_overwrites: ow }) });
    }
    opened++;
    console.log(`[open] #${ch.name}`);
    await sleep(200);
  }
  console.log(`[open] ${opened} public channels ensured visible to @everyone`);

  /* 4 ── Rewrite Onboarding: region prompt (required) + all public channels as defaults */
  const publicChannels = channels.filter((c) => !isPrivate(c) && c.type === 0);
  const defaultChannelIds = publicChannels.map((c) => c.id);

  const regionPromptOptions = REGIONS.map((region, i) => {
    const roleId = regionRoles.get(region.key);
    const channelIds = regionChannelIds.get(region.key) || [];
    return {
      id: `90000000000000001${i}`,
      title: region.label,
      description: `Play on ${region.label} — unlock ${region.label} channels`,
      emoji: { name: region.role.split(" ")[0] },
      role_ids: roleId ? [roleId, roleIdFor.get("Verified")].filter(Boolean) : [],
      channel_ids: channelIds,
    };
  });

  const onboarding = {
    prompts: [
      {
        id: "9000000000000000010",
        title: "🌍 Choose your region",
        type: 1,
        single_select: true,
        required: true,
        in_onboarding: true,
        options: regionPromptOptions,
      },
    ],
    default_channel_ids: defaultChannelIds,
    enabled: true,
    mode: 1,
  };

  if (DRY) {
    console.log(`[onboarding] would set ${regionPromptOptions.length} region options + ${defaultChannelIds.length} default channels (mode advanced)`);
  } else {
    const body = await api(`/guilds/${GUILD_ID}/onboarding`, {
      method: "PUT",
      body: JSON.stringify(onboarding),
    });
    console.log(`[onboarding] applied: enabled=${body.enabled} prompts=${body.prompts?.length} defaults=${body.default_channel_ids?.length}`);
  }

  /* 5 ── Reorder region categories right after AION-2 LFG (best-effort, no-crash) */
  const order = ["📌 SYSTEM", "⚔️ AION-2 LFG", ...REGIONS.map((r) => r.category), "🗣️ COMMUNITY", "🎮 SQUAD CENTER", "🎧 HANGOUT", "🔒 STAFF"];
  if (!DRY) {
    try {
      const cats = channels.filter((c) => c.type === 4 && order.includes(c.name));
      if (cats.length) {
        const patched = await api(`/guilds/${GUILD_ID}/channels`, {
          method: "PATCH",
          body: JSON.stringify(cats.map((c, i) => ({ id: c.id, position: i }))),
        });
        console.log(`[order] repositioned ${Array.isArray(patched) ? patched.length : cats.length} categories`);
      } else {
        console.log("[order] no matching categories found");
      }
    } catch (err) {
      console.log(`[order] skipped: ${err.message}`);
    }
  }

  console.log(`\n${DRY ? "DRY RUN complete — nothing changed." : "Professional community setup complete."}`);
  console.log("Reminder: Verified is also auto-granted every minute to new members (custom-worker cron).");
})().catch((e) => { console.error(e.message); process.exit(1); });