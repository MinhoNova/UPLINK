import { getSiteUrl } from "@/lib/siteUrl";

export const metadata = {
  title: "PvP LFG — Find Abyss Points Squads | Aion 2 LFG",
  description: "Find PvP squads for Abyss Points farming, Arena battles, and faction warfare. Join EU and NA PvP groups on Aion 2 LFG.",
  keywords: ["aion 2 pvp", "abyss points farm", "aion 2 arena", "aion 2 pvp lfg"],
};

export default function PvPPage() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Aion 2 PvP LFG",
    url: `${siteUrl}/pvp`,
  };

  return (
    <main className="min-h-screen bg-[#050814] text-slate-200 py-12 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-4">PvP LFG — Abyss Points & Arena</h1>
        <p className="text-slate-400 mb-8">Find PvP squads for Abyss Points farming, Arena battles, and faction warfare.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <a href="/lfg/eu/pvp" className="p-6 rounded-2xl border border-cyan-500/20 bg-white/[0.03] hover:border-cyan-400/40 transition-all">
            <h2 className="text-xl font-black text-white mb-2">EU PvP</h2>
            <p className="text-sm text-slate-400">Find PvP squads on European servers</p>
          </a>
          <a href="/lfg/na/pvp" className="p-6 rounded-2xl border border-cyan-500/20 bg-white/[0.03] hover:border-cyan-400/40 transition-all">
            <h2 className="text-xl font-black text-white mb-2">NA PvP</h2>
            <p className="text-sm text-slate-400">Find PvP squads on North American servers</p>
          </a>
        </div>
      </div>
    </main>
  );
}
