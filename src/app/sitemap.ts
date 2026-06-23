import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getKV, initTables } from "@/lib/db";
import { getDb } from "@/db";
import { posts, news } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/leaderboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/community`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/reviews`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/boosts`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/guides/mythic-plus-boosting`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/addon`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/news`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/news/leveling`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/news/dungeons`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/wowlfg`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    await initTables();
    const users: any[] = (await getKV("registeredUsers")) || [];
    for (const user of users) {
      if (!user.username) continue;
      entries.push({
        url: `${siteUrl}/community/${encodeURIComponent(user.username)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.4,
      });
    }
  } catch {
    // sitemap should not fail on DB error
  }

  try {
    const db = await getDb();
    const allNews = await db.select({ id: news.id, createdAt: news.createdAt }).from(news).limit(200);
    for (const n of allNews) {
      entries.push({
        url: `${siteUrl}/news/${n.id}`,
        lastModified: new Date(n.createdAt),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    const allPosts = await db.select({ id: posts.id, createdAt: posts.createdAt, title: posts.title }).from(posts).limit(200);
    for (const p of allPosts) {
      entries.push({
        url: `${siteUrl}/community/post/${p.id}`,
        lastModified: new Date(p.createdAt),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // sitemap should not fail on DB error
  }

  return entries;
}
