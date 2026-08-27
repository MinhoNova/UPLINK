import LeaderboardClient from "./LeaderboardClient";

export const metadata = {
  title: "Leaderboard — Uplink",
  description: "Top runners ranked by synced dungeon runs",
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
