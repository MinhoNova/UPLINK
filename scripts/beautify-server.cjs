/**
 * Beautifies the UPLINK Discord server for a global audience:
 *  - Deletes legacy categories/channels (ChillZone Arabic layout, ✦・ layout, orphan channel)
 *  - Keeps offer channels (bot matches by name) and slides them into a clean AION-2 LFG category
 *  - Deletes duplicate/legacy roles while keeping the code-bound role set + Aion class color roles
 *  - Sets a clean category/channel order and welcoming English topics
 *
 * Usage: npm run discord:beautify
 */
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require("discord.js");

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

const DELETE_CATEGORIES = [
  "ChillZone🌌",
  "🎶｜ 𝗩𝗢𝗜𝗖𝗘 𝗭𝗢𝗡𝗘🌌",
  "🎶｜ V𝗢𝗜𝗖𝗘 𝗭𝗢𝗡𝗘🌌",
  "✦・START-HERE",
  "✦・COMMUNITY",
];

const DELETE_UNCATEGORIZED = ["codex-permission-check"];

const KEEP_CATEGORY_ORDER = [
  "📌 SYSTEM",
  "⚔️ AION-2 LFG",
  "🗣️ COMMUNITY",
  "💰 MARKETPLACE",
  "🎧 HANGOUT",
  "🔒 STAFF",
];

// Offer channels that must survive (bot matches by channel name).
const OFFER_CHANNEL_NAMES = new Set([
  "🚀・leveling-offers",
  "🏰・dungeon-offers",
  "⚔️・raid-offers",
  "⚡・pvp-offers",
  "🛠️・profession-offers",
  "🎮・lfg",
]);

const DELETE_ROLES = [
  "𝗖𝗥𝗘𝗔𝗧𝗢𝗥🧠",
  "OᗯᑎEᖇ👑",
  "🌻🤍فاعل خير",
  "𝗧𝗥𝗨𝗦𝗧𝗘𝗗🔒",
  "ᕼOᗰEY🫂",
  "ChillZone🌌",
  "⚡ UPLINK Admin",
  "🛡️ UPLINK Moderator",
  "⚔️ Mission Lead",
  "🌟 Elite Booster",
  "💠 Verified Daeva",
];

// Desired role display order (top → bottom); names not found are ignored.
const KEEP_ROLE_ORDER = [
  "👑 UPLINK Owner",
  "⚡ Admin",
  "🛡️ Moderator",
  "👑 Mission Lead",
  "🔥 Elite Booster",
  "🌟 Secret Club",
  "📡 Community",
  "💠 Verified Operative",
  "⚔️ Blade Dancer",
  "🛡️ Vanguard",
  "💠 Daeva",
  "🌙 Night Raider",
  "🌙 Nightwalker",
  "⚔️ Blade Dancer",
  "⚔️ DPS",
  "🔥 Flameborn",
  "💚 Healer",
  "🌿 Elysian",
  "🔮 Asmodian",
  "✨ Luminary",
  "🛡️ Tank",
];

const TOPICS = {
  "welcome-briefing":
    "Welcome to AION 2 LFG ⎯ find squads, list offers, and coordinate on UPLINK (aion2lfg.com). Read #rules, then hit the role picker.",
  rules:
    "Server rules ⎯ keep it respectful, no gold-selling scams, no spam. Violations = mutes/bans. Full policy on UPLINK.",
  "📢・announcements": "Official announcements from the UPLINK team.",
  "🗨️・general-chat": "Game chat, LFG banter, and community talk. English-friendly — all AION 2 players welcome!",
  "🎮・aion-2": "Everything about AION 2: classes, builds, content talk, and the future.",
  "📸・media-clips": "Clips, screenshots, and highlights from your runs.",
  "❓・help": "Need help with the server or UPLINK? Ask away.",
  "💡・suggestions": "Ideas for the community & UPLINK — drop them here.",
  "💰・boost-auction": "Managed marketplace for offers listed on UPLINK. We never handle payments — report scammers to staff.",
  "🚀・leveling-offers": "Leveling squads listed on UPLINK — apply via the site.",
  "🏰・dungeon-offers": "Dungeon offers listed on UPLINK — apply via the site.",
  "⚔️・raid-offers": "Raid offers listed on UPLINK — apply via the site.",
  "⚡・pvp-offers": "PvP offers listed on UPLINK — apply via the site.",
  "🛠️・profession-offers": "Profession offers listed on UPLINK — apply via the site.",
  "🎮・lfg": "Casual self-organized squads — find a group.",
  "🔒・mod-chat": "Staff coordination. Members can't read this channel.",
  "🔊 General": "Hang out and talk while you play.",
  "🎮 Squad LFG": "Looking for a squad? Hop in and chat.",
  "💤 AFK": "Away from keyboard as long as you like.",
};

