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

function readEveryone(ow, guildEveryoneId) {
  const e = (ow || []).find((o) => o.id === guildEveryoneId);
  return e ? { allow: Number(e.allow || 0), deny: Number(e.deny || 0) } : null;
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

  const viewBit = 1024;
  const typeName = (t) => ({ 0: "TXT", 2: "VOICE", 4: "CAT", 5: "FORUM", 13: "STAGE", 15: "FORUM" }[t] || String(t));

  for (const ch of channels) {
    const ov = readEveryone(ch.permission_overwrites || [], everyoneId);
    const viewAllowed = ov ? !!(ov.allow & viewBit) : false;
    const viewDenied = ov ? !!(ov.deny & viewBit) : false;
    const marker = viewAllowed ? "VIEW ✔" : viewDenied ? "VIEW ✘(denied)" : "view —";
    console.log(
      `${typeName(ch.type).padEnd(6)} ${ch.id.padEnd(20)} ${marker.padEnd(12)} ${(!ch.parent_id ? "*" : "  ")} ${ch.name}`
    );
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });