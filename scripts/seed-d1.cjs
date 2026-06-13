const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const remote = process.argv.includes("--remote");
const flag = remote ? "--remote" : "--local";
const dbName = "uplink-db";

const seedPath = path.join(__dirname, "..", "src", "data", "db.json");
if (!fs.existsSync(seedPath)) {
  console.error("db.json not found");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const statements = Object.entries(data).map(([key, value]) => {
  const escaped = JSON.stringify(value).replace(/'/g, "''");
  return `INSERT INTO kv_store (key, value) VALUES ('${key.replace(/'/g, "''")}', '${escaped}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;
});

const sqlPath = path.join(__dirname, "seed-kv-temp.sql");
fs.writeFileSync(sqlPath, statements.join("\n"));

try {
  execSync(`npx wrangler d1 execute ${dbName} ${flag} --file="${sqlPath}"`, {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log(remote ? "Remote D1 seeded." : "Local D1 seeded.");
} finally {
  fs.unlinkSync(sqlPath);
}
