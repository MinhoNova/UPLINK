import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import ShopPageContent from "./ShopPageContent";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Secret Club Shop — UPLINK",
  description:
    "Subscribe to UPLINK Secret Club. Unlock exclusive perks: profile GIFs, banner effects, lobby VFX, auto-apply, hidden identity, and Community Club access.",
  openGraph: {
    title: "Secret Club Shop — UPLINK",
    description:
      "Subscribe to UPLINK Secret Club. Unlock exclusive perks: profile GIFs, banner effects, lobby VFX, auto-apply, hidden identity, and Community Club access.",
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
          { "@type": "ListItem", position: 2, name: "Secret Club Shop", item: `${siteUrl}/shop` },
        ],
      },
      {
        "@type": "Product",
        "@id": `${siteUrl}/shop#product`,
        name: "UPLINK Secret Club Subscription",
        description:
          "Unlock profile GIFs, banner effects, lobby VFX, auto-apply, hidden identity, and Community Club access.",
        url: `${siteUrl}/shop`,
        offers: {
          "@type": "Offer",
          price: "9.99",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
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
      <ShopPageContent />
    </>
  );
}
