import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import BoostsPageContent from "./BoostsPageContent";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "UPLINK Boost Requests — Auction House",
  description:
    "Browse open boost requests for dungeons and leveling. Place bids in gold and find your next boost contract on UPLINK.",
  openGraph: {
    title: "UPLINK Boost Requests — Auction House",
    description:
      "Browse open boost requests for dungeons and leveling. Place bids in gold.",
  },
  alternates: {
    canonical: `${siteUrl}/boosts`,
  },
};

export default function BoostsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/boosts#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Boost Requests", item: `${siteUrl}/boosts` },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/boosts#itemlist`,
        url: `${siteUrl}/boosts`,
        name: "Boost Requests — UPLINK Auction House",
        description: "Open boost requests for dungeons and leveling where players place bids in gold.",
        itemListElement: [] as any[],
        mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/boosts` },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BoostsPageContent />
    </>
  );
}
