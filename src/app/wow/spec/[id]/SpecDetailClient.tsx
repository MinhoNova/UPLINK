"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swords, HeartHandshake, Shield, ChevronLeft, Medal, ChevronRight } from "lucide-react";
import { SPECS, getClassColor, getSpecData } from "@/lib/wowData";
import type { LeaderboardEntry } from "@/app/api/wow/leaderboard/route";

const MEDALS = ["🥇", "🥈", "🥉"];

const ROLE_META: Record<string, { label: string; icon: typeof Swords; color: string; bg: string }> = {
  dps: { label: "DPS", icon: Swords, color: "#ff4444", bg: "rgba(255,68,68,0.15)" },
  healer: { label: "Healer", icon: HeartHandshake, color: "#00cc66", bg: "rgba(0,204,102,0.15)" },
  tank: { label: "Tank", icon: Shield, color: "#4488ff", bg: "rgba(68,136,255,0.15)" },
};

const REGION_FLAGS: Record<string, string> = {
  US: "/flags/us.svg",
  EU: "/flags/eu.svg",
};

function playerProfileUrl(name: string, realm: string, region: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const params = new URLSearchParams({ realm, region });
  return `/wow/player/${slug}?${params.toString()}`;
}

export default function SpecDetailClient({ id, ptr }: { id: string; ptr?: boolean }) {
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) return null;

  const color = getClassColor(spec.classId);
  const data = getSpecData(id, ptr);

  const PAGE_SIZE = 5;
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/wow/leaderboard");
        if (!res.ok) return;
        const json = await res.json();
        const entries: LeaderboardEntry[] = json.entries || [];
        const filtered = entries
          .filter((e) => e.specId === id)
          .sort((a, b) => b.score - a.score)
          .map((e, i) => ({ ...e, rank: i + 1 }));
        setLeaderboardEntries(filtered);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    fetchData();
    setPage(1);
  }, [id]);

  const totalPages = Math.max(1, Math.ceil(leaderboardEntries.length / PAGE_SIZE));
  const visibleEntries = leaderboardEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const classSpecs = SPECS.filter((s) => s.classId === spec.classId);
  const roleMeta = ROLE_META[spec.role] || ROLE_META.dps;
  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(800px at 30% 15%, ${color}06 0%, transparent 60%), radial-gradient(500px at 70% 60%, ${color}04 0%, transparent 50%)` }} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Link href="/wow/tier-list" className="inline-flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors mb-8"><ChevronLeft className="w-3 h-3" /> Back to Tier List</Link>

        {/* Spec Switcher */}
        <div className="flex flex-wrap items-center gap-2 mb-10 p-2 rounded-2xl border border-white/5 bg-white/[0.02]">
          {classSpecs.map((cs) => {
            const csColor = getClassColor(cs.classId);
            const active = cs.id === id;
            const csRole = ROLE_META[cs.role] || ROLE_META.dps;
            const CsRoleIcon = csRole.icon;
            return (
              <Link key={cs.id} href={`/wow/spec/${cs.id}`} className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 ${active ? "bg-white/10 border border-white/10" : "border border-transparent hover:bg-white/[0.04]"}`}>
                <div className="relative">
                  <Image src={cs.icon} alt={cs.name} width={32} height={32} className={`rounded-lg transition-all duration-200 ${active ? "scale-110" : "group-hover:scale-105"}`} style={active ? { backgroundColor: `${csColor}25`, boxShadow: `0 0 15px ${csColor}30` } : {}} />
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
              <Image src={spec.icon} alt={`${spec.name} talents and build`} width={80} height={80} priority className="rounded-2xl shrink-0" style={{ backgroundColor: `${color}25`, boxShadow: `0 0 40px ${color}25` }} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: roleMeta.bg, color: roleMeta.color }}>
                    <RoleIcon className="w-2.5 h-2.5" /> {roleMeta.label}
                  </span>
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest" style={{ color: `${color}99` }}>{spec.classId.replace(/-/g, " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{spec.name}</h1>
                  {ptr && (
                    <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400 text-[8px] font-black uppercase tracking-widest">PTR S2</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Top players, BIS Gear, Enchants, Gems & Stat Priority — {spec.classId.replace(/-/g, " ")} Mythic+ Guide{ptr ? " (PTR Season 2 Preview)" : ""}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {spec.seo.slice(0, 4).map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[7px] font-black uppercase tracking-widest text-gray-600">{kw}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8">
          {/* ═══ TOP PLAYERS ═══ */}
          <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-1">
              <Medal className="w-5 h-5" style={{ color }} />
              <h2 className="text-lg font-black text-white">Top {spec.name} Players</h2>
            </div>
            <p className="text-xs text-gray-500 mb-6">Top Mythic+ players worldwide — click any player to view their full profile with talents and gear. Auto-updates every minute.</p>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl bg-white/[0.02] p-4 animate-pulse border border-white/5">
                    <div className="w-8 h-5 bg-white/10 rounded" />
                    <div className="w-10 h-10 bg-white/10 rounded-lg" />
                    <div className="flex-1"><div className="h-4 bg-white/10 rounded w-1/3 mb-1" /><div className="h-3 bg-white/10 rounded w-1/4" /></div>
                    <div className="w-14 h-4 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            ) : leaderboardEntries.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">No leaderboard data available for this spec yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  {visibleEntries.map((entry) => {
                    const flag = REGION_FLAGS[entry.region?.toUpperCase()] || null;
                    const profileUrl = playerProfileUrl(entry.name, entry.realm, entry.region);
                    return (
                      <Link
                        key={entry.rank}
                        href={profileUrl}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                      >
                        {/* Rank badge */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black" style={{
                          backgroundColor: entry.rank <= 3 ? `${color}25` : 'rgba(255,255,255,0.05)',
                          color: entry.rank <= 3 ? color : 'rgba(255,255,255,0.3)',
                          boxShadow: entry.rank <= 3 ? `0 0 12px ${color}20` : 'none',
                        }}>
                          {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
                        </div>

                        {/* Spec icon */}
                        <Image src={spec.icon} alt="" width={36} height={36} className="rounded-lg shrink-0" style={{ backgroundColor: `${color}25`, boxShadow: `0 0 12px ${color}15` }} />

                        {/* Player info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white group-hover:text-[#00ffff] transition-colors truncate">{entry.name}</span>
                            {flag && (
                              <Image src={flag} alt={entry.region} width={12} height={8} className="rounded-[1px] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] text-gray-500 truncate">{entry.realm}</span>
                            <span className="text-[5px] text-gray-600">·</span>
                            <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: `${color}99` }}>{spec.name}</span>
                            {entry.faction === "alliance" ? (
                              <span className="text-[8px] text-yellow-500/60">A</span>
                            ) : (
                              <span className="text-[8px] text-red-400/60">H</span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0 flex items-center gap-1.5">
                          <div className="leading-tight">
                            <div className="text-sm font-black tracking-tight" style={{ color }}>{entry.score.toLocaleString()}</div>
                            <div className="text-[6px] font-black text-gray-600 uppercase tracking-widest">rio</div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-all -mr-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {leaderboardEntries.length > PAGE_SIZE && (
                  <div className="flex items-center justify-center gap-1.5 pt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                          page === p
                            ? "bg-gradient-to-br from-[#00ffff] to-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.3)]"
                            : "bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* ═══ RECOMMENDED BUILDS ═══ */}
          {data && data.builds.length > 0 && (
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
              <h2 className="text-lg font-black text-white mb-1">Recommended Builds{ptr && <span className="ml-2 text-[9px] font-black text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 rounded tracking-wider">Projected S2</span>}</h2>
              <p className="text-xs text-gray-500 mb-4">Curated talent builds for {spec.classId.replace(/-/g, " ")}.</p>
              <div className="flex items-center gap-2 mb-6">
                {(["mythic+", "raid"] as const).map((type) => {
                  const count = data.builds.filter((b) => b.type === type).length;
                  return (
                    <Link key={type} href={`/wow/player/${data.builds.find((b) => b.type === type)?.player?.toLowerCase().replace(/\s+/g, "-") || ""}?realm=&region=`} className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent">
                      {type === "mythic+" ? "Mythic+" : "Raid"} ({count})
                    </Link>
                  );
                })}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.builds.map((build, i) => (
                  <Link
                    key={i}
                    href={playerProfileUrl(build.player, "", build.region)}
                    className="group bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0" style={{ backgroundColor: `${color}20` }}>{build.player.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white group-hover:text-[#00ffff] transition-colors">{build.player}</span>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${build.type === "raid" ? "bg-yellow-500/10 text-yellow-400" : "bg-[#ff007f]/10 text-[#ff007f]"}`}>{build.type === "raid" ? "Raid" : "Mythic+"}</span>
                        </div>
                        <span className="text-[9px] text-gray-500">{build.class} · Score: {build.score.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {build.trees.flatMap((t) => t.nodes.filter((n) => n.selected).slice(0, 4)).map((node, ni) => (
                        <span key={ni} className="px-1.5 py-0.5 rounded text-[6px] font-bold border border-white/5 bg-white/[0.03] text-gray-400">{node.name}</span>
                      ))}
                      <span className="px-1.5 py-0.5 rounded text-[6px] font-black text-[#00ffff] border border-[#00ffff]/20">View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* BIS Gear */}
          {data && (
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
              <h2 className="text-lg font-black text-white mb-1">{spec.name} BIS Gear{ptr && <span className="ml-2 text-[9px] font-black text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 rounded tracking-wider">Projected S2</span>}</h2>
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
          )}

          {/* Enchants & Gems */}
          {data && (
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
              <h2 className="text-lg font-black text-white mb-1">{spec.name} Enchants & Gems{ptr && <span className="ml-2 text-[9px] font-black text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 rounded tracking-wider">Projected S2</span>}</h2>
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
          )}

          {/* Stat Priority */}
          {data && (
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
              <h2 className="text-lg font-black text-white mb-1">{spec.name} Stat Priority{ptr && <span className="ml-2 text-[9px] font-black text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 rounded tracking-wider">Projected S2</span>}</h2>
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
          )}
        </div>
      </div>
    </div>
  );
}
