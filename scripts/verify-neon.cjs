const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envRaw = fs.readFileSync(envPath, "utf-8");
const envMatch = envRaw.match(/^DATABASE_URL="(.+)"$/m);
const DATABASE_URL = envMatch[1];

const sql = neon(DATABASE_URL);

async function verify() {
  const rows = await sql`SELECT key, length(value::text) as size FROM kv_store ORDER BY key`;
  console.log("=== Neon kv_store contents ===");
  for (const row of rows) {
    const val = await sql`SELECT value FROM kv_store WHERE key = ${row.key}`;
    const data = val[0].value;
    const count = Array.isArray(data) ? data.length : typeof data === 'object' ? Object.keys(data).length : 'N/A';
    console.log(`${row.key}: ${count} items (${row.size} bytes)`);
  }
  console.log("\n✅ Neon is alive and has data!");
}

verify().catch(err => { console.error("❌ Verification failed:", err.message); process.exit(1); });
