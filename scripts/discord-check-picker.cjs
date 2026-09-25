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

async function main() {
  if (!TOKEN) {
    console.log("No DISCORD_BOT_TOKEN found.");
    return;
  }
  const chRes = await fetch(`${API}/guilds/${GUILD_ID}/channels`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  });
  if (chRes.status !== 200) {
    console.log(`Failed to load channels (${chRes.status})`);
    return;
  }
  const channels = await chRes.json();

  const roRes = await fetch(`${API}/guilds/${GUILD_ID}/roles`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  });
  if (roRes.status === 200) {
    const roles = await roRes.json();
    console.log("=== Roles (NA / EU / Arabic-relevant) ===");
    for (const r of roles) {
      if (/na\b|eu\b|arabic|اراب/gi.test(r.name)) {
        console.log(`  ${r.id} | ${r.name}`);
      }
    }
  }

  console.log("=== Text channels ===");
  for (const c of channels.filter((c) => c.type === 0)) {
    console.log(`  ${c.id} | ${c.name}`);
  }
  const picker = channels.find((c) => c.name === "welcome-briefing") || channels.find((c) => c.type === 0 && c.name.toLowerCase().includes("welcome"));
  if (!picker) {
    console.log("(no welcome-briefing / welcome * channel found)");
    return;
  }
  const msgRes = await fetch(`${API}/channels/${picker.id}/messages?limit=10`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  });
  const msgs = await msgRes.json();
  console.log(`\n=== Last messages in ${picker.name} ===`);
  for (const x of (Array.isArray(msgs) ? msgs : [])) {
    const footer = (x.embeds && x.embeds[0] && x.embeds[0].footer && x.embeds[0].footer.text) || "";
    const comps = x.components && x.components[0] && x.components[0].components
      ? x.components[0].components.map((b) => `${b.custom_id}`).join(", ")
      : "";
    console.log(`  ${new Date(x.timestamp).toLocaleString()} | ${x.author.username} | footer="${footer}" | btns=[${comps}] | "${(x.content || "").slice(0, 60).replace(/\n/g, " ")}"`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});