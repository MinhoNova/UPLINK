import path from "path";
import fs from "fs";
import { ensureD1Schema, getD1, KV_SCHEMA_SQL } from "@/lib/d1";

const DB_DIR = path.join(process.cwd(), "src", "data");
const DB_PATH = path.join(DB_DIR, "uplink.db");
const SEED_PATH = path.join(DB_DIR, "db.json");

type SqliteDatabase = import("better-sqlite3").Database;

let db: SqliteDatabase | null = null;

function seedSqliteIfEmpty(database: SqliteDatabase) {
  const row = database.prepare("SELECT COUNT(*) AS c FROM kv_store").get() as { c: number };
  if (row.c > 0 || !fs.existsSync(SEED_PATH)) return;
  try {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
    const insert = database.prepare("INSERT INTO kv_store (key, value) VALUES (?, ?)");
    const tx = database.transaction((entries: [string, unknown][]) => {
      for (const [key, value] of entries) insert.run(key, JSON.stringify(value));
    });
    tx(Object.entries(seed));
    console.log("SQLite seeded from db.json");
  } catch (e) {
    console.error("Failed to seed SQLite from db.json:", e);
  }
}

async function getSqliteDb(): Promise<SqliteDatabase> {
  if (!db) {
    const Database = (await import("better-sqlite3")).default;
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(KV_SCHEMA_SQL);
    seedSqliteIfEmpty(db);
  }
  return db;
}

export async function initTables() {
  const d1 = await ensureD1Schema();
  if (!d1) await getSqliteDb();
}

export async function getKVPairs(): Promise<Record<string, any>> {
  await initTables();
  const d1 = await getD1();
  if (d1) {
    const { results } = await d1.prepare("SELECT key, value FROM kv_store").all<{ key: string; value: string }>();
    const out: Record<string, any> = {};
    for (const row of results ?? []) {
      out[row.key] = JSON.parse(row.value);
    }
    return out;
  }

  const sqlite = await getSqliteDb();
  const rows = sqlite.prepare("SELECT key, value FROM kv_store").all() as { key: string; value: string }[];
  const result: Record<string, any> = {};
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value);
  }
  return result;
}

export async function getKV(key: string): Promise<any | null> {
  await initTables();
  const d1 = await getD1();
  if (d1) {
    const row = await d1.prepare("SELECT value FROM kv_store WHERE key = ?").bind(key).first<{ value: string }>();
    if (!row) return null;
    return JSON.parse(row.value);
  }

  const sqlite = await getSqliteDb();
  const row = sqlite.prepare("SELECT value FROM kv_store WHERE key = ?").get(key) as { value: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.value);
}

export async function setKV(key: string, value: any) {
  await initTables();
  const serialized = JSON.stringify(value);
  const d1 = await getD1();
  if (d1) {
    await d1
      .prepare("INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .bind(key, serialized)
      .run();
    return;
  }

  const sqlite = await getSqliteDb();
  sqlite
    .prepare("INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, serialized);
}

export async function deleteKV(key: string) {
  await initTables();
  const d1 = await getD1();
  if (d1) {
    await d1.prepare("DELETE FROM kv_store WHERE key = ?").bind(key).run();
    return;
  }
  const sqlite = await getSqliteDb();
  sqlite.prepare("DELETE FROM kv_store WHERE key = ?").run(key);
}
