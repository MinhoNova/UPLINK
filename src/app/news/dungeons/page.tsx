import NewsFeed from "@/components/news/NewsFeed";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dungeon News — WoWLFG",
  description: "Mythic+ routes, dungeon changes, new affixes, boss strategies, and seasonal updates for WoW The War Within.",
  alternates: { canonical: `${siteUrl}/news/dungeons` },
  openGraph: { title: "Dungeon News — WoWLFG", description: "Mythic+ routes, dungeon changes, new affixes, boss strategies, and seasonal updates for WoW The War Within.", url: `${siteUrl}/news/dungeons`, images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Dungeon News — WoWLFG", description: "Mythic+ routes, dungeon changes, new affixes, boss strategies, and seasonal updates for WoW The War Within.", images: [`${siteUrl}/og.png`] },
};

export default function DungeonsPage() {
  return <NewsFeed section="dungeons" />;
}
