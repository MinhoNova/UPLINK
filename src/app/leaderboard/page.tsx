import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/authEnv";
import LeaderboardView from "@/components/LeaderboardView";
import { getCurrentMythicPlusSeason } from "@/lib/mythicSeason";
import { initTables, getKVPairs } from "@/lib/db";
import { filterDataForUser } from "@/lib/dataAccess";

export const metadata = {
  title: "Leaderboard — Uplink",
  description: "Top runners ranked by synced dungeon runs",
};

async function getData(userId: string, handle: string) {
  await initTables();
  const data = await getKVPairs();
  return filterDataForUser(data, userId, handle);
}

export default async function LeaderboardPage() {
  const session = await getAppSession();
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id || "";
  const handle = (session.user as { username?: string }).username || "";
  if (!userId || !handle) redirect("/");

  const [data, season] = await Promise.all([getData(userId, handle), getCurrentMythicPlusSeason()]);

  return (
    <LeaderboardView
      lobbies={(data.lobbies as any[]) || []}
      characters={(data.characters as any[]) || []}
      users={(data.registeredUsers as any[]) || []}
      season={season}
    />
  );
}
