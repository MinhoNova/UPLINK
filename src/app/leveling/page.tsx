import { getSiteUrl } from "@/lib/siteUrl";

export const metadata = {
  title: "Aion 2 Leveling — Find Leveling Squads | Aion 2 LFG",
  description: "Find leveling squads and boost groups for Aion 2. Join EU and NA leveling groups to power-level your character.",
  keywords: ["aion 2 leveling", "aion 2 boost", "aion 2 leveling squad", "aion 2 power level"],
};

export default function LevelingPage() {
  const siteUrl = getSiteUrl();
  return (
    <main className="min-h-screen bg-[#050814] text-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-4">Aion 2 Leveling</h1>
        <p className="text-slate-400 mb-8">Find leveling squads and boost groups for Aion 2.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl border border-cyan-500/20 bg-white/[0.03]">
            <h2 className="text-xl font-black text-white mb-3">Self-Leveling</h2>
            <p className="text-sm text-slate-400 mb-4">Find players to level alongside with.</p>
            <div className="flex gap-2">
              <a href="/lfg/eu/leveling" className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase">EU</a>
              <a href="/lfg/na/leveling" className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase">NA</a>
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-purple-500/20 bg-white/[0.03]">
            <h2 className="text-xl font-black text-white mb-3">Boost Services</h2>
            <p className="text-sm text-slate-400 mb-4">Find boosters who can power-level your character.</p>
            <a href="/" className="inline-block px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase">Browse Offers</a>
          </div>
        </div>
      </div>
    </main>
  );
}
