import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/navbar/Navbar";
import ThemeApplier from "@/components/ThemeApplier";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { I18nProvider } from "@/i18n/i18n";
import DirectCommsPanel from "@/components/DirectCommsPanel";
import CommunityNotificationsPanel from "@/components/community/CommunityNotificationsPanel";
import PlayerProfileModal from "@/components/PlayerProfileModal";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aion 2 LFG | Group Finder for Dungeons, Raids & PvP",
    template: "%s | Aion 2 LFG",
  },
  description:
    "Aion 2 LFG (aion2lfg.com) — the LFG group finder for Aion 2. Find squads for dungeons, raids, Abyss Points (PvP) farming and leveling. Post an offer, set your class and region, and let the best players apply.",
  keywords: [
    "aion2lfg",
    "aion 2 lfg",
    "aionlfg",
    "aion 2 group finder",
    "aion 2 lfg site",
    "aion 2 dungeon finder",
    "aion 2 raids",
    "aion 2 pvp",
    "abyss points farm",
    "beritra brigade fortress",
    "abyssal forge ludra",
    "aion 2 classes",
    "aion 2 leveling",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Aion 2 LFG",
    title: "Aion 2 LFG | Group Finder for Dungeons, Raids & PvP",
    description:
      "Find Aion 2 squads for dungeons, raids, PvP (Abyss Points farming) and leveling on aion2lfg.com.",
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Aion 2 LFG — the Aion 2 group finder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aion 2 LFG | Aion 2 Group Finder",
    description:
      "Find Aion 2 squads — dungeons, raids, PvP and leveling. LFG made easy.",
    images: [`${siteUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const seoJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Aion 2 LFG",
      alternateName: ["aion2lfg", "aionlfg", "Aion 2 LFG"],
      url: siteUrl,
      description:
        "LFG group finder for Aion 2 — find squads for dungeons, raids, PvP (Abyss Points farming), and leveling.",
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      name: "Aion 2 LFG",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      sameAs: [siteUrl],
    },
  ],
}).replace(/</g, "\\u003c");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased dark">
      <body className="min-h-screen flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seoJsonLd }}
        />
        <AuthProvider>
          <I18nProvider>
            <ThemeApplier />
            <AnalyticsTracker />
            <Navbar />
            <DirectCommsPanel />
            <CommunityNotificationsPanel />
            <PlayerProfileModal />
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
