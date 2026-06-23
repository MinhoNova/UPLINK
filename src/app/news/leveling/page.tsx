import NewsFeed from "@/components/news/NewsFeed";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leveling News — WoWLFG",
  description: "AFK leveling methods, XP farms, 80-90 boosts, rotations, and leveling updates for WoW The War Within.",
  openGraph: { title: "Leveling News — WoWLFG", description: "AFK leveling methods, XP farms, 80-90 boosts, rotations, and leveling updates for WoW The War Within." },
};

export default function LevelingPage() {
  return <NewsFeed section="leveling" />;
}
