import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, CLASS_NAMES } from "@/lib/wowData";

const siteUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: siteUrl, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${siteUrl}/wowlfg`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${siteUrl}/wow/ptr`, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${siteUrl}/wow/s2`, changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${siteUrl}/wow/tier-list`, changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${siteUrl}/wow/leaderboard`, changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${siteUrl}/boosts`, changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${siteUrl}/leaderboard`, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${siteUrl}/community`, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${siteUrl}/reviews`, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${siteUrl}/guides`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${siteUrl}/terms`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/addon`, changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${siteUrl}/gold-auction`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${siteUrl}/wow-boosting`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${siteUrl}/news`, changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${siteUrl}/citypunks`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/shop`, changeFrequency: "weekly" as const, priority: 0.4 },
  ];

  const specPages = SPECS.map((spec) => ({
    url: `${siteUrl}/wow/spec/${spec.id}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const classPages = Object.keys(CLASS_NAMES).map((classId) => ({
    url: `${siteUrl}/wow/class/${classId}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...specPages, ...classPages];
}
