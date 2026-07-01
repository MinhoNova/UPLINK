import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { Users, Target, Trophy, Shield, Coins, MessageSquare } from "lucide-react";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "WoWLFG — WoW Looking For Group & Mythic+ Group Finder | UPLINK",
  description:
    "WoWLFG (World of Warcraft Looking For Group) is a free community-powered platform. Find Mythic+ groups, post boost requests with gold auctions, check Raider.io scores, and coordinate with your squad on UPLINK. The best WoW LFG tool for dungeon groups, M+ keys, and boost services.",
  keywords: "wow looking for group, wow lfg, world of warcraft looking for group, wow group finder, mythic plus group finder, wowlfg, wow mythic+ lfg, wow community, find wow group",
  openGraph: {
    title: "WoWLFG — WoW Looking For Group & Mythic+ Group Finder | UPLINK",
    description:
      "WoWLFG — Free WoW Looking For Group platform. Mythic+ offers, boost requests with gold bidding, Raider.io sync, and community tools. Find your Mythic+ group today.",
    siteName: "WoWLFG — UPLINK",
  },
  alternates: { canonical: `${siteUrl}/wowlfg` },
};

const features = [
  {
    icon: Target,
    title: "Mythic+ Offers",
    desc: "Browse live Mythic+ group offers with key level, dungeon, roles, and Raider.io requirements. Apply instantly or create your own offer.",
    link: "/",
    linkText: "Browse Offers",
  },
  {
    icon: Coins,
    title: "Boost Requests & Auctions",
    desc: "Post a boost request and let boosters bid for your contract in gold. Blind auction system keeps bids fair. Find your next boost or offer your services.",
    link: "/boosts",
    linkText: "Boost Marketplace",
  },
  {
    icon: Trophy,
    title: "Leaderboard & Reputation",
    desc: "Climb the leaderboard by completing runs and earning ratings. Every successful boost builds your reputation in the WoWLFG community.",
    link: "/leaderboard",
    linkText: "View Leaderboard",
  },
  {
    icon: Users,
    title: "Community Posts",
    desc: "Share your achievements, find group members, and discuss strategies. Tag your posts with #wowlfg to connect with the community.",
    link: "/community",
    linkText: "Join Community",
  },
  {
    icon: Shield,
    title: "Raider.io Sync",
    desc: "Automatically sync your Raider.io score and character data. Verified runs appear on your profile so group leaders can trust your credentials.",
    link: "/guides/mythic-plus-boosting",
    linkText: "How It Works",
  },
  {
    icon: MessageSquare,
    title: "Reviews & Ratings",
    desc: "Leave reviews after every run. Build a track record that speaks for itself. Know exactly who you're grouping with before you commit.",
    link: "/reviews",
    linkText: "Read Reviews",
  },
];

