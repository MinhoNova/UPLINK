import type { MetadataRoute } from "next";

const SITE_URL = "https://aion2lfg.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = SITE_URL;
  const now = new Date();

  const pages: [string, string, number][] = [
    ["", "daily", 1],
    ["/create-offer", "weekly", 0.9],
    ["/discord", "monthly", 0.8],
    ["/about", "monthly", 0.4],
    ["/contact", "monthly", 0.4],
    ["/support", "monthly", 0.4],
    ["/terms", "monthly", 0.2],
    ["/privacy", "monthly", 0.2],
    ["/classes", "weekly", 0.8],
    ["/dungeons", "weekly", 0.8],
    ["/raids", "weekly", 0.8],
    ["/leveling", "weekly", 0.8],
    ["/lfg/eu", "daily", 0.7],
    ["/lfg/na", "daily", 0.7],
    ["/lfg/eu/dungeons", "daily", 0.7],
    ["/lfg/eu/raids", "daily", 0.7],
    ["/lfg/eu/leveling", "daily", 0.7],
    ["/lfg/na/dungeons", "daily", 0.7],
    ["/lfg/na/raids", "daily", 0.7],
    ["/lfg/na/leveling", "daily", 0.7],
  ];

  return pages.map(([path, changeFrequency, priority]) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority,
  }));
}
