/**
 * Makes every non-private channel visible to @everyone (VIEW_CHANNEL allow).
 * Private channels (STAFF category / admin / support / spec tokens) are skipped.
 *
 * Usage: npm run discord:channels-visible
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".dev.vars"));
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1387155425710833674";
if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  process.exit(1);
}

const VIEW = 1024n;
/* Category ids that must stay hidden (private). */
const BLOCKED_CATEGORY_IDS = new Set(["1548477707539452086" /* STAFF */]);
/* Name fragments that mark a channel as private. */
const BLOCKED_NAME_TOKENS = [/staff/i, /\bmod\b/i, /admin/i, /support/i, /secret/i, /private/i, /internal/i, /\bonly\b/i, /hidden/i, /\blog\b/i];

function isBlocked(ch) {
  if (ch.type === 4 && BLOCKED_CATEGORY_IDS.has(ch.id)) return true;
  if (BLOCKED_CATEGORY_IDS.has(String(ch.parent_id || ""))) return true;
  return BLOCKED_NAME_TOKENS.some((t) => t.test(String(ch.name || "")));
}

(async () => {
  const [gRes, cRes] = await Promise.all([
    fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}`, { headers: { Authorization: `Bot ${TOKEN}` } }),
    fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, { headers: { Authorization: `Bot ${TOKEN}` } }),
  ]);
  if (!cRes.ok) {
    console.error("Failed:", cRes.status, await cRes.text());
    process.exit(1);
  }
  const guild = await gRes.json();
  const everyoneId = guild.id;
  const channels = await cRes.json();

  let updated = 0;
  let skipped = 0;
  for (const ch of channels) {
    if (isBlocked(ch)) {
      console.log(`SKIP  ${ch.name}`);
      skipped++;
      continue;
    }
    const ow = (ch.permission_overwrites || []).filter((o) => o.id !== everyoneId);
    let allow = 0n;
    let deny = 0n;
    const existing = (ch.permission_overwrites || []).find((o) => o.id === everyoneId);
    if (existing) {
      allow = BigInt(existing.allow || 0);
      deny = BigInt(existing.deny || 0);
    }
    allow |= VIEW;
    deny &= ~VIEW;
    ow.push({ id: everyoneId, type: 0, allow: allow.toString(), deny: deny.toString() });

    const res = await fetch(`https://discord.com/api/v10/channels/${ch.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ permission_overwrites: ow }),
    });
    if (res.ok) {
      console.log(`OPEN  ${ch.name}`);
      updated++;
    } else {
      console.error(`FAIL  ${ch.name}: ${res.status} ${(await res.text()).slice(0, 200)}`);
      skipped++;
    }
  }
  console.log(`\nDone: ${updated} visible, ${skipped} private/unchanged.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });