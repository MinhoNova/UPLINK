import LeaderboardClient from "./LeaderboardClient";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata = {
  title: "Leaderboard — Uplink",
  description: "Top runners ranked by synced dungeon runs",
  alternates: { canonical: `${siteUrl}/leaderboard` },
  openGraph: {
    title: "Leaderboard — Uplink",
    description: "Top runners ranked by synced dungeon runs",
    url: `${siteUrl}/leaderboard`,
    siteName: "WoWLFG — UPLINK",
    images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Leaderboard — Uplink", description: "Top runners ranked by synced dungeon runs", images: [`${siteUrl}/og.png`] },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
