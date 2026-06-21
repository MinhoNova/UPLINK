import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "WoWLFG Guides — UPLINK",
  description:
    "WoWLFG — Mythic+ guides, leveling tips, dungeon strategies, and boosting advice for World of Warcraft players. Learn how to find groups and climb the leaderboard.",
  openGraph: {
    title: "WoWLFG Guides — UPLINK",
    description:
      "WoWLFG — Mythic+ guides, leveling tips, dungeon strategies, and boosting advice for World of Warcraft.",
  },
  alternates: { canonical: `${siteUrl}/guides` },
};

const guides = [
  {
    title: "Mythic+ Boosting Guide",
    description:
      "Everything you need to know about Mythic+ boosting on UPLINK — how to post a boost request, place bids, and choose a booster.",
    href: "/guides/mythic-plus-boosting",
    keywords: ["Mythic+", "M+", "boosting", "dungeon", "key"],
  },
];

export default function GuidesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/guides#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}/guides` },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/guides#collection`,
        name: "WoW Guides — UPLINK",
        description: "Mythic+ guides, leveling tips, dungeon strategies, and boosting advice.",
        url: `${siteUrl}/guides`,
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2">WoW Guides</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
            Learn how to find groups, post requests, and climb the leaderboard
          </p>
        </div>
        <div className="space-y-4">
          {guides.map((g) => (
            <Link key={g.href} href={g.href}>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00ffff]/30 transition-all group">
                <h2 className="text-lg font-black text-white group-hover:text-[#00ffff] transition-colors mb-2">
                  {g.title}
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">{g.description}</p>
                <div className="flex gap-2">
                  {g.keywords.map((kw) => (
                    <span key={kw} className="text-[8px] font-black bg-white/5 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
