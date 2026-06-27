"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Swords, HeartHandshake, Shield, ChevronLeft } from "lucide-react";
import { SPECS, getClassColor, getSpecData, type SpecData, type PlayerBuild } from "@/lib/wowData";
import WowTalentTreeDisplay from "@/components/wow/WowTalentTree";

const ROLE_META: Record<string, { label: string; icon: typeof Swords; color: string; bg: string }> = {
  dps: { label: "DPS", icon: Swords, color: "#ff4444", bg: "rgba(255,68,68,0.15)" },
  healer: { label: "Healer", icon: HeartHandshake, color: "#00cc66", bg: "rgba(0,204,102,0.15)" },
  tank: { label: "Tank", icon: Shield, color: "#4488ff", bg: "rgba(68,136,255,0.15)" },
};

export default function SpecDetailClient({ id }: { id: string }) {
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) return null;

  const color = getClassColor(spec.classId);
  const data = getSpecData(id);
  const [filterType, setFilterType] = useState<"all" | "raid" | "mythic+">("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const classSpecs = SPECS.filter((s) => s.classId === spec.classId);
  const roleMeta = ROLE_META[spec.role] || ROLE_META.dps;
  const RoleIcon = roleMeta.icon;

  const copyTalentString = async (str: string, index: number) => {
    try {
      await navigator.clipboard.writeText(str);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { /* fallback */ }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white">
        <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(600px at 30% 20%, ${color}08 0%, transparent 70%)` }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
          <Link href="/wow/tier-list" className="inline-flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"><ChevronLeft className="w-3 h-3" /> Back to Tier List</Link>
          <div className="flex items-center gap-4 mt-6 mb-10">
            <img src={spec.icon} alt={spec.name} className="w-16 h-16 rounded-2xl" style={{ backgroundColor: `${color}25`, boxShadow: `0 0 30px ${color}20` }} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{spec.name}</h1>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace(/-/g, " ")} · {spec.role.toUpperCase()}</p>
            </div>
          </div>
          <div className="text-center py-12 text-gray-500 text-xs font-black uppercase tracking-widest">Build data coming soon for this spec.</div>
        </div>
      </div>
    );
  }

  const filteredBuilds = filterType === "all" ? data.builds : data.builds.filter((b) => b.type === filterType);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(800px at 30% 15%, ${color}06 0%, transparent 60%), radial-gradient(500px at 70% 60%, ${color}04 0%, transparent 50%)` }} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Link href="/wow/tier-list" className="inline-flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors mb-8"><ChevronLeft className="w-3 h-3" /> Back to Tier List</Link>

        {/* Spec Switcher — all specs of this class */}
        <div className="flex flex-wrap items-center gap-2 mb-10 p-2 rounded-2xl border border-white/5 bg-white/[0.02]">
          {classSpecs.map((cs) => {
            const csColor = getClassColor(cs.classId);
            const active = cs.id === id;
            const csRole = ROLE_META[cs.role] || ROLE_META.dps;
            const CsRoleIcon = csRole.icon;
            return (
              <Link key={cs.id} href={`/wow/spec/${cs.id}`} className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 ${active ? "bg-white/10 border border-white/10" : "border border-transparent hover:bg-white/[0.04]"}`}>
                <div className="relative">
                  <img src={cs.icon} alt={cs.name} className={`w-8 h-8 rounded-lg transition-all duration-200 ${active ? "scale-110" : "group-hover:scale-105"}`} style={active ? { backgroundColor: `${csColor}25`, boxShadow: `0 0 15px ${csColor}30` } : {}} />
                  {active && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ backgroundColor: csColor }} />}
                </div>
                <div className="min-w-0">
                  <div className={`text-[11px] font-bold leading-tight truncate max-w-[120px] ${active ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>{cs.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CsRoleIcon className="w-2.5 h-2.5" style={{ color: csRole.color }} />
                    <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: csRole.color }}>{csRole.label}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Spec Header */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#0c0c18] via-[#0a0a14] to-black mb-8">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 50%)` }} />
          <div className="relative px-7 py-8">
            <div className="flex items-center gap-5 mb-4">
              <img src={spec.icon} alt={`${spec.name} talents and build`} className="w-20 h-20 rounded-2xl shrink-0" style={{ backgroundColor: `${color}25`, boxShadow: `0 0 40px ${color}25` }} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: roleMeta.bg, color: roleMeta.color }}>
                    <RoleIcon className="w-2.5 h-2.5" /> {roleMeta.label}
                  </span>
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest" style={{ color: `${color}99` }}>{spec.classId.replace(/-/g, " ")}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">{spec.name}</h1>
                <p className="text-xs text-gray-500 mt-1">Talents, BIS Gear, Enchants, Gems & Stat Priority — {spec.classId.replace(/-/g, " ")} Mythic+ Guide</p>
              </div>
            </div>
            {/* SEO keywords */}
            <div className="flex flex-wrap gap-1.5">
              {spec.seo.slice(0, 4).map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[7px] font-black uppercase tracking-widest text-gray-600">{kw}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Build Type Filter */}
        <div className="flex items-center gap-2 mb-8">
          {(["all", "mythic+", "raid"] as const).map((type) => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${filterType === type ? "bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}>
              {type === "all" ? "All Builds" : type === "mythic+" ? "Mythic+" : "Raid"}
            </button>
          ))}
        </div>

        <div className="grid gap-8">
          {/* Talents */}
          <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-1">{spec.name} Talents</h2>
            <p className="text-xs text-gray-500 mb-6">Talent trees from top {spec.classId.replace(/-/g, " ")} players.</p>

            {filteredBuilds.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-[10px] font-black uppercase tracking-widest">No {filterType} builds available for this spec yet.</div>
            )}

            <div className="space-y-6">
              {filteredBuilds.map((build, i) => {
                const buildIndex = data.builds.indexOf(build);
                return (
                  <div key={i} className="bg-white/[0.03] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ backgroundColor: `${color}20` }}>{build.player.charAt(0)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{build.player}</span>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${build.type === "raid" ? "bg-yellow-500/10 text-yellow-400" : "bg-[#ff007f]/10 text-[#ff007f]"}`}>{build.type === "raid" ? "Raid" : "Mythic+"}</span>
                          </div>
                          <span className="text-[9px] text-gray-500">{build.class} · {build.region} · Score: {build.score.toLocaleString()}</span>
                        </div>
                      </div>
                      <button onClick={() => copyTalentString(build.talentString, buildIndex)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border ${copiedIndex === buildIndex ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-[#00ffff]/5 text-[#00ffff] border-[#00ffff]/20 hover:bg-[#00ffff]/10"}`}>
                        {copiedIndex === buildIndex ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedIndex === buildIndex ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <WowTalentTreeDisplay trees={build.trees} color={color} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* BIS Gear */}
          <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-1">{spec.name} BIS Gear</h2>
            <p className="text-xs text-gray-500 mb-6">Best-in-slot gear for {spec.classId.replace(/-/g, " ")}.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {data.bis.map((item) => (
                <div key={item.slot} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition">
                  <div>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider block">{item.slot}</span>
                    <span className="text-sm font-black text-white">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Enchants & Gems */}
          <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-1">{spec.name} Enchants & Gems</h2>
            <p className="text-xs text-gray-500 mb-6">Recommended enchants and gems.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="space-y-2">
                {data.enchants.map((item) => (
                  <div key={item.slot} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider">{item.slot}</span>
                    <span className="text-xs font-black text-white">{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {data.gems.map((g, i) => (
                  <div key={i} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider">Gem {i + 1}</span>
                    <span className="text-xs font-black text-white">{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stat Priority */}
          <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-1">{spec.name} Stat Priority</h2>
            <p className="text-xs text-gray-500 mb-6">Stat weights for {spec.role} {spec.classId.replace(/-/g, " ")}.</p>
            <div className="flex flex-wrap gap-2">
              {data.statPriority.map((stat, i) => (
                <div key={i} className="bg-white/[0.05] rounded-xl px-5 py-3 text-sm font-black text-white border border-white/10 flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-black">{i + 1}.</span>
                  {stat}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
