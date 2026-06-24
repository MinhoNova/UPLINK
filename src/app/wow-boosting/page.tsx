import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { Zap, Swords, Users, Coins, Trophy, Shield, MessageSquare, Target } from "lucide-react";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "WoW Boosting & Boost Marketplace — UPLINK",
  description:
    "WoW boosting platform for Mythic+ dungeons, leveling, and raids. Post boost requests, place gold bids, and find boosters on UPLINK. Free for all players, no subscriptions.",
  openGraph: {
    title: "WoW Boosting — UPLINK | Gold Auctions & Community Boost Marketplace",
    description:
      "Post WoW boost requests and let boosters bid in gold. Mythic+, leveling, and raid boosting. Free blind auction system on UPLINK.",
    siteName: "WoWLFG — UPLINK",
  },
  keywords: [
    "wow boosting", "wowboost", "WoW boost", "World of Warcraft boosting",
    "Mythic+ boost", "WoW leveling boost", "boosting marketplace",
    "gold auction boosting", "UPLINK boosting",
  ],
  alternates: { canonical: `${siteUrl}/wow-boosting` },
};

const services = [
  {
    icon: Swords,
    title: "Mythic+ Boosting",
    desc: "Boost your Mythic+ key or rating. Browse live offers from experienced boosters, apply directly, or post a request and let boosters bid for your contract in gold.",
    link: "/",
    linkText: "Browse Offers",
  },
  {
    icon: Zap,
    title: "Leveling Boosting",
    desc: "Power leveling from 70 to 80, AFK XP farms, and fast leveling services. Post a leveling request and receive gold bids from available boosters.",
    link: "/boosts",
    linkText: "Post Request",
  },
  {
    icon: Coins,
    title: "Gold Blind Auction",
    desc: "Unlike traditional boost marketplaces, UPLINK uses a blind auction system. Post what you need, boosters bid in gold, and only you see the bids until you choose.",
    link: "/boosts",
    linkText: "How Auctions Work",
  },
  {
    icon: Trophy,
    title: "Leaderboard & Reputation",
    desc: "Every completed run builds your reputation. Check booster ratings, Raider.io scores, and leaderboard rankings before choosing who to hire.",
    link: "/leaderboard",
    linkText: "View Leaderboard",
  },
  {
    icon: Users,
    title: "Community Reviews",
    desc: "Read and leave reviews for completed boosts. Transparent feedback system helps you find reliable boosters and build trust in the community.",
    link: "/reviews",
    linkText: "Read Reviews",
  },
  {
    icon: Shield,
    title: "Free & Open",
    desc: "No subscriptions, no premium tiers, no hidden fees. Every feature — offers, boost requests, blind auctions, leaderboard, reviews — is available to everyone.",
    link: "/wowlfg",
    linkText: "Learn More",
  },
];

const faqItems = [
  { q: "What is WoW boosting?", a: "WoW boosting is a service where experienced players help others complete difficult content — Mythic+ dungeons, raids, or leveling — for an agreed payment, typically in gold." },
  { q: "How does gold auction work?", a: "You post a boost request with your requirements. Boosters place blind bids in gold. Only you see the bids until you accept one. No one can undercut or game the system." },
  { q: "Is UPLINK free?", a: "Yes. Every feature is free. No subscriptions, no premium tiers, no daily limits. We believe boosting should be accessible to all WoW players." },
  { q: "How do I find a booster?", a: "Browse live offers on the main page or post a boost request and let boosters come to you. Check their Raider.io score, reviews, and leaderboard rank before accepting." },
  { q: "What payment methods are accepted?", a: "All transactions are in WoW gold. The blind auction system lets boosters compete on price, ensuring you get the best deal." },
];

export default function WowBoostingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/wow-boosting`,
        url: `${siteUrl}/wow-boosting`,
        name: "WoW Boosting — UPLINK | Gold Auction Marketplace",
        description: "Free WoW boosting marketplace with blind gold auctions. Mythic+, leveling, and raid boosting services. Post requests and let boosters bid.",
        about: { "@type": "Thing", name: "World of Warcraft boosting" },
        isPartOf: { "@id": `${siteUrl}#website` },
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/wow-boosting#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
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
            WoW <span className="text-[#00ffff]">Boosting</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The fairest WoW boosting marketplace. Post boost requests, receive blind gold bids from 
            verified boosters, and choose the best offer — all for free.
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

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {services.map((s) => (
            <div key={s.title} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition">
              <s.icon className="w-8 h-8 text-[#00ffff] mb-4" />
              <h2 className="text-base font-black text-white mb-2">{s.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.desc}</p>
              <Link href={s.link} className="text-[10px] font-black uppercase tracking-widest text-[#00ffff] hover:underline">{s.linkText} →</Link>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-8 text-center">How WoW Boosting Works on UPLINK</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Post Request", desc: "Describe what you need — key level, dungeon, or leveling range." },
              { step: "2", title: "Receive Bids", desc: "Boosters bid in gold. Bids are blind — only you see them." },
              { step: "3", title: "Choose Booster", desc: "Review profiles, scores, and ratings. Accept the best offer." },
              { step: "4", title: "Complete Run", desc: "Run the dungeon or complete the boost. Rate and review afterwards." },
            ].map((s) => (
              <div key={s.step} className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-[#00ffff]/10 border border-[#00ffff]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#00ffff] font-black text-lg">{s.step}</span>
                </div>
                <h3 className="text-sm font-black text-white mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqItems.map((item) => (
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
          <h2 className="text-xl font-black text-white mb-3">Ready to Boost?</h2>
          <p className="text-sm text-gray-500 mb-6">Join thousands of players using UPLINK for WoW boosting.</p>
          <Link href="/boosts" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff007f] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff007f]/80 transition shadow-[0_0_20px_rgba(255,0,127,0.3)]">
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
