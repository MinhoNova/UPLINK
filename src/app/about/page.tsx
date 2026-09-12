import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { Users, Shield, Coins, HeartHandshake } from "lucide-react";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "About Us — Aion 2 LFG",
  description:
    "Aion 2 LFG (aion2lfg.com) is a free community LFG platform for Aion 2. Find squads for dungeons, raids, Abyss Points farming and leveling — transparent, community-first, and free.",
  openGraph: {
    title: "About Aion 2 LFG",
    description: "The Aion 2 group finder. Find dungeons, raids, PvP and leveling squads for free.",
    siteName: "Aion 2 LFG",
  },
  alternates: { canonical: `${siteUrl}/about` },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/about#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "About Us", item: `${siteUrl}/about` },
        ],
      },
      {
        "@type": "AboutPage",
        "@id": `${siteUrl}/about`,
        url: `${siteUrl}/about`,
        name: "About Aion 2 LFG",
        description: "Aion 2 LFG is a free community LFG platform for Aion 2 players to find groups, post offers, and use safety-focused platform tools.",
        isPartOf: { "@type": "WebSite", "@id": `${siteUrl}#website` },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">About <span className="text-[#00ffff]">Aion 2 LFG</span></h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          Aion 2 LFG (aion2lfg.com) is a vibrant and growing community created for 
          Aion 2 players to find groups, post offers for dungeons, raids, Abyss Points farming 
          and leveling — and coordinate with teammates through Discord.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: Users, title: "Community First", desc: "Built by Aion 2 players for Aion 2 players. Every feature serves the community, not a bottom line." },
            { icon: Shield, title: "Safety Focused", desc: "Verification systems, reputation tracking, and transparent reviews keep the platform trustworthy." },
            { icon: Coins, title: "Free to Use", desc: "No commissions, no listing fees, no premium tiers. Posting and applying to offers is completely free." },
            { icon: HeartHandshake, title: "Open & Transparent", desc: "Public offers, reviews, and community feedback so you know exactly who you're dealing with." },
          ].map((v) => (
            <div key={v.title} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
              <v.icon className="w-6 h-6 text-[#ff007f] mb-3" />
              <h2 className="text-sm font-black text-white mb-1">{v.title}</h2>
              <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6 mb-8">
          <h2 className="text-base font-black text-white mb-3">Our Mission</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">
            We believe LFG should be accessible to everyone. Traditional boosting marketplaces take 
            cuts, hide fees, and lack transparency. Aion 2 LFG fixes that with an open offer system where 
            players post their runs and you join the best offer — all free, on the site and on Discord.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Whether you are looking for a dungeon group, a raid squad, an Abyss Points farm, or a leveling 
            service — or you want to offer your own runs — Aion 2 LFG gives you the tools to connect, 
            coordinate, and build reputation, no subscriptions, no limits, no BS.
          </p>
        </div>

        <div className="text-center">
          <Link href="/create-offer" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff007f] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff007f]/80 transition shadow-[0_0_20px_rgba(255,0,127,0.3)]">
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
