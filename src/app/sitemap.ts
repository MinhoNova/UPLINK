import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const pages: [string, string, number][] = [
    ["", "daily", 1],
    ["/create-offer", "weekly", 0.9],
    ["/guides", "weekly", 0.7],
    ["/boosts", "weekly", 0.7],
    ["/gold-auction", "weekly", 0.6],
    ["/reviews", "weekly", 0.6],
    ["/news", "weekly", 0.6],
    ["/addon", "monthly", 0.4],
    ["/about", "monthly", 0.4],
    ["/contact", "monthly", 0.4],
    ["/support", "monthly", 0.4],
    ["/terms", "monthly", 0.2],
    ["/privacy", "monthly", 0.2],
  ];

  return pages.map(([path, changeFrequency, priority]) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority,
  }));
}