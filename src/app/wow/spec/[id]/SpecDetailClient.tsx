"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swords, HeartHandshake, Shield, ChevronLeft, Medal, ChevronRight, Crown, Shirt, SquareStack, HandMetal, Footprints, CircleDot, Sparkles, BookOpen, Gem, Rows3, Link as LinkChain, WandSparkles } from "lucide-react";
import { SPECS, getClassColor, getSpecData, mergeAggregatedData, CLASS_NAMES } from "@/lib/wowData";
import type { AggregatedSpecData } from "@/lib/wowData";
import type { LeaderboardEntry } from "@/app/api/wow/leaderboard/route";
import type { ItemDetail } from "@/lib/blizzard/item-detail";
import CharacterAvatar from "@/components/wow/CharacterAvatar";
import WowTalentTreeDisplay from "@/components/wow/WowTalentTree";
import ClassSidebar from "@/components/wow/ClassSidebar";

const MEDALS = ["🥇", "🥈", "🥉"];

const QUALITY_COLORS: Record<number, string> = {
  1: "#9d9d9d", 2: "#1eff00", 3: "#0070dd", 4: "#a335ee", 5: "#ff8000", 6: "#e6cc80", 7: "#00ccff",
};

const QUALITY_BORDERS: Record<number, string> = {
  1: "#9d9d9d60", 2: "#1eff0060", 3: "#0070dd60", 4: "#a335ee60", 5: "#ff800060", 6: "#e6cc8060", 7: "#00ccff60",
};

const ROLE_META: Record<string, { label: string; icon: typeof Swords; color: string; bg: string }> = {
  dps: { label: "DPS", icon: Swords, color: "#ff4444", bg: "rgba(255,68,68,0.15)" },
  healer: { label: "Healer", icon: HeartHandshake, color: "#00cc66", bg: "rgba(0,204,102,0.15)" },
  tank: { label: "Tank", icon: Shield, color: "#4488ff", bg: "rgba(68,136,255,0.15)" },
};

const REGION_FLAGS: Record<string, string> = {
  US: "/flags/us.svg",
  EU: "/flags/eu.svg",
};

const GEAR_SLOT_ICONS: Record<string, any> = {
  Head: Crown, Neck: CircleDot, Shoulders: Shirt, Back: SquareStack, Chest: Shield,
  Wrist: CircleDot, Hands: HandMetal, Waist: LinkChain, Legs: Rows3, Feet: Footprints,
  "Ring 1": Gem, "Ring 2": Gem, "Trinket 1": Sparkles, "Trinket 2": Sparkles,
  Weapon: Swords, "Off-Hand": BookOpen,
};

