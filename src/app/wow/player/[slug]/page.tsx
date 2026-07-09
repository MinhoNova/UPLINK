import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, CLASS_COLORS, CLASS_NAMES, getClassColor, getSpecData } from "@/lib/wowData";
import PlayerProfileClient from "./PlayerProfileClient";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ realm?: string; region?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ");
  const { realm, region } = await searchParams;
  return {
    title: `${name} - Mythic+ Profile | WoWLFG`,
    description: `${name}${realm ? ` (${realm}-${region})` : ""} Mythic+ profile. Talents, BIS gear, enchants, gems, and stat priority.`,
    alternates: { canonical: `${siteUrl}/wow/player/${slug}` },
  };
}

export default async function PlayerProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const playerName = slug.replace(/-/g, " ");
  const { realm: playerRealm, region: playerRegion } = await searchParams;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || siteUrl;
    const params = new URLSearchParams({ player: playerName });
    if (playerRealm) params.set("realm", playerRealm);
    if (playerRegion) params.set("region", playerRegion);
    const res = await fetch(`${baseUrl}/api/wow/blizzard-meta?${params}`, { cache: "no-store" });
    if (!res.ok) notFound();
    const data = await res.json();

    const player = data?.player;
    if (!player) notFound();

    const spec = SPECS.find((s) => s.id === data.specId);
    const specData = getSpecData(data.specId);

    // Map from AggregatedCharacter to LeaderboardEntry-compatible shape
    const playerMapped = {
      ...player,
      rank: player.rank ?? 0,
      faction: player.faction ?? "unknown",
    };

    return (
      <PlayerProfileClient
        player={playerMapped}
        spec={spec || null}
        specData={specData || null}
        seasonDisplay={data.season || ""}
      />
    );
  } catch {
    notFound();
  }
}
