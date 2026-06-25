import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { Users, Shield, Coins, HeartHandshake } from "lucide-react";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "About Us — WoWLFG | UPLINK",
  description:
    "WoWLFG is a free community-powered WoW boosting platform. Learn about our mission to make WoW boosting fair, transparent, and accessible through blind gold auctions on UPLINK.",
  openGraph: {
    title: "About WoWLFG — UPLINK",
    description: "Free WoW boosting marketplace with blind gold auctions. Community-driven, no subscriptions, no hidden fees.",
    siteName: "WoWLFG — UPLINK",
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
        name: "About WoWLFG — Free WoW Boosting Marketplace",
        description: "WoWLFG (World of Warcraft Looking For Group) is a vibrant community created for WoW players to find groups, post boost requests, and use safety-focused platform tools.",
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
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">About <span className="text-[#00ffff]">WoWLFG</span></h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          WoWLFG (World of Warcraft Looking For Group) is a vibrant and growing community created for 
          World of Warcraft players to find groups, post boost requests with gold auctions, browse guides, 
          and use safety-focused platform tools — all completely free.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: Users, title: "Community First", desc: "Built by WoW players for WoW players. Every feature serves the community, not a bottom line." },
            { icon: Shield, title: "Safety Focused", desc: "Verification systems, reputation tracking, and transparent reviews keep the platform trustworthy." },
            { icon: Coins, title: "Free Gold Auctions", desc: "No commissions, no listing fees, no premium tiers. Blind gold auctions keep boosting fair." },
            { icon: HeartHandshake, title: "Open & Transparent", desc: "Leaderboards, public reviews, and Raider.io integration so you know exactly who you're dealing with." },
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
            We believe WoW boosting should be accessible to everyone. Traditional boost marketplaces take 
            cuts, hide fees, and lack transparency. WoWLFG changes that with a blind auction system where 
            boosters compete on price and you choose the best offer — all in gold, all for free.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Whether you are looking for a Mythic+ carry, leveling service, or want to offer your skills as 
            a booster, WoWLFG gives you the tools to connect, transact, and build reputation — no 
            subscriptions, no limits, no BS.
          </p>
        </div>

        <div className="text-center">
          <Link href="/boosts" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff007f] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff007f]/80 transition shadow-[0_0_20px_rgba(255,0,127,0.3)]">
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
