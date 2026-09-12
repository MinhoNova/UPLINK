import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import ReviewsPageContent from "./ReviewsPageContent";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "UPLINK Reviews — Player Community",
  description: "Read reviews and ratings from the UPLINK LFG community. Share your experience with the premier Aion 2 LFG marketplace.",
  openGraph: {
    title: "UPLINK Reviews — Player Community",
    description: "Read reviews and ratings from the UPLINK LFG community. Share your experience.",
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
        "@type": "WebPage",
        "@id": `${siteUrl}/reviews`,
        name: "UPLINK Reviews — Player Community",
        description: "Read reviews and ratings from the UPLINK LFG community.",
        about: {
          "@type": "Service",
          name: "UPLINK",
          description: "LFG group finder and boosting marketplace.",
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
