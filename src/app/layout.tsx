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
    default: "UPLINK | WoW Mythic+ LFG",
    template: "%s | UPLINK",
  },
  description:
    "Find Mythic+ groups, leveling squads, and dungeon runs for World of Warcraft. Sync Raider.io, apply to offers, and coordinate with Discord.",
  keywords: [
    "UPLINK",
    "WoW",
    "World of Warcraft",
    "Mythic+",
    "Mythic Plus",
    "Raider.io",
    "LFG",
    "Dungeon",
    "Leveling",
    "Retail WoW",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "UPLINK",
    title: "UPLINK | WoW Mythic+ LFG",
    description:
      "Tactical WoW group finder — Mythic+ offers, leveling squads, Raider.io sync, and Discord coordination.",
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "UPLINK — WoW Mythic+ LFG",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UPLINK | WoW Mythic+ LFG",
    description:
      "Find Mythic+ groups and leveling squads. Raider.io sync and Discord bot included.",
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
              name: "UPLINK",
              url: siteUrl,
              description:
                "Find Mythic+ groups, leveling squads, and dungeon runs for World of Warcraft.",
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
              </div>
              <p className="text-center mt-4 text-[8px] text-gray-700 font-black uppercase tracking-widest">
                UPLINK — World of Warcraft Mythic+ LFG &amp; Boost Marketplace
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
