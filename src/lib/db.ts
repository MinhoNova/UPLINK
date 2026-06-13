import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'src', 'data');
const DB_PATH = path.join(DB_DIR, 'uplink.db');
const SEED_PATH = path.join(DB_DIR, 'db.json');

let db: Database.Database | null = null;

function seedIfEmpty(database: Database.Database) {
  const row = database.prepare('SELECT COUNT(*) AS c FROM kv_store').get() as { c: number };
  if (row.c > 0 || !fs.existsSync(SEED_PATH)) return;
  try {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
    const insert = database.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?)');
    const tx = database.transaction((entries: [string, any][]) => {
      for (const [key, value] of entries) insert.run(key, JSON.stringify(value));
    });
    tx(Object.entries(seed));
    console.log('SQLite seeded from db.json');
  } catch (e) {
    console.error('Failed to seed SQLite from db.json:', e);
  }
}

function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);
    seedIfEmpty(db);
  }
  return db;
}

export async function initTables() {
  getDb();
}

export async function getKVPairs(): Promise<Record<string, any>> {
  const rows = getDb().prepare('SELECT key, value FROM kv_store').all() as { key: string; value: string }[];
  const result: Record<string, any> = {};
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value);
  }
  return result;
}

export async function getKV(key: string): Promise<any | null> {
  const row = getDb().prepare('SELECT value FROM kv_store WHERE key = ?').get(key) as { value: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.value);
}

export async function setKV(key: string, value: any) {
  getDb()
    .prepare('INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value));
}

export async function deleteKV(key: string) {
  getDb().prepare('DELETE FROM kv_store WHERE key = ?').run(key);
}
