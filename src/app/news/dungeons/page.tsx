import NewsFeed from "@/components/news/NewsFeed";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dungeon News — WoWLFG",
  description: "Mythic+ routes, dungeon changes, new affixes, boss strategies, and seasonal updates for WoW The War Within.",
  openGraph: { title: "Dungeon News — WoWLFG", description: "Mythic+ routes, dungeon changes, new affixes, boss strategies, and seasonal updates for WoW The War Within." },
};

export default function DungeonsPage() {
  return <NewsFeed section="dungeons" />;
}
