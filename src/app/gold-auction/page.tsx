import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { Coins, Eye, ShieldCheck, Handshake, TrendingUp, Users } from "lucide-react";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Gold Blind Auction — WoW Boosting Gold Bids | UPLINK",
  description:
    "Post a WoW boost request and receive blind gold bids from boosters. Only you see the bids. Free blind auction system for Mythic+, leveling, and raid boosting on UPLINK.",
  openGraph: {
    title: "Gold Blind Auction — UPLINK | WoW Boosting Gold Bidding System",
    description:
      "Blind gold auctions for WoW boosting. Post requests, boosters bid in gold, only you see the bids. Fair, transparent, and free.",
    siteName: "WoWLFG — UPLINK",
  },
  keywords: [
    "wow gold auction", "blind auction wow", "gold boosting wow",
    "wow boost gold bid", "wow auction boosting", "buy wow boost gold",
    "wow mythic plus gold", "gold bid wow",
  ],
  alternates: { canonical: `${siteUrl}/gold-auction` },
};

const steps = [
  {
    icon: Coins,
    title: "1. Post a Boost Request",
    desc: "Tell boosters what you need — dungeon, key level, or leveling range. Set your requirements and let the bidding begin.",
  },
  {
    icon: Eye,
    title: "2. Blind Bidding Opens",
    desc: "Boosters submit their best gold offer. Each bid is blind — no one sees what others bid. You are the only one who sees all offers.",
  },
  {
    icon: ShieldCheck,
    title: "3. Compare Offers Privately",
    desc: "Review each booster's profile, Raider.io score, leaderboard rank, and feedback ratings alongside their bid. All private, all informed.",
  },
  {
    icon: Handshake,
    title: "4. Accept the Best Offer",
    desc: "Choose the booster that fits your needs and budget. Only you decide who wins. No price wars, no undercutting — just fair competition.",
  },
];

const advantages = [
  {
    icon: TrendingUp,
    title: "Better Gold Prices",
    desc: "Blind competition means boosters bid their true best price. You get the best gold rate without the bidding war markup.",
  },
  {
    icon: Users,
    title: "No Sniping, No Undercutting",
    desc: "Unlike public auctions, no one can see or react to other bids. Every booster submits independently, so you get genuine offers.",
  },
  {
    icon: ShieldCheck,
    title: "Full Privacy & Control",
    desc: "Your request and all bids are visible only to you. Boosters compete on quality and price without public pressure.",
  },
];

export default function GoldAuctionPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/gold-auction#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Gold Blind Auction", item: `${siteUrl}/gold-auction` },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/gold-auction`,
        url: `${siteUrl}/gold-auction`,
        name: "Gold Blind Auction — WoW Boosting Gold Bids",
        description: "Blind gold auction system for WoW boosting on UPLINK. Post boost requests, receive blind bids, and choose the best booster.",
        about: { "@type": "Thing", name: "WoW blind gold auction boosting" },
        isPartOf: { "@id": `${siteUrl}#website` },
      },
      {
        "@type": "HowTo",
        "@id": `${siteUrl}/gold-auction#howto`,
        name: "How Blind Gold Auctions Work for WoW Boosting",
        description: "Steps to post a boost request and choose a booster via blind gold auction.",
        step: steps.map((s) => ({
          "@type": "HowToStep",
          name: s.title,
          text: s.desc,
        })),
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16 pt-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Gold <span className="text-[#00ffff]">Blind Auction</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The only WoW boosting marketplace with a true blind auction system. Post what you need, 
            boosters bid in gold, and <strong className="text-white">only you see the offers</strong>.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/boosts" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff007f] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff007f]/80 transition shadow-[0_0_20px_rgba(255,0,127,0.3)]">
              Post a Boost Request
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition">
              Browse Offers
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-8 text-center">How Blind Gold Auctions Work</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {steps.map((s) => (
              <div key={s.title} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
                <s.icon className="w-8 h-8 text-[#ff007f] mb-4" />
                <h3 className="text-base font-black text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Blind Auction */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-8 text-center">Why a Blind Auction?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {advantages.map((a) => (
              <div key={a.title} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6 text-center">
                <a.icon className="w-8 h-8 text-[#00ffff] mx-auto mb-4" />
                <h3 className="text-sm font-black text-white mb-2">{a.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* vs Traditional */}
        <div className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-white mb-8 text-center">Blind Auction vs Traditional</h2>
          <div className="grid sm:grid-cols-2 gap-0 border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-[#0a0a16] to-black">
              <h3 className="text-sm font-black text-[#ff007f] mb-4 text-center uppercase tracking-wider">Public Auction</h3>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">✗ Boosters see each other's bids</li>
                <li className="flex items-center gap-2">✗ Last-minute undercutting</li>
                <li className="flex items-center gap-2">✗ Price wars drive down quality</li>
                <li className="flex items-center gap-2">✗ Booster reputation pressure</li>
              </ul>
            </div>
            <div className="p-6 bg-gradient-to-br from-[#0a0a16] to-black border-l border-white/5">
              <h3 className="text-sm font-black text-[#00ffff] mb-4 text-center uppercase tracking-wider">Blind Auction</h3>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">✓ Only you see all bids</li>
                <li className="flex items-center gap-2">✓ No undercutting possible</li>
                <li className="flex items-center gap-2">✓ Boosters bid their best price</li>
                <li className="flex items-center gap-2">✓ You choose, no pressure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-white mb-8 text-center">Gold Auction FAQs</h2>
          <div className="space-y-3">
            {[
              { q: "What is a blind gold auction?", a: "A bidding system where boosters submit gold offers for your boost request — but cannot see each other's bids. Only you, the requester, can see all offers." },
              { q: "Is the blind auction free?", a: "Yes, completely free. Post requests and place bids with no fees, subscriptions, or commissions." },
              { q: "Can I cancel my request?", a: "Yes. You can cancel anytime before accepting a bid. No penalties or locked-in contracts." },
              { q: "How do I pay the booster?", a: "Payment is in WoW gold, agreed upon when you accept the bid. Arrange with the booster in-game after the run." },
            ].map((item) => (
              <details key={item.q} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-2xl p-5 group open:border-[#00ffff]/20 transition">
                <summary className="text-sm font-black text-white cursor-pointer list-none flex items-center justify-between group-open:text-[#00ffff] transition">
                  {item.q}
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12 border-t border-white/5">
          <h2 className="text-xl font-black text-white mb-3">Start Your Gold Auction</h2>
          <p className="text-sm text-gray-500 mb-6">Post a boost request and let boosters compete for your contract.</p>
          <Link href="/boosts" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff007f] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff007f]/80 transition shadow-[0_0_20px_rgba(255,0,127,0.3)]">
            Post a Request
          </Link>
        </div>
      </div>
    </div>
  );
}
