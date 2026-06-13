CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  userImage TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  tags TEXT DEFAULT '[]',
  visibility TEXT DEFAULT 'public',
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
