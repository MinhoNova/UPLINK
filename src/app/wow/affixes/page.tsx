import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import AffixesPageClient from "./AffixesPageClient";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Mythic+ Affixes This Week — WoW M+ Affix Calendar | UPLINK",
  description: "Current and next week Mythic+ affixes for World of Warcraft. Season 2 affix schedule, Fortified/Tyrannical rotation, and detailed affix descriptions.",
  alternates: { canonical: `${siteUrl}/wow/affixes` },
  openGraph: {
    title: "Mythic+ Affixes This Week — WoW M+ Affix Calendar",
    description: "Current and next week Mythic+ affixes for World of Warcraft. Season 2 affix schedule.",
    url: `${siteUrl}/wow/affixes`,
    siteName: "WoWLFG — UPLINK",
    images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Mythic+ Affixes This Week — WoW M+ Affix Calendar", description: "Current and next week Mythic+ affixes for World of Warcraft. Season 2 affix schedule.", images: [`${siteUrl}/og.png`] },
};

export default function AffixesPage() {
  return <AffixesPageClient />;
}
