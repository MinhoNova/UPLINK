/**
 * Sets the UPLINK server icon + banner (and optional invite splash) from site brand images.
 *
 * Usage: npm run discord:media
 *   Defaults: icon = public/og.png, banner = public/og.png
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

const args = process.argv.slice(2);
const iconArg = args.find((a) => a.startsWith("--icon="))?.split("=")[1];
const bannerArg = args.find((a) => a.startsWith("--banner="))?.split("=")[1];
const pathOf = (rel) => (rel && fs.existsSync(path.join(root, rel)) ? path.join(root, rel) : path.join(root, "public", "og.png"));
const toData = (file) => {
  const mime = file.endsWith(".gif") ? "image/gif" : file.endsWith(".jpg") || file.endsWith(".jpeg") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
};

(async () => {
  const body = {
    icon: toData(pathOf(iconArg)),
    banner: toData(pathOf(bannerArg)),
  };
  const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}`, {
    method: "PATCH",
    headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = await res.json();
  if (res.status >= 400) {
    console.error("Failed:", JSON.stringify(out).slice(0, 500));
    process.exit(1);
  }
  console.log(`Server media updated: icon=${!!out.icon} banner=${!!out.banner} (${out.name})`);
  process.exit(0);
})();