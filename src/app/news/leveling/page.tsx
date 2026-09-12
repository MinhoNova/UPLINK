import NewsFeed from "@/components/news/NewsFeed";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "Leveling News — UPLINK",
  description: "Leveling methods, XP farms, rotations, and game updates from the UPLINK community.",
  alternates: { canonical: `${siteUrl}/news/leveling` },
  openGraph: { title: "Leveling News — UPLINK", description: "Leveling methods, XP farms, rotations, and game updates.", url: `${siteUrl}/news/leveling`, images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Leveling News — UPLINK", description: "Leveling methods, XP farms, rotations, and game updates.", images: [`${siteUrl}/og.png`] },
};

export default function LevelingPage() {
  return <NewsFeed section="leveling" />;
}
