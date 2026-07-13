import { getSiteUrl } from "@/lib/siteUrl";
import DungeonsClient from "./DungeonsClient";

const siteUrl = getSiteUrl();

export const metadata = {
  title: "WoW Mythic+ Dungeon Rankings — Difficulty & Affix Guide | WoWLFG",
  description:
    "Mythic+ dungeon difficulty rankings for The War Within Season 1. Sort by level or difficulty, see recommended key levels and affix combos for all dungeons in rotation.",
  alternates: { canonical: `${siteUrl}/wow/dungeons` },
  openGraph: {
    title: "WoW Mythic+ Dungeon Rankings — Difficulty & Affix Guide",
    description: "Mythic+ dungeon difficulty rankings for The War Within. Compare key levels, affix combos, and completion rates across all dungeons.",
    url: `${siteUrl}/wow/dungeons`,
    siteName: "WoWLFG — UPLINK",
    images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "WoW Mythic+ Dungeon Rankings — Difficulty & Affix Guide", description: "Mythic+ dungeon difficulty rankings for The War Within Season 1.", images: [`${siteUrl}/og.png`] },
};

export default function DungeonsPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WoWLFG", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "WoW", item: `${siteUrl}/wow` },
      { "@type": "ListItem", position: 3, name: "Mythic+ Dungeons" },
    ],
  };
  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "WoW Mythic+ Dungeon Rankings — Difficulty & Affix Guide",
    description:
      "Ranked Mythic+ dungeon difficulties for The War Within Season 1. Compare key levels, affix combos, and completion rates across all dungeons.",
    url: `${siteUrl}/wow/dungeons`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      <DungeonsClient />
    </>
  );
}
