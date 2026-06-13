import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "db", "uplink.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      userImage TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      tags TEXT DEFAULT '[]',
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
    CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_reactions_postId ON reactions(postId);
    CREATE INDEX IF NOT EXISTS idx_reports_postId ON reports(postId);
    CREATE TABLE IF NOT EXISTS commentReactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commentId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);
    CREATE INDEX IF NOT EXISTS idx_commentReactions_commentId ON commentReactions(commentId);
  `);
  // Migrations: add columns if missing on existing databases
  const cols = (sqlite.pragma("table_info(comments)") as any[]).map((c: any) => c.name);
  if (!cols.includes("parentId")) sqlite.exec("ALTER TABLE comments ADD COLUMN parentId INTEGER");
  const postCols = (sqlite.pragma("table_info(posts)") as any[]).map((c: any) => c.name);
  if (!postCols.includes("visibility")) sqlite.exec("ALTER TABLE posts ADD COLUMN visibility TEXT DEFAULT 'public'");
}
