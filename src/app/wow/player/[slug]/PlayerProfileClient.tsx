"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Copy, Check, ChevronLeft, Swords, HeartHandshake, Shield, ExternalLink } from "lucide-react";
import { getClassColor, type WoWSpec, type SpecData, type PlayerBuild } from "@/lib/wowData";
import type { LeaderboardEntry } from "@/app/api/wow/leaderboard/route";
import WowTalentTreeDisplay from "@/components/wow/WowTalentTree";

const MEDALS = [
  { emoji: "🥇", label: "1st", color: "#FFD700" },
  { emoji: "🥈", label: "2nd", color: "#C0C0C0" },
  { emoji: "🥉", label: "3rd", color: "#CD7F32" },
];

const REGION_FLAGS: Record<string, string> = {
  US: "/flags/us.svg",
  EU: "/flags/eu.svg",
};

const ROLE_META: Record<string, { label: string; icon: typeof Swords; color: string; bg: string }> = {
  dps: { label: "DPS", icon: Swords, color: "#ff4444", bg: "rgba(255,68,68,0.15)" },
  healer: { label: "Healer", icon: HeartHandshake, color: "#00cc66", bg: "rgba(0,204,102,0.15)" },
  tank: { label: "Tank", icon: Shield, color: "#4488ff", bg: "rgba(68,136,255,0.15)" },
};

function MedalBadge({ rank }: { rank: number }) {
  if (rank < 1 || rank > 3) return null;
  const medal = MEDALS[rank - 1];
  return (
    <div className="relative">
      <div className="text-3xl sm:text-4xl drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]" style={{ filter: `drop-shadow(0 0 12px ${medal.color}60)` }}>
        {medal.emoji}
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: medal.color }}>
        {medal.label}
      </div>
    </div>
  );
}

function RegionFlag({ region }: { region: string }) {
  const flag = REGION_FLAGS[region?.toUpperCase()] || null;
  if (!flag) return <span className="text-[10px] font-black text-gray-500">{region}</span>;
  return (
    <Image src={flag} alt={region} width={20} height={14} className="rounded-sm inline-block" />
  );
}

