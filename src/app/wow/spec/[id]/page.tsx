import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, getClassColor, getSpecData } from "@/lib/wowData";

const siteUrl = getSiteUrl();

export async function generateStaticParams() {
  return SPECS.map((spec) => ({ id: spec.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) return { title: "Spec not found" };
  return {
    title: `${spec.name} — WoW Meta Builds, BIS Gear & Enchants | UPLINK`,
    description: `Best ${spec.name} build for Mythic+ and raid in The War Within. BIS gear, enchants, gems, stat priority, and talent builds from top players.`,
    openGraph: {
      title: `${spec.name} — WoW Meta Builds | UPLINK`,
      description: `BIS gear, enchants, gems, and talent builds for ${spec.name}.`,
    },
    alternates: { canonical: `${siteUrl}/wow/spec/${id}` },
  };
}

export default async function SpecDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) notFound();

  const color = getClassColor(spec.classId);
  const data = getSpecData(id);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Link href="/wow/tier-list" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">← Back to Tier List</Link>

        {/* Spec Header */}
        <div className="flex items-center gap-4 mt-6 mb-10">
          <img src={spec.icon} alt={spec.name} className="w-16 h-16 rounded-2xl" style={{ backgroundColor: `${color}20` }} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{spec.name}</h1>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace("-", " ")} · {spec.role.toUpperCase()}</p>
          </div>
        </div>

        {!data && (
          <div className="text-center py-12 text-gray-500 text-xs font-black uppercase tracking-widest">Build data coming soon for this spec.</div>
        )}

        {data && (
          <div className="grid gap-6">
            {/* BIS Gear */}
            <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
              <h2 className="text-base font-black text-white mb-1">BIS Gear</h2>
              <p className="text-xs text-gray-500 mb-4">Best-in-slot gear for Mythic+ and raid. Data sourced from top parses.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.bis.map((item) => (
                  <div key={item.slot} className="bg-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-gray-500 block uppercase tracking-wider">{item.slot}</span>
                      <span className="text-xs font-black text-white">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Enchants & Gems */}
            <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
              <h2 className="text-base font-black text-white mb-1">Enchants & Gems</h2>
              <p className="text-xs text-gray-500 mb-4">Recommended enchants and gems for optimal performance.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.enchants.map((item) => (
                  <div key={item.slot} className="bg-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{item.slot}</span>
                    <span className="text-xs font-black text-white">{item.name}</span>
                  </div>
                ))}
                {data.gems.map((g, i) => (
                  <div key={i} className="bg-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Gem</span>
                    <span className="text-xs font-black text-white">{g}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Stat Priority */}
            <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
              <h2 className="text-base font-black text-white mb-1">Stat Priority</h2>
              <p className="text-xs text-gray-500 mb-4">Stat weights and breakpoints for optimal performance.</p>
              <div className="flex flex-wrap gap-2">
                {data.statPriority.map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-xl px-4 py-2 text-xs font-black text-white border border-white/10">
                    {i + 1}. {stat}
                  </div>
                ))}
              </div>
            </section>

            {/* Talents from Top Players */}
            <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
              <h2 className="text-base font-black text-white mb-1">Talents from Top Players</h2>
              <p className="text-xs text-gray-500 mb-4">Talent builds used by top-rated players worldwide.</p>
              <div className="space-y-4">
                {data.talents.map((build, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-[10px] font-black text-white">{build.player.charAt(0)}</div>
                      <div>
                        <span className="text-sm font-black text-white">{build.player}</span>
                        <span className="text-[9px] text-gray-500 ml-2">{build.class} · {build.region}</span>
                      </div>
                      <div className="ml-auto text-right">
                        <span className="text-xs font-black text-white">{build.score}</span>
                        <span className="text-[7px] text-gray-500 block uppercase tracking-wider">Score</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {build.talents.map((talent) => (
                        <span key={talent} className="text-[10px] font-black bg-white/5 px-2 py-1 rounded-md text-gray-300 border border-white/5">{talent}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
