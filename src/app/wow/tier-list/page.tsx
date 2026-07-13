import { getSiteUrl } from "@/lib/siteUrl";
import TierListClient from "./TierListClient";

const siteUrl = getSiteUrl();

export const metadata = {
  title: "WoW Meta Classes Rankings — Mythic+ Spec Tier List S/A/B/C/D/F | WoWLFG",
  description:
    "Live WoW spec rankings for Mythic+. See which specs top the charts with real-time scores, highest keys, and dynamic tier assignments from Raider.IO data",
  alternates: { canonical: `${siteUrl}/wow/tier-list` },
  openGraph: {
    title: "WoW Meta Classes Rankings — Mythic+ Spec Tier List S/A/B/C/D/F",
    description: "Live WoW spec rankings for Mythic+. See which specs top the charts with real-time scores, highest keys, and dynamic tier assignments.",
    url: `${siteUrl}/wow/tier-list`,
    siteName: "WoWLFG — UPLINK",
    images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "WoW Meta Classes Rankings — Mythic+ Spec Tier List", description: "Live WoW spec rankings for Mythic+. S/A/B/C/D/F tier assignments from Raider.IO data.", images: [`${siteUrl}/og.png`] },
};

export default function TierListPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WoWLFG", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "WoW", item: `${siteUrl}/wow` },
      { "@type": "ListItem", position: 3, name: "Meta Classes Tier List" },
    ],
  };
  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "WoW Meta Classes Rankings — Mythic+ Spec Tier List",
    description:
      "Live WoW spec rankings for Mythic+. S/A/B/C/D/F tier assignments from Raider.IO scores, highest keys, and spec stats for all 40 specializations.",
    url: `${siteUrl}/wow/tier-list`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      <TierListClient />
    </>
  );
}
