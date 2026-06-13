const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

// Read DATABASE_URL from .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
const envRaw = fs.readFileSync(envPath, "utf-8");
const envMatch = envRaw.match(/^DATABASE_URL="(.+)"$/m);
if (!envMatch) { console.error("DATABASE_URL not found in .env.local"); process.exit(1); }
const DATABASE_URL = envMatch[1];

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Reading db.json...");
  const dbPath = path.join(__dirname, "..", "src", "data", "db.json");
  const raw = fs.readFileSync(dbPath, "utf-8");
  const data = JSON.parse(raw);

  console.log("Creating kv_store table...");
  await sql`CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value JSONB NOT NULL)`;

  const sections = [
    "lobbies", "goldOffers", "notifications", "registeredUsers",
    "characters", "applications", "bannedUsers", "friends",
    "readMessages", "directMessages", "tickets",
  ];

  for (const key of sections) {
    const value = data[key];
    if (value !== undefined) {
      console.log(`Migrating ${key}...`);
      await sql`INSERT INTO kv_store (key, value) VALUES (${key}, ${JSON.stringify(value)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    }
  }

  for (const key of ["activeLobbyBg", "lobbyBackgrounds", "posts"]) {
    if (data[key] !== undefined) {
      console.log(`Migrating ${key}...`);
      await sql`INSERT INTO kv_store (key, value) VALUES (${key}, ${JSON.stringify(data[key])}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    }
  }

  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
