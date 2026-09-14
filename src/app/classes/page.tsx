import { getSiteUrl } from "@/lib/siteUrl";

const AION2_CLASSES = [
  { name: "Templar", role: "Tank" },
  { name: "Gladiator", role: "DPS" },
  { name: "Assassin", role: "DPS" },
  { name: "Ranger", role: "DPS" },
  { name: "Sorcerer", role: "DPS" },
  { name: "Spiritmaster", role: "DPS" },
  { name: "Chanter", role: "Healer/Support" },
  { name: "Cleric", role: "Healer" },
];

export const metadata = {
  title: "Aion 2 Classes — Guide & LFG | Aion 2 LFG",
  description: "Complete guide to all Aion 2 classes. Find LFG groups for Templar, Gladiator, Assassin, Ranger, Sorcerer, Spiritmaster, Chanter, and Cleric.",
  keywords: ["aion 2 classes", "aion 2 tank", "aion 2 healer", "aion 2 dps"],
};

export default function ClassesPage() {
  const siteUrl = getSiteUrl();
  return (
    <main className="min-h-screen bg-[#050814] text-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-4">Aion 2 Classes</h1>
        <p className="text-slate-400 mb-8">Complete guide to all 8 Aion 2 classes.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AION2_CLASSES.map((cls) => (
            <div key={cls.name} className="p-5 rounded-2xl border border-cyan-500/20 bg-white/[0.03]">
              <h2 className="text-lg font-black text-white mb-1">{cls.name}</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{cls.role}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
