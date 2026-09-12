import NewsFeed from "@/components/news/NewsFeed";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "Dungeon News — UPLINK",
  description: "Dungeon routes, strategy changes, boss guides, and seasonal updates from the UPLINK community.",
  alternates: { canonical: `${siteUrl}/news/dungeons` },
  openGraph: { title: "Dungeon News — UPLINK", description: "Dungeon routes, strategy changes, boss guides, and seasonal updates.", url: `${siteUrl}/news/dungeons`, images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Dungeon News — UPLINK", description: "Dungeon routes, strategy changes, boss guides, and seasonal updates.", images: [`${siteUrl}/og.png`] },
};

export default function DungeonsPage() {
  return <NewsFeed section="dungeons" />;
}
