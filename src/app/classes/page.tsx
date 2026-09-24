import { notFound } from "next/navigation";
import { getSiteUrl } from "@/lib/siteUrl";
import type { Metadata } from "next";

const AION2_CLASSES = [
  { name: "Templar", role: "Tank", desc: "Heavy armor tank with sword and shield. Templars absorb damage and protect the squad in dungeons and raids." },
  { name: "Gladiator", role: "DPS", desc: "Dual-wielding melee DPS with polymorph burst. Gladiators excel at single-target damage and AoE cleave." },
  { name: "Assassin", role: "DPS", desc: "Stealth melee DPS with high burst damage. Assassins can ambush targets and chain critical strikes." },
  { name: "Ranger", role: "DPS", desc: "Ranged physical DPS with trap utility. Rangers kite enemies and deal sustained damage from distance." },
  { name: "Sorcerer", role: "DPS", desc: "Ranged magic DPS with AoE and crowd control. Sorcerers deal massive elemental damage." },
  { name: "Spiritmaster", role: "DPS", desc: "Ranged magic DPS with pet companion. Spiritmasters summon spirits to fight alongside them." },
  { name: "Chanter", role: "Healer/Support", desc: "Healer and support class with buffs. Chanters heal allies and empower the squad with battle hymns." },
  { name: "Cleric", role: "Healer", desc: "Primary healer with strong healing and resurrection. Clerics keep the squad alive through any encounter." },
];

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ name?: string }> }): Promise<Metadata> {
  const sp = await searchParams;
  const name = sp?.name?.toLowerCase();
  if (!name) return { title: "Classes — Aion 2 LFG" };
  const cls = AION2_CLASSES.find((c) => c.name.toLowerCase() === name);
  if (!cls) return { title: "Class Not Found" };
  const siteUrl = getSiteUrl();
  return {
    title: `${cls.name} — ${cls.role} | Aion 2 LFG`,
    description: `${cls.name} (${cls.role}) - ${cls.desc} Find ${cls.name} LFG groups on Aion 2 LFG.`,
    alternates: { canonical: `${siteUrl}/classes?name=${name}` },
  };
}

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const sp = await searchParams;
  const name = sp?.name?.toLowerCase();

  if (!name) {
    return (
      <main className="min-h-screen bg-[#050814] text-slate-200 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-4">Aion 2 Classes</h1>
          <p className="text-slate-400 mb-8">Complete guide to all 8 Aion 2 classes.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AION2_CLASSES.map((cls) => (
              <a key={cls.name} href={`/classes?name=${cls.name.toLowerCase()}`} className="p-5 rounded-2xl border border-cyan-500/20 bg-white/[0.03] hover:border-cyan-400/40 transition-all">
                <h2 className="text-lg font-black text-white mb-1">{cls.name}</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{cls.role}</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const cls = AION2_CLASSES.find((c) => c.name.toLowerCase() === name);
  if (!cls) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${cls.name} — ${cls.role} | Aion 2 LFG`,
    description: cls.desc,
    url: `${siteUrl}/classes?name=${name}`,
  };

  return (
    <main className="min-h-screen bg-[#050814] text-slate-200 py-12 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto">
        <nav className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
          <a href="/" className="hover:text-cyan-300">Home</a>
          <span className="mx-2">/</span>
          <a href="/classes" className="hover:text-cyan-300">Classes</a>
          <span className="mx-2">/</span>
          <span className="text-cyan-300">{cls.name}</span>
        </nav>
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">{cls.name}</h1>
        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 mb-6">{cls.role}</span>
        <p className="text-sm leading-relaxed text-slate-300 max-w-2xl mb-8">{cls.desc}</p>
        <h2 className="text-xl font-black uppercase tracking-widest text-white mb-4">Find {cls.name} LFG Groups</h2>
        <p className="text-sm leading-relaxed text-slate-400 max-w-2xl">
          Looking for a {cls.name} for your dungeon or raid squad? Post an offer on Aion 2 LFG and let the best {cls.name} players apply.
        </p>
      </div>
    </main>
  );
}
