const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const id = process.argv[2];
const remote = process.argv.includes("--remote");
if (!id) {
  console.error("Usage: node scripts/fix-rate-limits.cjs <discordId> [--remote]");
  process.exit(1);
}

const flag = remote ? "--remote" : "--local";
const cwd = path.join(__dirname, "..");
const out = execSync(
  `npx wrangler d1 execute uplink-db ${flag} --json --command "SELECT value FROM kv_store WHERE key = 'rateLimits'"`,
  { encoding: "utf8", cwd }
);
const parsed = JSON.parse(out);
const value = JSON.parse(parsed[0].results[0].value);
for (const k of Object.keys(value)) {
  if (k.includes(id)) delete value[k];
}
const escaped = JSON.stringify(value).replace(/'/g, "''");
const sql = `INSERT INTO kv_store (key, value) VALUES ('rateLimits', '${escaped}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;
const sqlPath = path.join(__dirname, "fix-rate-temp.sql");
fs.writeFileSync(sqlPath, sql);
try {
  execSync(`npx wrangler d1 execute uplink-db ${flag} --file="${sqlPath}"`, {
    stdio: "inherit",
    cwd,
  });
} finally {
  fs.unlinkSync(sqlPath);
}
console.log("rateLimits cleaned for", id);