export default function WoWLFGPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/wowlfg#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "WoWLFG", item: `${siteUrl}/wowlfg` },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/wowlfg#webpage`,
        url: `${siteUrl}/wowlfg`,
        name: "WoWLFG — World of Warcraft Looking For Group",
        description:
          "WoWLFG is a free community platform for World of Warcraft players to find Mythic+ groups, post boost requests with gold auctions, sync Raider.io, and build reputation. No subscriptions, no limits.",
        isPartOf: { "@type": "WebSite", "@id": `${siteUrl}#website` },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-fuchsia-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.15em] mb-3">
            WoW Looking For Group
          </h1>
          <p className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 mb-2">
            WoWLFG — World of Warcraft LFG & Mythic+ Group Finder
          </p>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest max-w-xl mx-auto">
            Free community-powered platform for Mythic+ groups, boost requests, and reputation building
          </p>
        </div>

        {/* What is WoWLFG */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 mb-10">
          <h2 className="text-lg font-black uppercase tracking-[0.15em] mb-4 text-cyan-400">
            What is WoWLFG?
          </h2>
          <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
            <p>
              <strong className="text-white">WoWLFG</strong> stands for <strong className="text-white">World of Warcraft Looking For Group</strong>. It is a free, open platform built on <Link href="/" className="text-cyan-400 hover:underline">UPLINK</Link> that connects WoW players for Mythic+ dungeons, leveling runs, and boost services — all without subscriptions or paywalls.
            </p>
            <p>
              Unlike traditional group finders, WoWLFG uses a <strong className="text-white">blind auction system</strong> for boost requests: you post what you need, boosters bid in gold, and only you see the bids until you choose. Every completed run builds your reputation through reviews and leaderboard scores.
            </p>
            <p>
              Whether you are pushing high keys, leveling a new alt, or offering your services as a booster, WoWLFG gives you the tools to find the right group — fast and transparent.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {features.map((f) => (
            <div key={f.title} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col">
              <f.icon className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="text-sm font-black uppercase tracking-wider mb-2">{f.title}</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed flex-1 mb-3">{f.desc}</p>
              <Link
                href={f.link}
                className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-fuchsia-400 transition-colors"
              >
                {f.linkText} &rarr;
              </Link>
            </div>
          ))}
        </div>

        {/* Why WoWLFG */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-fuchsia-500/5 to-amber-500/5 border border-white/10 mb-10">
          <h2 className="text-lg font-black uppercase tracking-[0.15em] mb-4 text-fuchsia-400">
            Why WoWLFG?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-gray-400">
            <div>
              <h3 className="text-white font-black uppercase tracking-wider text-xs mb-2">100% Free</h3>
              <p className="leading-relaxed">
                No subscriptions, no premium tiers, no daily limits. Every feature — offers, boost requests, auctions, leaderboard, reviews — is available to everyone.
              </p>
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-wider text-xs mb-2">Blind Auctions</h3>
              <p className="leading-relaxed">
                Boosters bid in gold without seeing each other&apos;s offers. Only the request owner sees all bids. Fair market pricing, no undercut wars.
              </p>
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-wider text-xs mb-2">Verified Reputation</h3>
              <p className="leading-relaxed">
                Every run generates a review. Leaderboard ranks reflect real activity. Know who you are grouping with before you accept.
              </p>
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-wider text-xs mb-2">Discord Integration</h3>
              <p className="leading-relaxed">
                Sign in with Discord. Sync roles automatically. Get notified of new offers, boost bids, and community activity directly in your server.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <h2 className="text-lg font-black uppercase tracking-[0.15em] mb-3 text-amber-400">
            Ready to find your group?
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Join the WoWLFG community on UPLINK — no subscription, no catch. Sign in with Discord and start playing.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white text-xs font-black uppercase tracking-widest hover:from-cyan-400 hover:to-fuchsia-400 transition shadow-lg shadow-cyan-500/20"
            >
              Browse Offers
            </Link>
            <Link
              href="/boosts"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-gray-300 text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition"
            >
              Boost Marketplace
            </Link>
            <a
              href="https://discord.gg/r4m3Stk7XZ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5865F2] text-white text-xs font-black uppercase tracking-widest hover:bg-[#4752c4] transition"
            >
              Join Discord
            </a>
          </div>
        </div>

        {/* Internal links */}
        <div className="mt-10 text-center">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Explore WoWLFG</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/" className="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest">Home</Link>
            <span className="text-gray-700">·</span>
            <Link href="/boosts" className="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest">Boost Requests</Link>
            <span className="text-gray-700">·</span>
            <Link href="/leaderboard" className="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest">Leaderboard</Link>
            <span className="text-gray-700">·</span>
            <Link href="/reviews" className="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest">Reviews</Link>
            <span className="text-gray-700">·</span>
            <Link href="/community" className="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest">Community</Link>
            <span className="text-gray-700">·</span>
            <Link href="/guides" className="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest">Guides</Link>
            <span className="text-gray-700">·</span>
            <Link href="/addon" className="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest">Addon</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