function ItemTooltip({ detail, style }: { detail: ItemDetail; style?: React.CSSProperties }) {
  const qualityColor = QUALITY_COLORS[detail.quality?.id || 0] || "#ffffff";
  const qualityBorder = QUALITY_BORDERS[detail.quality?.id || 0] || "#ffffff30";

  return (
    <div className="absolute z-50 w-[280px] pointer-events-none" style={style}>
      <div className="rounded-xl overflow-hidden" style={{ background: "#0f0f1a", border: `1.5px solid ${qualityBorder}`, boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 20px ${qualityColor}15` }}>
        <div className="flex gap-3 px-3.5 pt-3.5 pb-2">
          {detail.iconUrl && (
            <div className="w-[52px] h-[52px] shrink-0 rounded-lg overflow-hidden" style={{ border: `2px solid ${qualityBorder}` }}>
              <img src={detail.iconUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-[13px] font-bold leading-tight truncate" style={{ color: qualityColor }}>{detail.name}</div>
            {detail.level > 0 && <div className="text-[11px] text-gray-400 mt-0.5">Item Level {detail.level}</div>}
          </div>
        </div>
        {detail.stats.length > 0 && (
          <>
            <div className="h-px mx-3.5" style={{ background: `linear-gradient(90deg, transparent, ${qualityColor}20, transparent)` }} />
            <div className="px-3.5 py-2 space-y-0.5">
              {detail.stats.map((s, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="text-gray-300">{s.name}</span>
                  <span className="font-bold text-white">+{s.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {detail.set && detail.set.bonuses.length > 0 && (
          <>
            <div className="h-px mx-3.5" style={{ background: `linear-gradient(90deg, transparent, ${qualityColor}20, transparent)` }} />
            <div className="px-3.5 py-2">
              <div className="text-[10px] font-bold text-green-400 mb-1.5 tracking-wider uppercase">{detail.set.name}</div>
              {detail.set.bonuses.map((b, i) => (
                <div key={i} className="flex gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-green-400 shrink-0">({(i + 1) * 2})</span>
                  <span className="text-[10px] text-gray-300 leading-relaxed">{b.description}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="px-3.5 py-2 bg-black/30">
          <div className="text-[9px] text-gray-500">{detail.itemClass}{detail.itemSubclass ? ` — ${detail.itemSubclass}` : ""}{detail.inventoryType ? ` — ${detail.inventoryType}` : ""}</div>
          {detail.requiredLevel > 0 && <div className="text-[9px] text-gray-600">Requires Level {detail.requiredLevel}</div>}
        </div>
      </div>
    </div>
  );
}

function BisItemIcon({ slot, color, itemId, itemName, size = 64 }: { slot: string; color: string; itemId?: number; itemName?: string; size?: number }) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const query = itemId
      ? `type=item&id=${itemId}`
      : itemName
        ? `type=item&name=${encodeURIComponent(itemName)}`
        : null;
    if (!query) return;
    fetch(`/api/wow/blizzard/icon?${query}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.available) setIconUrl(d.url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [itemId, itemName]);

  const SlotIcon = GEAR_SLOT_ICONS[slot];
  return (
    <div className="rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-lg" style={{ width: size, height: size, backgroundColor: `${color}15`, border: `1px solid ${color}25`, boxShadow: `0 0 12px ${color}10` }}>
      {iconUrl ? (
        <Image src={iconUrl} alt="" width={size} height={size} className="w-full h-full object-cover" unoptimized />
      ) : SlotIcon ? (
        <SlotIcon className="w-6 h-6" style={{ color: `${color}bb` }} />
      ) : (
        <Gem className="w-6 h-6" style={{ color: `${color}bb` }} />
      )}
    </div>
  );
}

function playerProfileUrl(name: string, realm: string, region: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const params = new URLSearchParams({ realm, region });
  return `/wow/player/${slug}?${params.toString()}`;
}

function specBanner(id: string): string {
  return id.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("_");
}

export default function SpecDetailClient({ id, ptr }: { id: string; ptr?: boolean }) {
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) return null;

  const color = getClassColor(spec.classId);

  const PAGE_SIZE = 5;
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [buildFilter, setBuildFilter] = useState<"all" | "mythic+" | "raid">("all");
  const [aggData, setAggData] = useState<AggregatedSpecData | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);
  const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const detailCache = useRef<Map<number, ItemDetail>>(new Map());
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = mergeAggregatedData(id, aggData, ptr);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [lbRes, metaRes] = await Promise.all([
          fetch("/api/wow/leaderboard"),
          fetch(`/api/wow/blizzard-meta?spec=${id}&ptr=${ptr ? 1 : 0}`),
        ]);
        if (lbRes.ok) {
          const json = await lbRes.json();
          const entries: LeaderboardEntry[] = json.entries || [];
          const filtered = entries
            .filter((e) => e.specId === id)
            .sort((a, b) => b.score - a.score)
            .map((e, i) => ({ ...e, rank: i + 1 }));
          setLeaderboardEntries(filtered);
        }
        if (metaRes.ok) {
          const json = await metaRes.json();
          if (json.spec) setAggData(json.spec);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    fetchData();
    setPage(1);
  }, [id, ptr]);

  const totalPages = Math.max(1, Math.ceil(leaderboardEntries.length / PAGE_SIZE));
  const visibleEntries = leaderboardEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const classSpecs = SPECS.filter((s) => s.classId === spec.classId);
  const roleMeta = ROLE_META[spec.role] || ROLE_META.dps;
  const RoleIcon = roleMeta.icon;

  const handleItemHover = useCallback((itemId: number | undefined, e: React.MouseEvent) => {
    if (!itemId) return;
    setHoveredItemId(itemId);
    const cached = detailCache.current.get(itemId);
    if (cached) {
      setItemDetail(cached);
    } else {
      fetchTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/wow/blizzard/item/detail?id=${itemId}`);
          if (res.ok) {
            const detail: ItemDetail = await res.json();
            detailCache.current.set(itemId, detail);
            setItemDetail(detail);
          }
        } catch {}
      }, 300);
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({ top: rect.top - 10, left: rect.right + 12 });
  }, []);

  const handleItemLeave = useCallback(() => {
    setHoveredItemId(null);
    setItemDetail(null);
    setTooltipPos(null);
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
  }, []);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <ClassSidebar />
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(800px at 30% 15%, ${color}06 0%, transparent 60%), radial-gradient(500px at 70% 60%, ${color}04 0%, transparent 50%)` }} />

      {/* Full-width Spec Hero Banner */}
      <div className="relative w-full h-[220px] sm:h-[320px] lg:h-[400px] overflow-hidden bg-black/60 lg:ml-[200px]" style={{ width: "calc(100% - 200px)" }}>
        <Image
          src={`/wow/banners/${specBanner(spec.id)}.webp`}
          alt={spec.name}
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/10 to-transparent" />
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-8 right-4">
          <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow-2xl" style={{ textShadow: `0 2px 20px ${color}80, 0 2px 8px #000` }}>
            {spec.name}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl drop-shadow-lg mt-1" style={{ textShadow: "0 1px 8px #000" }}>
            Mythic+ guide, BIS gear, talents, enchants & gems
          </p>
        </div>
      </div>

      <div className="relative z-10 lg:ml-[220px] max-w-4xl mx-auto px-4 pt-6 sm:pt-8 pb-12">
        <Link href="/wow/tier-list" className="inline-flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors mb-8 mt-4"><ChevronLeft className="w-3 h-3" /> Back to Tier List</Link>

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

                        {/* Character render */}
                        <CharacterAvatar name={entry.name} realm={entry.realm} region={entry.region} specIcon={spec.icon} classColor={color} size={36} />

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
                {(["all", "mythic+", "raid"] as const).map((type) => {
                  const count = type === "all" ? data.builds.length : data.builds.filter((b) => b.type === type).length;
                  const active = buildFilter === type;
                  return (
                    <button key={type} onClick={() => setBuildFilter(type)} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${active ? "bg-white/10 text-white border-white/10" : "bg-white/5 text-gray-400 hover:bg-white/10 border-transparent"}`}>
                      {type === "all" ? "All" : type === "mythic+" ? "Mythic+" : "Raid"} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3">
                {data.builds.filter((b) => buildFilter === "all" || b.type === buildFilter).map((build, i) => (
                  <Link
                    key={i}
                    href={playerProfileUrl(build.player, "", build.region)}
                    className="block group bg-white/[0.03] rounded-2xl p-5 border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Image src={spec.icon} alt="" width={36} height={36} className="rounded-lg shrink-0" style={{ backgroundColor: `${color}25`, boxShadow: `0 0 12px ${color}15` }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white group-hover:text-[#00ffff] transition-colors">{build.player}</span>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${build.type === "raid" ? "bg-yellow-500/10 text-yellow-400" : "bg-[#ff007f]/10 text-[#ff007f]"}`}>{build.type === "raid" ? "Raid" : "Mythic+"}</span>
                        </div>
                        <span className="text-[9px] text-gray-500">{build.class} · Score: {build.score.toLocaleString()}</span>
                      </div>
                      <span className="text-[8px] font-black text-[#00ffff] border border-[#00ffff]/20 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">View Full Profile →</span>
                    </div>
                    <WowTalentTreeDisplay trees={build.trees} color={color} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* BIS Gear — ranked by top 50 players */}
          {data && (
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
              <h2 className="text-lg font-black text-white mb-1">{spec.name} BIS Gear{ptr && <span className="ml-2 text-[9px] font-black text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 rounded tracking-wider">Projected S2</span>}</h2>
              <p className="text-xs text-gray-500 mb-6">Gear rankings based on top 50 Mythic+ players. Orange = most popular, galaxy mauve = alternative.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.bis.map((slot) => {
                  const primary = slot.options?.[0];
                  const secondary = slot.options?.[1];
                  const allUsePrimary = primary && primary.pct >= 100;
                  return (
                    <div key={slot.slot} className="bg-black/60 rounded-2xl p-4 border border-white/[0.04] hover:border-white/10 transition-all">
                      <div className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-4 text-center">{slot.slot}</div>
                      {primary && (
                        <div
                          className="rounded-xl p-4 transition-all cursor-pointer mb-2"
                          style={{ background: "#0a0a14", border: "1px solid rgba(249,115,22,0.15)" }}
                          onMouseEnter={(e) => handleItemHover(primary.itemId, e)}
                          onMouseLeave={handleItemLeave}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <BisItemIcon slot={slot.slot} color={color} itemId={primary.itemId} itemName={primary.name} size={64} />
                            <span className="text-[11px] font-bold text-center leading-tight truncate max-w-full" style={{ color: "#f97316" }}>{primary.name}</span>
                            {(slot.slot === "Head" || slot.slot === "Shoulders" || slot.slot === "Chest" || slot.slot === "Hands" || slot.slot === "Legs") && (
                              <span className="text-[6px] font-black text-yellow-500 bg-yellow-500/15 border border-yellow-500/30 px-1.5 py-0.5 rounded tracking-widest uppercase">Tier</span>
                            )}
                            <div className="w-full flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${primary.pct}%`, background: "linear-gradient(90deg, #f97316, #fb923c)" }} />
                              </div>
                              <span className="text-[9px] font-black shrink-0" style={{ color: "#f97316" }}>{primary.count}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {secondary && !allUsePrimary && (
                        <div
                          className="rounded-xl p-4 transition-all cursor-pointer"
                          style={{ background: "#0a0a14", border: "1px solid rgba(192,132,252,0.15)" }}
                          onMouseEnter={(e) => handleItemHover(secondary.itemId, e)}
                          onMouseLeave={handleItemLeave}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <BisItemIcon slot={slot.slot} color={color} itemId={secondary.itemId} itemName={secondary.name} size={64} />
                            <span className="text-[11px] font-bold text-center leading-tight truncate max-w-full" style={{ color: "#c084fc" }}>{secondary.name}</span>
                            <div className="w-full flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${secondary.pct}%`, background: "linear-gradient(90deg, #c084fc, #d8b4fe)" }} />
                              </div>
                              <span className="text-[9px] font-black shrink-0" style={{ color: "#c084fc" }}>{secondary.count}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="text-[6px] font-black text-gray-600 uppercase tracking-widest mb-1.5 text-center">Top 5</div>
                        <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
                          {leaderboardEntries.slice(0, 5).map((entry, i) => (
                            <Link
                              key={entry.name}
                              href={playerProfileUrl(entry.name, entry.realm, entry.region)}
                              className="flex items-center gap-1 text-[8px] text-gray-500 hover:text-white transition-colors"
                            >
                              <span className="font-black" style={{ color: i < 3 ? "#f97316" : "rgba(255,255,255,0.2)" }}>{i + 1}.</span>
                              <span className="truncate max-w-[60px]">{entry.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {hoveredItemId && itemDetail && tooltipPos && (
                <div style={{ position: "fixed", top: tooltipPos.top, left: tooltipPos.left, zIndex: 9999 }}>
                  <ItemTooltip detail={itemDetail} />
                </div>
              )}
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
                    <div key={item.slot} className="group bg-[#0c0c18]/80 rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between hover:bg-[#0c0c18] hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}>
                          <WandSparkles className="w-4 h-4" style={{ color: `${color}99` }} />
                        </div>
                        <span className="text-[8px] font-black tracking-wider" style={{ color: `${color}88` }}>{item.slot}</span>
                      </div>
                      <span className="text-xs font-black text-white">{item.name}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {data.gems.map((g, i) => (
                    <div key={i} className="group bg-[#0c0c18]/80 rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between hover:bg-[#0c0c18] hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}>
                          <Gem className="w-4 h-4" style={{ color: `${color}99` }} />
                        </div>
                        <span className="text-[8px] font-black tracking-wider" style={{ color: `${color}88` }}>Gem {i + 1}</span>
                      </div>
                      <span className="text-xs font-black text-white leading-tight text-right max-w-[200px]">{g}</span>
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
              <p className="text-xs text-gray-500 mb-6">Stat weights for {spec.role} {spec.classId.replace(/-/g, " ")} — higher bar = higher priority.</p>
              <div className="space-y-3">
                {data.statPriority.map((stat, i) => {
                  const pct = 100 - i * 18;
                  const statColors = ["#f97316", "#c084fc", "#ffffff", "#9ca3af", "#6b7280"];
                  const barColor = statColors[i] || "#6b7280";
                  const barGrad = i === 0 ? "linear-gradient(90deg, #f97316, #fb923c)" : i === 1 ? "linear-gradient(90deg, #c084fc, #d8b4fe)" : `linear-gradient(90deg, ${color}88, ${color}40)`;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-5 text-[10px] font-black text-gray-500 shrink-0 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{stat}</span>
                          <span className="text-[9px] font-black" style={{ color: barColor }}>{pct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden" style={{ border: `1px solid ${color}15` }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${color}40)`, boxShadow: `0 0 8px ${color}30` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
