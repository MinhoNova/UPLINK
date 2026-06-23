import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import fs from "fs";
import path from "path";

export const KV_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);`;

export const COMMUNITY_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  userImage TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  image TEXT,
  tags TEXT DEFAULT '[]',
  visibility TEXT DEFAULT 'public',
  pinnedAt INTEGER,
  pinnedBy TEXT,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER NOT NULL,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER NOT NULL,
  reporterId TEXT NOT NULL,
  reason TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER NOT NULL,
  parentId INTEGER,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  userImage TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS commentReactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commentId INTEGER NOT NULL,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_postId ON reactions(postId);
CREATE INDEX IF NOT EXISTS idx_reports_postId ON reports(postId);
CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);
CREATE INDEX IF NOT EXISTS idx_commentReactions_commentId ON commentReactions(commentId);
`;

const SEED_PATH = path.join(process.cwd(), "src", "data", "db.json");

let d1SchemaReady = false;

export async function getD1(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: { DB?: D1Database };
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }
    const db = (env as { DB?: D1Database }).DB;
    if (!db) {
      console.error("D1 binding DB is missing from Cloudflare env");
    }
    return db ?? null;
  } catch (e) {
    console.error("getD1 failed:", e);
    return null;
  }
}

function loadSeedEntries(): [string, unknown][] | null {
  if (!fs.existsSync(SEED_PATH)) return null;
  try {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as Record<string, unknown>;
    return Object.entries(seed);
  } catch (e) {
    console.error("Failed to read db.json seed:", e);
    return null;
  }
}

async function seedD1KvIfEmpty(d1: D1Database) {
  const row = await d1.prepare("SELECT COUNT(*) AS c FROM kv_store").first<{ c: number }>();
  if ((row?.c ?? 0) > 0) return;

  const entries = loadSeedEntries();
  if (!entries?.length) return;

  const stmt = d1.prepare("INSERT INTO kv_store (key, value) VALUES (?, ?)");
  const batch: D1PreparedStatement[] = [];
  for (const [key, value] of entries) {
    batch.push(stmt.bind(key, JSON.stringify(value)));
  }
  if (batch.length > 0) {
    await d1.batch(batch);
    console.log("D1 kv_store seeded from db.json");
  }
}

async function d1TableExists(d1: D1Database, name: string): Promise<boolean> {
  const row = await d1
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(name)
    .first<{ name: string }>();
  return !!row;
}

async function runD1Statements(d1: D1Database, sql: string) {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await d1.prepare(statement).run();
  }
}

export async function ensureD1Schema() {
  const d1 = await getD1();
  if (!d1 || d1SchemaReady) return d1;

  // Tables are created via `npm run db:migrate:remote`. Runtime d1.exec() can fail on
  // Workers, so only bootstrap when migrations have not been applied yet.
  if (!(await d1TableExists(d1, "kv_store"))) {
    await d1
      .prepare('CREATE TABLE IF NOT EXISTS kv_store ("key" TEXT PRIMARY KEY, value TEXT NOT NULL)')
      .run();
  }

  if (!(await d1TableExists(d1, "posts"))) {
    await runD1Statements(d1, COMMUNITY_SCHEMA_SQL);
  } else {
    try {
      await d1.prepare("ALTER TABLE posts ADD COLUMN pinnedAt INTEGER").run();
    } catch {
      /* column may exist */
    }
    try {
      await d1.prepare("ALTER TABLE posts ADD COLUMN pinnedBy TEXT").run();
    } catch {
      /* column may exist */
    }
    try {
      await d1.prepare("ALTER TABLE posts ADD COLUMN title TEXT").run();
    } catch {
      /* column may exist */
    }
  }

  await seedD1KvIfEmpty(d1);
  d1SchemaReady = true;
  return d1;
}
