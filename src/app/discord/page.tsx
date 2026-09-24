import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getDiscordInviteUrl } from "@/lib/discordConstants";
import { Users, MessageSquare, Star, Sparkles, Shield } from "lucide-react";

const siteUrl = getSiteUrl();
const inviteUrl = getDiscordInviteUrl();

export const metadata: Metadata = {
  title: "Discord Server — Aion 2 LFG",
  description:
    "Join the official Aion 2 LFG Discord community server. Find squads, coordinate runs, claim your class colour roles and chat with other Aion 2 players — free and open to all.",
  openGraph: {
    title: "Aion 2 LFG — Discord Server",
    description:
      "Join the Aion 2 LFG Discord community: squads, runs, class roles, and a place for every Aion 2 player. Fan community, not affiliated with NCSOFT.",
    siteName: "Aion 2 LFG",
    type: "website",
    url: `${siteUrl}/discord`,
  },
  alternates: { canonical: `${siteUrl}/discord` },
};

export default function DiscordServerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/discord#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Discord Server", item: `${siteUrl}/discord` },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/discord`,
        url: `${siteUrl}/discord`,
        name: "Aion 2 LFG — Discord Server",
        description: "Join the Aion 2 LFG Discord community server for squads, runs, and class colour roles.",
        isPartOf: { "@type": "WebSite", "@id": `${siteUrl}#website` },
      },
    ],
  };

  const features = [
    { icon: Users, title: "Find Your Squad", desc: "Dungeons, raids, leveling and profession squads — LFG right from Discord." },
    { icon: Star, title: "Class Colour Roles", desc: "Pick your Aion 2 class colour and playstyle role on join." },
    { icon: MessageSquare, title: "Active Community", desc: "Chat, share runs and coordinate with other Aion 2 players." },
  ];

  return (
    <main className="relative min-h-screen bg-[#050814] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-xs font-black uppercase tracking-[0.3em] text-blue-300/70">
          The Aion 2 LFG Community
        </p>
        <h1 className="mt-2 text-center text-3xl font-black uppercase tracking-[0.12em] text-white sm:text-4xl">
          Aion 2 LFG — Discord Server
        </h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-400">
          {siteUrl.replace("https://", "")} — find squads for dungeons, raids and leveling, claim your
          class colour role, and chat with fellow Aion 2 players.
        </p>

        <div className="mt-8 rounded-3xl border border-[#5865F2]/30 bg-[#0a0f26]/60 p-8 text-center backdrop-blur-md">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#5865F2]/40 bg-[#5865F2]/15">
            <Users className="h-8 w-8 text-[#aab8ff]" />
          </span>
          <h2 className="mt-4 text-lg font-black uppercase tracking-[0.18em] text-white">AION2LFG</h2>
          <p className="mt-2 text-xs text-slate-400">
            Fan-run community server — we are not affiliated with, endorsed by, or connected to NCSOFT or AION.
          </p>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-[#5865F2]/50 bg-[#141b3d] px-10 py-3.5 text-xs font-black uppercase tracking-[0.25em] text-[#aab8ff] transition-all hover:border-[#5865F2] hover:bg-[#1d2752] hover:text-white hover:shadow-[0_0_35px_rgba(88,101,242,0.4)]"
          >
            Join the Discord Server
            <Sparkles className="h-4 w-4" />
          </a>
          <p className="mt-3 inline-block text-xs text-slate-500">{inviteUrl}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <Icon className="h-5 w-5 text-blue-300" />
                <h3 className="mt-3 text-xs font-black uppercase tracking-[0.15em] text-white">{f.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
      <link rel="me" href={inviteUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}