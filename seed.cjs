const { execSync } = require("child_process");
const fs = require("fs");

const data = JSON.parse(fs.readFileSync("src/data/db.json", "utf8"));

let count = 0;
for (const [key, value] of Object.entries(data)) {
  const json = JSON.stringify(value).replace(/'/g, "''");
  const sql = `INSERT INTO kv_store (key, value) VALUES ('${key}', '${json}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;`;
  try {
    execSync(`npx wrangler d1 execute uplink-db --command "${sql}" --remote`, { stdio: "pipe" });
    console.log(`Seeded: ${key}`);
    count++;
  } catch (err) {
    console.log(`Error: ${key}`);
  }
}
console.log(`Done! Seeded ${count}/${Object.keys(data).length}`);
