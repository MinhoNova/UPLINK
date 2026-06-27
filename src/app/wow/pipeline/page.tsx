import { getSiteUrl } from "@/lib/siteUrl";
import PipelineClient from "./PipelineClient";

const siteUrl = getSiteUrl();

export const metadata = {
  title: "The Pipeline — WoW Blue Tracker & Blizzard Class Tuning Feed | WoWLFG",
  description:
    "Live feed of Blizzard blue posts — class tuning, hotfixes, PTR notes, and developer updates aggregated from official Blizzard forums for World of Warcraft.",
  alternates: { canonical: `${siteUrl}/wow/pipeline` },
};

export default function PipelinePage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WoWLFG", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "WoW", item: `${siteUrl}/wow` },
      { "@type": "ListItem", position: 3, name: "The Pipeline — Blue Tracker" },
    ],
  };
  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "The Pipeline — WoW Blue Tracker & Blizzard Class Tuning Feed",
    description:
      "Live aggregation of Blizzard blue posts: class tuning, hotfixes, PTR notes, and developer updates for World of Warcraft.",
    url: `${siteUrl}/wow/pipeline`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      <PipelineClient />
    </>
  );
}
