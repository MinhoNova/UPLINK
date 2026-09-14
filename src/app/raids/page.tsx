import { getSiteUrl } from "@/lib/siteUrl";

const RAIDS = [
  { name: "Beritra Brigade Fortress", level: "65+" },
  { name: "Abyssal Forge: Ludra", level: "65+" },
];

export const metadata = {
  title: "Aion 2 Raids — Find Raid Groups | Aion 2 LFG",
  description: "Find raid groups for Beritra Brigade Fortress, Abyssal Forge: Ludra, and more.",
  keywords: ["aion 2 raids", "beritra brigade fortress", "abyssal forge ludra", "aion 2 raid lfg"],
};

export default function RaidsPage() {
  const siteUrl = getSiteUrl();
  return (
    <main className="min-h-screen bg-[#050814] text-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-4">Aion 2 Raids</h1>
        <p className="text-slate-400 mb-8">Find raid groups for the hardest Aion 2 content.</p>
        <div className="space-y-3">
          {RAIDS.map((r) => (
            <div key={r.name} className="p-4 rounded-2xl border border-cyan-500/20 bg-white/[0.03] flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h2 className="text-lg font-black text-white">{r.name}</h2>
                <p className="text-sm text-slate-400">Level {r.level}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/lfg/eu/raids?raid=${encodeURIComponent(r.name)}`} className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase">EU</a>
                <a href={`/lfg/na/raids?raid=${encodeURIComponent(r.name)}`} className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase">NA</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
