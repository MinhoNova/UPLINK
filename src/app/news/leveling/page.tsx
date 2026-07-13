import NewsFeed from "@/components/news/NewsFeed";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leveling News — WoWLFG",
  description: "AFK leveling methods, XP farms, 80-90 boosts, rotations, and leveling updates for WoW The War Within.",
  alternates: { canonical: `${siteUrl}/news/leveling` },
  openGraph: { title: "Leveling News — WoWLFG", description: "AFK leveling methods, XP farms, 80-90 boosts, rotations, and leveling updates for WoW The War Within.", url: `${siteUrl}/news/leveling`, images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Leveling News — WoWLFG", description: "AFK leveling methods, XP farms, 80-90 boosts, rotations, and leveling updates for WoW The War Within.", images: [`${siteUrl}/og.png`] },
};

export default function LevelingPage() {
  return <NewsFeed section="leveling" />;
}
