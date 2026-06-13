import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull(),
  userName: text("userName").notNull(),
  userImage: text("userImage").notNull(),
  content: text("content").notNull(),
  image: text("image"),
  tags: text("tags").default("[]"),
  visibility: text("visibility").default("public"),
  createdAt: integer("createdAt").notNull(),
});

export const reactions = sqliteTable("reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  createdAt: integer("createdAt").notNull(),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  reporterId: text("reporterId").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("createdAt").notNull(),
});

export const commentReactions = sqliteTable("commentReactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  commentId: integer("commentId").notNull(),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  createdAt: integer("createdAt").notNull(),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  parentId: integer("parentId"),
  userId: text("userId").notNull(),
  userName: text("userName").notNull(),
  userImage: text("userImage").notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt").notNull(),
});
