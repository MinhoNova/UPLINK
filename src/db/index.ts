import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";
import path from "path";
import { COMMUNITY_SCHEMA_SQL, ensureD1Schema, getD1 } from "@/lib/d1";

type SqliteDrizzle = import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema>;

let sqliteDrizzle: SqliteDrizzle | null = null;
let sqliteSchemaReady = false;

async function getSqliteDrizzle(): Promise<SqliteDrizzle> {
  if (!sqliteDrizzle) {
    const Database = (await import("better-sqlite3")).default;
    const { drizzle: drizzleSqlite } = await import("drizzle-orm/better-sqlite3");
    const dbPath = path.join(process.cwd(), "src", "db", "uplink.db");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    if (!sqliteSchemaReady) {
      sqlite.exec(COMMUNITY_SCHEMA_SQL);
      const cols = (sqlite.pragma("table_info(comments)") as { name: string }[]).map((c) => c.name);
      if (!cols.includes("parentId")) sqlite.exec("ALTER TABLE comments ADD COLUMN parentId INTEGER");
      const postCols = (sqlite.pragma("table_info(posts)") as { name: string }[]).map((c) => c.name);
      if (!postCols.includes("visibility")) sqlite.exec("ALTER TABLE posts ADD COLUMN visibility TEXT DEFAULT 'public'");
      sqliteSchemaReady = true;
    }
    sqliteDrizzle = drizzleSqlite(sqlite, { schema });
  }
  return sqliteDrizzle;
}

export async function getDb(): Promise<SqliteDrizzle> {
  const d1 = await ensureD1Schema();
  if (d1) {
    return drizzleD1(d1, { schema }) as unknown as SqliteDrizzle;
  }
  return getSqliteDrizzle();
}

export async function initDb() {
  await getDb();
}
