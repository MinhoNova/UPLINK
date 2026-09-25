/**
 * One-off: grants an entry-channel role (default "ARABIC CHAT") to EVERY current
 * member of the UPLINK Discord guild. Safe to re-run — skips members who already
 * have the role.
 *
 * Usage:
 *   npm run discord:grantrole -- "ARABIC CHAT"
 *   npm run discord:grantrole -- "ارابيك شات"
 *
 * Reads DISCORD_BOT_TOKEN / DISCORD_GUILD_ID from .env.local / .dev.vars.
 * Prints the available role names if the requested one is not found.
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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
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
const ROLE_NAME = process.argv.slice(2)[0] || "ARABIC CHAT";

async function discord(discordPath, options = {}) {
  const res = await fetch(`${API}${discordPath}`, {
    ...options,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function main() {
  if (!TOKEN) {
    console.error("No DISCORD_BOT_TOKEN found in .env.local / .dev.vars");
    process.exit(1);
  }

  const rolesRes = await discord(`/guilds/${GUILD_ID}/roles`);
  if (rolesRes.status !== 200) {
    console.error(`Failed to load guild roles (${rolesRes.status}).`);
    process.exit(1);
  }
  const roles = rolesRes.json || [];
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const wanted = norm(ROLE_NAME);
  const role =
    roles.find((r) => norm(r.name) === wanted) ||
    roles.find((r) => r.name === ROLE_NAME);
  if (!role) {
    console.error(`Role "${ROLE_NAME}" not found in the guild. Available roles:`);
    for (const r of roles) console.log(`  - ${r.name}`);
    process.exit(1);
  }

  console.log(`Granting role "${role.name}" (${role.id}) to all guild members...`);

  let checked = 0;
  let already = 0;
  let granted = 0;
  let letAfter = "0";

  while (true) {
    const mres = await discord(`/guilds/${GUILD_ID}/members?limit=100&after=${letAfter}`);
    if (mres.status !== 200) {
      console.error(`Failed to load members (${mres.status}).`);
      break;
    }
    const members = mres.json || [];
    if (!members.length) break;

    for (const member of members) {
      checked++;
      if (member.roles && member.roles.includes(role.id)) {
        already++;
        continue;
      }
      const putRes = await discord(
        `/guilds/${GUILD_ID}/members/${member.user.id}/roles/${role.id}`,
        { method: "PUT" }
      );
      if (putRes.status === 204 || putRes.status === 200) {
        granted++;
      } else {
        let handled = false;
        for (let attempt = 0; attempt < 5 && !handled; attempt++) {
          const wait = Math.ceil((putRes.json && putRes.json.retry_after) || 1) + 0.2;
          console.log(`  ↻ rate limited on ${member.user.username}, waiting ${wait}s (attempt ${attempt + 1})...`);
          await new Promise((r) => setTimeout(r, Math.round(wait * 1000)));
          const retry = await discord(
            `/guilds/${GUILD_ID}/members/${member.user.id}/roles/${role.id}`,
            { method: "PUT" }
          );
          if (retry.status === 204 || retry.status === 200) {
            granted++;
            handled = true;
          } else if (retry.status !== 429) {
            console.log(`  × ${member.user.username} (${retry.status})`);
            handled = true;
          }
        }
      }
    }

    if (members.length < 100) break;
    letAfter = members[members.length - 1].user.id;
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(
    `Done. Checked ${checked} members: ${already} already had the role, ${granted} granted now.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});