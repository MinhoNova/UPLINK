"use client";

import { useState } from "react";
import Link from "next/link";
import { SPECS, getClassColor, getSpecData, type SpecData, type PlayerBuild } from "@/lib/wowData";
import WowTalentTreeDisplay from "@/components/wow/WowTalentTree";

export default function SpecDetailClient({ id }: { id: string }) {
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) return null;

  const color = getClassColor(spec.classId);
  const data = getSpecData(id);
  const [filterType, setFilterType] = useState<"all" | "raid" | "mythic+">("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
          <Link href="/wow/tier-list" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">← Back to Tier List</Link>
          <div className="flex items-center gap-4 mt-6 mb-10">
            <img src={spec.icon} alt={spec.name} className="w-16 h-16 rounded-2xl" style={{ backgroundColor: `${color}20` }} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{spec.name}</h1>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace("-", " ")} · {spec.role.toUpperCase()}</p>
            </div>
          </div>
          <div className="text-center py-12 text-gray-500 text-xs font-black uppercase tracking-widest">Build data coming soon for this spec.</div>
        </div>
      </div>
    );
  }

  const filteredBuilds = filterType === "all" ? data.builds : data.builds.filter((b) => b.type === filterType);

  const copyTalentString = async (str: string, index: number) => {
    try {
      await navigator.clipboard.writeText(str);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { /* fallback */ }
  };

  const buildTypeLabel = (type: "raid" | "mythic+"): string => type === "raid" ? "Raid" : "Mythic+";

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Link href="/wow/tier-list" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">← Back to Tier List</Link>

        {/* Spec Header with SEO-friendly text */}
        <div className="flex items-center gap-4 mt-6 mb-4">
          <img src={spec.icon} alt={`${spec.name} talents and build`} className="w-16 h-16 rounded-2xl" style={{ backgroundColor: `${color}20` }} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {spec.name} {spec.role === "tank" ? "Tank" : spec.role === "healer" ? "Healer" : "DPS"} Talents & Build
            </h1>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace("-", " ")} · {spec.role.toUpperCase()} · The War Within Season 1</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-8 max-w-2xl">
          Best {spec.name} talents and build for Mythic+ and Raid in TWW Season 1.
          View top player talent trees, BIS gear, enchants, gems, and stat priority.
          {spec.seo.map((kw) => ` ${kw}.`)}
        </p>

        {/* Build Type Filter */}
        <div className="flex items-center gap-2 mb-8">
          {(["all", "mythic+", "raid"] as const).map((type) => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${filterType === type ? "bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}>
              {type === "all" ? "All Builds" : type === "mythic+" ? "Mythic+" : "Raid"}
            </button>
          ))}
        </div>

        <div className="grid gap-6">
          {/* Talents Section — visually prominent like wowhead/murlok */}
          <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-base font-black text-white mb-1">
              {spec.name} Talents
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Talent trees from top {spec.classId.replace("-", " ")} players. Click to copy the import string.
            </p>

            {filteredBuilds.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-[10px] font-black uppercase tracking-widest">No {filterType} builds available for this spec yet.</div>
            )}

            <div className="space-y-6">
              {filteredBuilds.map((build, i) => {
                const buildIndex = data.builds.indexOf(build);
                return (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    {/* Player header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-xs font-black text-white">{build.player.charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{build.player}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${build.type === "raid" ? "bg-yellow-500/10 text-yellow-400" : "bg-[#ff007f]/10 text-[#ff007f]"}`}>{buildTypeLabel(build.type)}</span>
                        </div>
                        <span className="text-[9px] text-gray-500">{build.class} · {build.region} · Score: {build.score}</span>
                      </div>
                    </div>

                    {/* Copy talent string */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <code className="text-[8px] font-mono text-gray-400 bg-black/40 px-2 py-1.5 rounded-lg flex-1 truncate select-all border border-white/5">{build.talentString}</code>
                        <button onClick={() => copyTalentString(build.talentString, buildIndex)} className={`shrink-0 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${copiedIndex === buildIndex ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 hover:bg-[#00ffff]/20"}`}>
                          {copiedIndex === buildIndex ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[7px] text-gray-600 mt-1">Click Copy to import this talent build into WoW.</p>
                    </div>

                    {/* Talent trees visual */}
                    <WowTalentTreeDisplay trees={build.trees} color={color} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* BIS Gear */}
          <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-base font-black text-white mb-1">{spec.name} BIS Gear</h2>
            <p className="text-xs text-gray-500 mb-4">Best-in-slot gear for {spec.classId.replace("-", " ")} in Mythic+ and raid.</p>
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
            <h2 className="text-base font-black text-white mb-1">{spec.name} Enchants & Gems</h2>
            <p className="text-xs text-gray-500 mb-4">Recommended enchants and gems for {spec.classId.replace("-", " ")}.</p>
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
            <h2 className="text-base font-black text-white mb-1">{spec.name} Stat Priority</h2>
            <p className="text-xs text-gray-500 mb-4">Stat weights for {spec.role} {spec.classId.replace("-", " ")}.</p>
            <div className="flex flex-wrap gap-2">
              {data.statPriority.map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl px-4 py-2 text-xs font-black text-white border border-white/10">
                  {i + 1}. {stat}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


