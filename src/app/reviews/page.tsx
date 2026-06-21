import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import ReviewsPageContent from "./ReviewsPageContent";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "WoWLFG Reviews — UPLINK",
  description: "WoWLFG — Read reviews and ratings from the UPLINK boosting community. Share your experience with the premier WoW LFG and boosting marketplace.",
  openGraph: {
    title: "WoWLFG Reviews — UPLINK",
    description: "WoWLFG — Read reviews and ratings from the UPLINK boosting community. Share your experience.",
  },
  alternates: {
    canonical: `${siteUrl}/reviews`,
  },
};

export default function ReviewsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/reviews#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Reviews", item: `${siteUrl}/reviews` },
        ],
      },
      {
        "@type": "Review",
        "@id": `${siteUrl}/reviews#review`,
        itemReviewed: {
          "@type": "Service",
          name: "UPLINK",
          description: "World of Warcraft Mythic+ group finder and boosting marketplace.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReviewsPageContent />
    </>
  );
}
