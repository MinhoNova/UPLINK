import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/navbar/Navbar";
import ThemeApplier from "@/components/ThemeApplier";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { I18nProvider } from "@/i18n/i18n";
import DirectCommsPanel from "@/components/DirectCommsPanel";
import CommunityNotificationsPanel from "@/components/community/CommunityNotificationsPanel";
import PlayerProfileModal from "@/components/PlayerProfileModal";
import GlobalChatWidget from "@/components/GlobalChatWidget";
import { getSiteUrl } from "@/lib/siteUrl";
import { getDiscordInviteUrl } from "@/lib/discordConstants";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const siteUrl = getSiteUrl();
const discordInviteUrl = getDiscordInviteUrl();

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
    "aion 2",
    "aion2",
    "aion 2 classes",
    "aion 2 templar",
    "aion 2 gladiator",
    "aion 2 assassin",
    "aion 2 ranger",
    "aion 2 sorcerer",
    "aion 2 spiritmaster",
    "aion 2 chanter",
    "aion 2 cleric",
    "aion 2 tank",
    "aion 2 healer",
    "aion 2 dps",
    "aion 2 boosting",
    "aion 2 carry",
    "aion 2 abyss points",
    "aion 2 pvp farm",
    "aion 2 leveling",
    "aion 2 guides",
    "aion 2 community",
    "aion 2 discord",
    "beritra brigade fortress",
    "abyssal forge ludra",
    "aion 2 daily dungeons",
    "aion 2 expeditions",
    "aion 2 ascend",
  ],
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
        url: `${siteUrl}/og-live.png`,
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
    images: [`${siteUrl}/og-live.png`],
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
      alternateName: ["aion2lfg", "aionlfg", "Aion 2 LFG", "Aion2LFG", "aion 2"],
      url: siteUrl,
      description:
        "LFG group finder for Aion 2 — find squads for dungeons, raids, PvP (Abyss Points farming), and leveling.",
      inLanguage: "en",
      potentialAction: [
        {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/lfg/EU/dungeons`,
          },
          "query-input": "required name=search_term_string",
        },
      ],
    },
    {
      "@type": "Organization",
      name: "Aion 2 LFG",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      sameAs: [
        discordInviteUrl,
        `${siteUrl}/discord`,
      ],
    },
    {
      "@type": "SiteNavigationElement",
      name: ["Home", "Create Offer", "Discord Server", "About", "Contact", "Reviews"],
      url: [
        siteUrl,
        `${siteUrl}/create-offer`,
        `${siteUrl}/discord`,
        `${siteUrl}/about`,
        `${siteUrl}/contact`,
        `${siteUrl}/reviews`,
      ],
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
            <GlobalChatWidget />
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
