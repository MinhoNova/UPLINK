import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import LeaderboardPageClient from "./LeaderboardPageClient";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "WoW Mythic+ Leaderboard — M+ Rankings & Spec Scores | UPLINK",
  description: "World of Warcraft Mythic+ leaderboard. See top specs, class rankings, and M+ scores for the current season. Updated regularly from Raider.IO.",
  alternates: { canonical: `${siteUrl}/wow/leaderboard` },
  openGraph: {
    title: "WoW Mythic+ Leaderboard — M+ Rankings & Spec Scores",
    description: "Top Mythic+ specs and scores for the current WoW season.",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
