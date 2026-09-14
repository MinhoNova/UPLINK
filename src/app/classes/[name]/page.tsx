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

export async function generateStaticParams() {
  return AION2_CLASSES.map((c) => ({ name: c.name.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string> } }): Promise<Metadata> {
  const { name } = await params;
  const cls = AION2_CLASSES.find((c) => c.name.toLowerCase() === name);
  if (!cls) return { title: "Class Not Found" };
  const siteUrl = getSiteUrl();
  return {
    title: `${cls.name} — ${cls.role} | Aion 2 LFG`,
    description: `${cls.name} (${cls.role}) - ${cls.desc} Find ${cls.name} LFG groups, boosting, and community on Aion 2 LFG.`,
    keywords: [
      `aion 2 ${cls.name.toLowerCase()}`,
      `aion2 ${cls.name.toLowerCase()}`,
      `${cls.name.toLowerCase()} lfg`,
      `${cls.name.toLowerCase()} guide`,
      `${cls.name.toLowerCase()} ${cls.role.toLowerCase()}`,
    ],
    openGraph: {
      title: `${cls.name} — ${cls.role} | Aion 2 LFG`,
      description: cls.desc,
      type: "article",
      url: `${siteUrl}/classes/${cls.name.toLowerCase()}`,
    },
    alternates: { canonical: `${siteUrl}/classes/${cls.name.toLowerCase()}` },
  };
}

export default async function ClassPage({ params }: { params: Promise<{ name: string> } }) {
  const { name } = await params;
  const cls = AION2_CLASSES.find((c) => c.name.toLowerCase() === name);
  if (!cls) return <div>Class not found</div>;

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${cls.name} — ${cls.role} | Aion 2 LFG`,
    description: cls.desc,
    url: `${siteUrl}/classes/${cls.name.toLowerCase()}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/classes/${cls.name.toLowerCase()}`,
    },
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
        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 mb-6">
          {cls.role}
        </span>
        <p className="text-sm leading-relaxed text-slate-300 max-w-2xl mb-8">{cls.desc}</p>
        <h2 className="text-xl font-black uppercase tracking-widest text-white mb-4">Find {cls.name} LFG Groups</h2>
        <p className="text-sm leading-relaxed text-slate-400 max-w-2xl">
          Looking for a {cls.name} for your dungeon, raid, or PvP squad? Post an offer on Aion 2 LFG and let the best {cls.name} players apply to your group. Join our Discord community to coordinate runs in real-time.
        </p>
      </div>
    </main>
  );
}
