import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { Download, Package, Shield, Zap, GitBranch } from "lucide-react";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "UPLINK Addon — WoW Group Finder Integration",
  description:
    "Download the UPLINK World of Warcraft addon for seamless group finder integration. Browse Mythic+ groups, check Raider.io scores, and find your next run directly in-game.",
  openGraph: {
    title: "UPLINK Addon — WoW Group Finder Integration",
    description:
      "Browse Mythic+ groups, check Raider.io scores, and find runs directly in-game with the UPLINK addon.",
  },
  alternates: { canonical: `${siteUrl}/addon` },
};

export default function AddonPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/addon#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Addon", item: `${siteUrl}/addon` },
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/addon#software`,
        name: "UPLINK Group Finder Addon",
        applicationCategory: "GameApplication",
        operatingSystem: "Windows, macOS",
        description:
          "World of Warcraft addon for UPLINK group finder integration. Browse Mythic+ groups, check Raider.io scores, and find runs in-game.",
        url: `${siteUrl}/addon`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2">UPLINK Addon</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
            Seamless group finder integration for World of Warcraft
          </p>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Shield, title: "Safe & Secure", desc: "Open source. No account data ever leaves your machine." },
            { icon: Zap, title: "One-Click Join", desc: "Browse and join UPLINK groups without leaving the game." },
              { icon: GitBranch, title: "Open Source", desc: "Source available on GitHub. Community contributions welcome." },
          ].map((f) => (
            <div key={f.title} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
              <f.icon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h3 className="text-sm font-black uppercase tracking-wider mb-1">{f.title}</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <p className="text-lg text-gray-400 mb-6">
            The UPLINK addon is currently in development. Join our Discord to get early access and be notified when it launches on CurseForge.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://discord.gg/r4m3Stk7XZ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5865F2] text-white text-xs font-black uppercase tracking-widest hover:bg-[#4752c4] transition"
            >
              <Download className="w-4 h-4" /> Join Discord
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-gray-300 text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition"
            >
              Back to UPLINK
            </Link>
          </div>
        </div>

        {/* Internal links */}
        <div className="mt-10 text-center">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Explore UPLINK</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/boosts" className="text-[10px] font-black text-gray-500 hover:text-[#00ffff] uppercase tracking-widest">Boost Requests</Link>
            <span className="text-gray-700">·</span>
            <Link href="/shop" className="text-[10px] font-black text-gray-500 hover:text-[#00ffff] uppercase tracking-widest">Secret Club</Link>
            <span className="text-gray-700">·</span>
            <Link href="/reviews" className="text-[10px] font-black text-gray-500 hover:text-[#00ffff] uppercase tracking-widest">Reviews</Link>
            <span className="text-gray-700">·</span>
            <Link href="/community" className="text-[10px] font-black text-gray-500 hover:text-[#00ffff] uppercase tracking-widest">Community</Link>
            <span className="text-gray-700">·</span>
            <Link href="/guides" className="text-[10px] font-black text-gray-500 hover:text-[#00ffff] uppercase tracking-widest">Guides</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
