import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import ShopPageContent from "./ShopPageContent";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "UPLINK Features — Free & Open",
  description:
    "UPLINK is completely free and open to everyone. No subscriptions, no paywalls. All features including lobby VFX, profile GIFs, auto-apply, and Community Club access are available to all users.",
  openGraph: {
    title: "UPLINK Features — Free & Open",
    description:
      "UPLINK is completely free and open to everyone. No subscriptions, no paywalls.",
  },
  alternates: {
    canonical: `${siteUrl}/shop`,
  },
};

export default function ShopPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/shop#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Features", item: `${siteUrl}/shop` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShopPageContent />
    </>
  );
}