export default function PlayerProfileClient({
  player, spec, specData, seasonDisplay,
}: {
  player: LeaderboardEntry;
  spec: WoWSpec | null;
  specData: SpecData | null;
  seasonDisplay: string;
}) {
  const color = getClassColor(spec?.classId || player.classId);
  const [filterType, setFilterType] = useState<"all" | "raid" | "mythic+">("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const playerBuilds = specData?.builds?.filter(
    (b) => b.player?.toLowerCase() === player.name?.toLowerCase()
  ) || [];

  const specBuilds = specData?.builds || [];
  const filteredBuilds = filterType === "all" ? specBuilds : specBuilds.filter((b) => b.type === filterType);

  const copyTalentString = async (str: string, index: number) => {
    try {
      await navigator.clipboard.writeText(str);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { /* fallback */ }
  };

  const rank = player.rank;
  const roleMeta = spec ? ROLE_META[spec.role] || ROLE_META.dps : ROLE_META.dps;
  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(800px at 30% 15%, ${color}06 0%, transparent 60%), radial-gradient(500px at 70% 60%, ${color}04 0%, transparent 50%)` }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Back + Breadcrumb */}
        <Link href="/wow/leaderboard" className="inline-flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-3 h-3" /> Back to Leaderboard
        </Link>

        {/* ── Hero Card ── */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#0c0c18] via-[#0a0a14] to-black mb-8">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}10 0%, transparent 50%)` }} />
          <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04]" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />

          <div className="relative px-6 sm:px-8 py-8">
            <div className="flex items-center gap-6">
              {/* Character Render + Spec Icon */}
              {spec && (
                <div className="relative shrink-0 flex -space-x-3">
                  {/* Character render */}
                  <div className="w-[80px] h-[80px] rounded-2xl overflow-hidden border border-white/10 bg-black/40 z-10" style={{ boxShadow: `0 0 30px ${color}20` }}>
                    <img
                      src={`https://render.raider.io/character/${player.region?.toLowerCase()}/${player.realm?.toLowerCase().replace(/\s+/g, "-")}/${player.name?.toLowerCase()}.png`}
                      alt=""
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  </div>
                  {/* Spec icon overlay */}
                  <div className="relative z-20 -ml-6 mt-auto mb-0.5">
                    <Image src={spec.icon} alt={spec.name} width={36} height={36} className="rounded-lg border-2 border-[#05050a]" style={{ backgroundColor: `${color}30` }} />
                  </div>
                  {rank >= 1 && rank <= 3 && (
                    <div className="absolute -top-2 left-1/2 z-30">
                      <MedalBadge rank={rank} />
                    </div>
                  )}
                </div>
              )}

              {/* Player Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{player.name}</h1>
                  {rank <= 10 && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
                      #{rank}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {/* Spec + Class */}
                  {spec && (
                    <span className="text-xs font-bold" style={{ color: `${color}bb` }}>
                      {spec.name}
                    </span>
                  )}
                  {/* Role badge */}
                  {spec && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: roleMeta.bg, color: roleMeta.color }}>
                      <RoleIcon className="w-2.5 h-2.5" /> {roleMeta.label}
                    </span>
                  )}
                  {/* Realm */}
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
                    {player.realm}
                  </span>
                  {/* Region flag */}
                  <RegionFlag region={player.region} />
                  {/* Season */}
                  {seasonDisplay && (
                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">
                      {seasonDisplay}
                    </span>
                  )}
                </div>

                {/* Score display */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                  <div>
                    <div className="text-2xl font-black" style={{ color }}>{player.score.toLocaleString()}</div>
                    <div className="text-[7px] font-black text-gray-600 uppercase tracking-widest">Mythic+ Score</div>
                  </div>
                  <div className="w-px h-8 bg-white/5" />
                  <div>
                    <div className="text-lg font-black text-white">{player.region}</div>
                    <div className="text-[7px] font-black text-gray-600 uppercase tracking-widest">Region</div>
                  </div>
                  <div className="w-px h-8 bg-white/5" />
                  <div>
                    <div className="text-lg font-black text-white truncate max-w-[150px]">{player.faction.charAt(0).toUpperCase() + player.faction.slice(1)}</div>
                    <div className="text-[7px] font-black text-gray-600 uppercase tracking-widest">Faction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Spec Link ── */}
        {spec && (
          <Link
            href={`/wow/spec/${spec.id}`}
            className="flex items-center justify-between px-5 py-3 rounded-xl mb-8 transition-all border border-white/5 hover:border-white/10 bg-white/[0.02] group"
            style={{ borderColor: `${color}20` }}
          >
            <div className="flex items-center gap-3">
              <Image src={spec.icon} alt={spec.name} width={32} height={32} className="rounded-lg" style={{ backgroundColor: `${color}20` }} />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#00ffff] transition-colors">
                  {spec.name} Guide
                </div>
                <div className="text-[8px] text-gray-500 font-black uppercase tracking-widest">
                  Full talent builds, BIS gear, enchants & more
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors shrink-0" />
          </Link>
        )}

        {/* ── Active Builds Section ── */}
        {specData && (
          <>
            {/* Build Type Filter */}
            <div className="flex items-center gap-2 mb-6">
              {(["all", "mythic+", "raid"] as const).map((type) => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filterType === type ? "bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}>
                  {type === "all" ? "All Builds" : type === "mythic+" ? "Mythic+" : "Raid"}
                </button>
              ))}
            </div>

            {/* Player's Own Build Highlight */}
            {playerBuilds.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl border-2 border-dashed" style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}>
                <div className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color }}>✦ This Player's Build{playerBuilds.length > 1 ? "s" : ""}</div>
                <div className="space-y-4">
                  {playerBuilds.map((build, i) => (
                    <div key={i} className="bg-black/40 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{build.type === "mythic+" ? "Mythic+" : "Raid"} Build</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${build.type === "raid" ? "bg-yellow-500/10 text-yellow-400" : "bg-[#ff007f]/10 text-[#ff007f]"}`}>{build.type === "raid" ? "Raid" : "Mythic+"}</span>
                        </div>
                        <button onClick={() => copyTalentString(build.talentString, i)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all border ${copiedIndex === i ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-[#00ffff]/5 text-[#00ffff] border-[#00ffff]/20 hover:bg-[#00ffff]/10"}`}>
                          {copiedIndex === i ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                          {copiedIndex === i ? "Copied!" : "Copy Talents"}
                        </button>
                      </div>
                      <WowTalentTreeDisplay trees={build.trees} color={color} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Spec Builds */}
            {filteredBuilds.length > 0 && (
              <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8 mb-8">
                <h2 className="text-lg font-black text-white mb-1">{spec?.name || "Spec"} Talents</h2>
                <p className="text-xs text-gray-500 mb-6">Top talent builds for this spec.</p>
                <div className="space-y-4">
                  {filteredBuilds.map((build, i) => {
                    const isPlayer = build.player?.toLowerCase() === player.name?.toLowerCase();
                    const buildIndex = specData.builds.indexOf(build);
                    return (
                      <div key={i} className={`rounded-2xl p-4 border transition ${isPlayer ? "border-[#00ffff]/30 bg-[#00ffff]/5" : "bg-white/[0.03] border-white/5 hover:border-white/10"}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0" style={{ backgroundColor: `${color}20` }}>{build.player.charAt(0)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">{build.player}</span>
                                {isPlayer && <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-[#00ffff]/10 text-[#00ffff] uppercase tracking-wider">Active</span>}
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${build.type === "raid" ? "bg-yellow-500/10 text-yellow-400" : "bg-[#ff007f]/10 text-[#ff007f]"}`}>{build.type === "raid" ? "Raid" : "Mythic+"}</span>
                              </div>
                              <span className="text-[9px] text-gray-500">{build.class} · {build.region} · Score: {build.score.toLocaleString()}</span>
                            </div>
                          </div>
                          <button onClick={() => copyTalentString(build.talentString, buildIndex)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all border ${copiedIndex === buildIndex ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-[#00ffff]/5 text-[#00ffff] border-[#00ffff]/20 hover:bg-[#00ffff]/10"}`}>
                            {copiedIndex === buildIndex ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            {copiedIndex === buildIndex ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <WowTalentTreeDisplay trees={build.trees} color={color} />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* BIS Gear */}
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8 mb-8">
              <h2 className="text-lg font-black text-white mb-1">BIS Gear</h2>
              <p className="text-xs text-gray-500 mb-6">Best-in-slot gear for {spec?.classId?.replace(/-/g, " ") || ""}.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {specData.bis.map((item) => (
                  <div key={item.slot} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition">
                    <div>
                      <span className="text-[7px] font-black text-gray-500 uppercase tracking-wider block">{item.slot}</span>
                      <span className="text-sm font-black text-white">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Enchants & Gems */}
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8 mb-8">
              <h2 className="text-lg font-black text-white mb-1">Enchants & Gems</h2>
              <p className="text-xs text-gray-500 mb-6">Recommended enchants and gems.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <div className="space-y-2">
                  {specData.enchants.map((item) => (
                    <div key={item.slot} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between">
                      <span className="text-[7px] font-black text-gray-500 uppercase tracking-wider">{item.slot}</span>
                      <span className="text-xs font-black text-white">{item.name}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {specData.gems.map((g, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between">
                      <span className="text-[7px] font-black text-gray-500 uppercase tracking-wider">Gem {i + 1}</span>
                      <span className="text-xs font-black text-white">{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Stat Priority */}
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8 mb-8">
              <h2 className="text-lg font-black text-white mb-1">Stat Priority</h2>
              <p className="text-xs text-gray-500 mb-6">Stat weights for {spec?.role || ""} {spec?.classId?.replace(/-/g, " ") || ""}.</p>
              <div className="flex flex-wrap gap-2">
                {specData.statPriority.map((stat, i) => (
                  <div key={i} className="bg-white/[0.05] rounded-xl px-5 py-3 text-sm font-black text-white border border-white/10 flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-black">{i + 1}.</span>
                    {stat}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {!specData && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest">No build data available for this spec yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
