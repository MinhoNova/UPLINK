const path = require("path");
const { execSync } = require("child_process");

const ip = process.argv[2];
const remote = process.argv.includes("--remote");
if (!ip) {
  console.error("Usage: node scripts/unban-ip.cjs <ip> [--remote]");
  process.exit(1);
}

const flag = remote ? "--remote" : "--local";
const cwd = path.join(__dirname, "..");
const out = execSync(
  `npx wrangler d1 execute uplink-db ${flag} --json --command "SELECT value FROM kv_store WHERE key = 'bannedIps'"`,
  { encoding: "utf8", cwd }
);
const parsed = JSON.parse(out);
const row = parsed[0]?.results?.[0];
const list = row?.value ? JSON.parse(row.value) : [];
const next = list.filter((x) => x !== ip);
const escaped = JSON.stringify(next).replace(/'/g, "''");
const sql = `INSERT INTO kv_store (key, value) VALUES ('bannedIps', '${escaped}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;
const sqlPath = path.join(__dirname, "unban-ip-temp.sql");
const fs = require("fs");
fs.writeFileSync(sqlPath, sql);
try {
  execSync(`npx wrangler d1 execute uplink-db ${flag} --file="${sqlPath}"`, {
    stdio: "inherit",
    cwd,
  });
} finally {
  fs.unlinkSync(sqlPath);
}
console.log(remote ? "Production" : "Local", "IP unbanned:", ip);
