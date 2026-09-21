const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const remote = process.argv.includes("--remote");
const flag = remote ? "--remote" : "--local";
const dbName = "uplink-db";
const cwd = path.join(__dirname, "..");

const outDir = path.join(cwd, "backups");
fs.mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outPath = path.join(outDir, `uplink-${stamp}.sql`);

function rowsFromJson(command) {
  const raw = execSync(
    `npx wrangler d1 execute ${dbName} ${flag} --command="${command}" --json`,
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
  );
  return JSON.parse(raw)[0]?.results ?? [];
}

try {
  console.log(`Exporting ${dbName} (${remote ? "remote" : "local"}) -> ${path.basename(outPath)}`);
  execSync(`npx wrangler d1 export ${dbName} ${flag} --output="${outPath}"`, { cwd, stdio: "inherit" });

  const sizeMb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);

  const tables = rowsFromJson(`SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name`);
  const kvCount = rowsFromJson("SELECT COUNT(*) AS total FROM kv_store")[0]?.total ?? 0;

  console.log(`\nBackup OK: ${path.basename(outPath)} (${sizeMb} MB)`);
  console.log(`kv_store rows: ${kvCount}`);
  console.log(`tables (${tables.length}): ${tables.map((r) => r.name).join(", ")}`);
} catch (err) {
  console.error("Backup failed:", err.message);
  process.exit(1);
}