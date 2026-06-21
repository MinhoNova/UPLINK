import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/navbar/Navbar";
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
    default: "WoWLFG | UPLINK — WoW Mythic+ Group Finder & Boosting",
    template: "%s | WoWLFG",
  },
  description:
    "WoWLFG — World of Warcraft Looking for Group. Find Mythic+ groups, leveling squads, boost requests, and dungeon runs. Sync Raider.io, place bids in gold, and join the UPLINK boosting marketplace.",
  keywords: [
    "WoWLFG",
    "wowlfg",
    "UPLINK",
    "WoW",
    "World of Warcraft",
    "Mythic+",
    "Mythic Plus",
    "Raider.io",
    "LFG",
    "Looking for Group",
    "Dungeon",
    "Leveling",
    "Boost",
    "Boosting",
    "Retail WoW",
    "WoW LFG",
    "Group Finder",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "WoWLFG — UPLINK",
    title: "WoWLFG | UPLINK — WoW Group Finder & Boosting",
    description:
      "WoWLFG — World of Warcraft Looking for Group. Find Mythic+ groups, leveling squads, boost requests, and dungeon runs on UPLINK.",
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "WoWLFG — UPLINK — WoW Group Finder",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WoWLFG | UPLINK — WoW Group Finder & Boosting",
    description:
      "WoWLFG — Find Mythic+ groups, boost requests, leveling squads on UPLINK. Raider.io sync and Discord bot included.",
    images: [`${siteUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased dark">
      <head>
        <meta property="og:image" content={`${siteUrl}/og.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content={`${siteUrl}/og.png`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "WoWLFG — UPLINK",
              url: siteUrl,
              description:
                "WoWLFG — World of Warcraft Looking for Group. Find Mythic+ groups, leveling squads, boost requests, and dungeon runs.",
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <DirectCommsPanel />
          <CommunityNotificationsPanel />
          <PlayerProfileModal />
          {children}
          <footer className="border-t border-white/5 mt-auto py-10 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest">
                <a href="/" className="text-gray-500 hover:text-white transition-colors">Home</a>
                <a href="/boosts" className="text-gray-500 hover:text-white transition-colors">Boost Requests</a>
                <a href="/shop" className="text-gray-500 hover:text-white transition-colors">Shop</a>
                <a href="/reviews" className="text-gray-500 hover:text-white transition-colors">Reviews</a>
                <a href="/community" className="text-gray-500 hover:text-white transition-colors">Community</a>
                <a href="/leaderboard" className="text-gray-500 hover:text-white transition-colors">Leaderboard</a>
                <a href="/guides" className="text-gray-500 hover:text-white transition-colors">Guides</a>
                <a href="/addon" className="text-gray-500 hover:text-white transition-colors">Addon</a>
                <span className="text-white/20">·</span>
                <a href="/wowlfg" className="text-gray-500 hover:text-white transition-colors">WoWLFG</a>
              </div>
              <p className="text-center mt-4 text-[8px] text-gray-700 font-black uppercase tracking-widest">
                WoWLFG — World of Warcraft LFG, Boosting &amp; Group Finder | UPLINK
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