const DRY = process.argv.includes("--dry-run");

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
    await guild.fetch();
    const channelCollection = await guild.channels.fetch(undefined, { force: true });
    const all = Array.from(channelCollection.values());
    const findCat = (name) => all.find((c) => c.type === ChannelType.GuildCategory && c.name === name);

    console.log(`◆ ${guild.name} (${guild.id})${DRY ? " — DRY RUN" : ""}\n`);

    // 1) Rename legacy offers category to the clean AION-2 LFG name
    const legacyOffersCat = findCat("⚔️・AION-2-LFG");
    const targetCat = findCat("⚔️ AION-2 LFG");
    if (legacyOffersCat && !targetCat) {
      console.log(`RENAME category "${legacyOffersCat.name}" → "⚔️ AION-2 LFG"`);
      if (!DRY) await legacyOffersCat.setName("⚔️ AION-2 LFG", "UPLINK beautify");
    } else if (!targetCat) {
      console.error("Category ⚔️・AION-2-LFG not found — aborting (structure mismatch).");
      process.exit(1);
    }

    // 1.5) Point Community settings at our channels so legacy required channels unlock for deletion
    const currentChannels = Array.from(channelCollection.values());
    const findByName = (n, type) => currentChannels.find((c) => c.name === n && (!type || c.type === type));
    const rulesCh = findByName("rules", ChannelType.GuildText) || findByName("📍・rules");
    const updatesCh = findByName("📢・announcements", ChannelType.GuildText);
    if (!DRY && (rulesCh || updatesCh)) {
      try {
        if (guild.rulesChannelId !== (rulesCh && rulesCh.id) && rulesCh) {
          await guild.setRulesChannel(rulesCh, "UPLINK beautify");
          console.log(`[community] rules channel → #${rulesCh.name}`);
        }
        if (guild.publicUpdatesChannelId !== (updatesCh && updatesCh.id) && updatesCh) {
          await guild.setPublicUpdatesChannel(updatesCh, "UPLINK beautify");
          console.log(`[community] updates channel → #${updatesCh.name}`);
        }
      } catch (err) {
        console.log(`[community] settings: ${err.message}`);
      }
      // refresh cached channel list for this run
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      await sleep(2500);
      await guild.fetch();
      const refetch = await guild.channels.fetch(undefined, { force: true });
      const allRef = Array.from(refetch.values());
      console.log(`[community] actual rulesChannelId=${guild.rulesChannelId} publicUpdates=${guild.publicUpdatesChannelId}`);
      for (const legacyName of ["📜・rules-and-guidelines", "📢・community-updates"]) {
        const legacyRule = allRef.find((c) => c.name === legacyName && !c.parentId);
        if (legacyRule) {
          try {
            await legacyRule.delete("UPLINK beautify (community unlock)");
            console.log(`[community] deleted legacy ${legacyName}`);
          } catch (err) {
            console.log(`[community] ${legacyName} delete failed: ${err.message} — user may need to delete manually`);
          }
        }
      }
    }

    // 2) Delete legacy categories — API does NOT cascade; delete children first, then the category
    for (const name of DELETE_CATEGORIES) {
      const cat = findCat(name);
      if (!cat) {
        console.log(`SKIP category "${name}" (already gone)`);
        continue;
      }
      const kids = all.filter((c) => c.parentId === cat.id);
      if (!DRY) {
        for (const kid of kids) {
          console.log(`DELETE channel #${kid.name}`);
          try {
            await kid.delete("UPLINK beautify (legacy layout)");
          } catch (err) {
            console.log(`  ! failed: ${err.message}`);
          }
        }
        await cat.delete("UPLINK beautify");
      }
      console.log(`DELETE category "${name}" (${kids.length} channels)`);
    }

    // 3) Delete the orphan channel + any leftover uncategorized channels (all legacy)
    const channelCollection2 = await guild.channels.fetch(undefined, { force: true });
    const all2 = Array.from(channelCollection2.values());
    const orphans = all2.filter((c) => !c.parentId && c.type !== ChannelType.GuildCategory);
    for (const ch of orphans) {
      console.log(`DELETE uncategorized #${ch.name}`);
      if (!DRY) {
        try {
          await ch.delete("UPLINK beautify (orphan)");
        } catch (err) {
          console.log(`  ! failed: ${err.message}`);
        }
      }
    }
    for (const name of DELETE_UNCATEGORIZED) {
      const ch = all.find((c) => c.name === name && !c.parentId);
      if (!ch) {
        console.log(`SKIP uncategorized #${name} (already gone)`);
        continue;
      }
      console.log(`DELETE uncategorized #${name}`);
      if (!DRY) {
        try {
          await ch.delete("UPLINK beautify");
        } catch (err) {
          console.log(`  ! failed: ${err.message}`);
        }
      }
    }

    // 4) Ensure offer channels land in the AION-2 LFG category
    await guild.channels.fetch(undefined, { force: true });
    const refreshed = Array.from((await guild.channels.fetch(undefined, { force: true })).values());
    const offersCat = refreshed.find(
      (c) =>
        c.type === ChannelType.GuildCategory &&
        (c.name === "⚔️ AION-2 LFG" || c.name === "⚔️・AION-2-LFG")
    );
    if (!offersCat) {
      console.error("AION-2 LFG category missing after rename.");
      process.exit(1);
    }
    const offersCatName = offersCat.name;
    for (const name of OFFER_CHANNEL_NAMES) {
      const ch = refreshed.find((c) => c.name === name && !c.parentId);
      if (!ch) continue;
      console.log(`MOVE #${name} → ⚔️ AION-2 LFG`);
      if (!DRY) await ch.setParent(offersCat.id, { lockPermissions: true, reason: "UPLINK beautify" });
    }

    // 5) Delete legacy / duplicate roles
    const me = await guild.members.fetchMe();
    const botHighest = me.roles.highest;
    const roles = await guild.roles.fetch();
    const roleList = Array.from(roles.values());
    console.log(`\n[roles] bot top role: ${botHighest.name} (pos ${botHighest.position})`);
    for (const name of DELETE_ROLES) {
      const role = roleList.find(
        (r) =>
          (r.name === name ||
            (name === "ChillZone🌌" && (r.name.toLowerCase().includes("chillzone") || r.name.includes("🌌")))) &&
          !r.managed &&
          r.id !== guild.id
      );
      if (!role) {
        console.log(`SKIP role "${name}" (already gone)`);
        continue;
      }
      if (role.permissions.has(PermissionFlagsBits.Administrator) && !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
        console.log(`SAFE-REFUSE role "${name}" (Administrator). Delete it manually.`);
        continue;
      }
      if (role.position >= botHighest.position) {
        console.log(`ABOVE-BOT role "${name}" — can't delete. Move the bot role above it or delete manually.`);
        continue;
      }
      console.log(`DELETE role "${name}"`);
      try {
        await role.delete("UPLINK beautify");
      } catch (err) {
        console.log(`  ! failed: ${err.message}`);
      }
    }

    // 6) Reorder kept roles so staff come out on top, classes below
    const finalRoles = await guild.roles.fetch();
    let pos = finalRoles.size + 2;
    for (const name of KEEP_ROLE_ORDER) {
      const role = finalRoles.find((r) => r.name === name && !r.managed && r.id !== guild.id);
      if (!role) continue;
      if (role.position > botHighest.position) {
        console.log(`[reorder] ${name}: keep (above bot)`);
        continue;
      }
      try {
        await role.setPosition(pos);
        console.log(`[reorder] ${name} → ${pos}`);
      } catch (err) {
        console.log(`[reorder] ${name}: skipped (${err.message})`);
      }
      pos--;
    }

    // 7) Topics
    if (!DRY) {
      const afterTopics = await guild.channels.fetch(undefined, { force: true });
      for (const [name, topic] of Object.entries(TOPICS)) {
        const ch = afterTopics.find((c) => c.name === name && c.isTextBased() && typeof c.setTopic === "function");
        if (!ch) continue;
        if (ch.topic !== topic) await ch.setTopic(topic, "UPLINK beautify");
      }
    }

    // 8) Category display order
    const finalChannels = await guild.channels.fetch(undefined, { force: true });
    for (let i = 0; i < KEEP_CATEGORY_ORDER.length; i++) {
      const cat = finalChannels.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === KEEP_CATEGORY_ORDER[i]
      );
      if (!cat) continue;
      if (!DRY) {
        try {
          await cat.setPosition(i, "UPLINK beautify");
        } catch (err) {
          console.log(`[order] ${cat.name}: skipped (${err.message})`);
        }
      }
      console.log(`[order] ${cat.name} → ${i}`);
    }

    // 9) Discord locks community rules/updates channels from deletion (50074) — hide them
    //    inside the staff category so members never see them.
    if (!DRY) {
      const hideTargets = await guild.channels.fetch(undefined, { force: true });
      const staffCat = hideTargets.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === "🔒 STAFF"
      );
      for (const name of ["📜・rules-and-guidelines", "📢・community-updates"]) {
        const ch = hideTargets.find((c) => c.name === name && !c.parentId);
        if (!ch) continue;
        if (staffCat) {
          await ch.setParent(staffCat.id, { lockPermissions: true, reason: "UPLINK beautify (hide locked)" });
          console.log(`[hide] #${name} → inside 🔒 STAFF`);
        }
      }
    }

    console.log(`\n${DRY ? "DRY RUN — nothing changed." : "Beautify complete."}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(TOKEN);