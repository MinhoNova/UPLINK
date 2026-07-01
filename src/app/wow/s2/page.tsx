import { getSiteUrl } from "@/lib/siteUrl";
import TierListClient from "../tier-list/TierListClient";

const siteUrl = getSiteUrl();

export const metadata = {
  title: "Midnight Season 2 Tier List — WoW PTR S2 Meta Specs Rankings | WoWLFG",
  description:
    "Midnight S2 tier list — projected WoW spec rankings for PTR Season 2. See the best specs for Mythic+ in the next patch with live PTR data and S/A/B/C/D/F tier assignments.",
  keywords: [
    "midnight s2 tier list", "wow season 2 tier list", "s2 mythic plus tier list",
    "mn s2 meta specs", "midnight season 2 rankings", "ptr season 2 tier list",
    "ptr s2 meta", "ptr midnight tier list", "wow ptr s2 rankings",
    "ptr s2 best specs", "s2 dps tier list", "s2 healer tier list",
    "s2 tank tier list", "ptr s2 tank rankings", "best specs season 2",
    "midnight s2 best class", "s2 wow meta", "next patch tier list wow",
    "mn s2 tier list", "midnight s2 dps rankings", "s2 mythic plus meta",
    "midnight expansion season 2 specs", "tier list wow s2",
    "midnight season 2 mythic plus", "s2 ptr tier list",
    "wow patch tier list", "season 2 meta specs",
  ],
  alternates: { canonical: `${siteUrl}/wow/s2` },
  openGraph: {
    title: "Midnight Season 2 Tier List — WoW PTR S2 Meta Specs",
    description:
      "Projected WoW spec rankings for Midnight Season 2 Mythic+. PTR-powered tier list with S/A/B/C/D/F tiers for all 40 specs.",
    url: `${siteUrl}/wow/s2`,
  },
};

export default function S2Page() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WoWLFG", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "WoW", item: `${siteUrl}/wow` },
      { "@type": "ListItem", position: 3, name: "Midnight Season 2 Tier List" },
    ],
  };
  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Midnight Season 2 Tier List — WoW PTR S2 Meta Specs Rankings",
    description:
      "Projected WoW spec rankings for Midnight Season 2 Mythic+. PTR data-driven S/A/B/C/D/F tier list for all 40 specializations.",
    url: `${siteUrl}/wow/s2`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      <TierListClient ptr={true} />
    </>
  );
}
