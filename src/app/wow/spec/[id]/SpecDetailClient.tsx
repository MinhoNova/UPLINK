"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swords, HeartHandshake, Shield, ChevronLeft, Crown, Shirt, SquareStack, HandMetal, Footprints, CircleDot, Sparkles, BookOpen, Gem, Rows3, Link as LinkChain, WandSparkles } from "lucide-react";
import { SPECS, getClassColor, getSpecData, mergeAggregatedData, CLASS_NAMES, aggregatePlayerTalents, type TalentTree } from "@/lib/wowData";
import type { AggregatedSpecData } from "@/lib/wowData";
import type { ItemDetail } from "@/lib/blizzard/item-detail";
import CharacterAvatar from "@/components/wow/CharacterAvatar";
import WowAggregatedTalentTree from "@/components/wow/WowAggregatedTalentTree";
import ClassSidebar from "@/components/wow/ClassSidebar";

const RANK_COLORS = ["#ff6d00", "#a335ee", "#a0a0a0"];

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

const GEAR_SLOT_ICONS: Record<string, any> = {
  Head: Crown, Neck: CircleDot, Shoulders: Shirt, Back: SquareStack, Chest: Shield,
  Wrist: CircleDot, Hands: HandMetal, Waist: LinkChain, Legs: Rows3, Feet: Footprints,
  "Ring 1": Gem, "Ring 2": Gem, "Trinket 1": Sparkles, "Trinket 2": Sparkles,
  Weapon: Swords, "Off-Hand": BookOpen,
};

function ItemTooltip({ detail, users, style }: { detail: ItemDetail; users?: string[]; style?: React.CSSProperties }) {
  const qualityColor = QUALITY_COLORS[detail.quality?.id || 0] || "#ffffff";
  const qualityBorder = QUALITY_BORDERS[detail.quality?.id || 0] || "#ffffff30";

  return (
    <div className="absolute z-50 w-[290px] pointer-events-none" style={style}>
      <div className="rounded-xl overflow-hidden" style={{ background: "#0f0f1a", border: `1.5px solid ${qualityBorder}`, boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 20px ${qualityColor}15` }}>
        <div className="flex gap-3 px-3.5 pt-3.5 pb-2">
          {detail.iconUrl && (
            <div className="w-[52px] h-[52px] shrink-0 rounded-lg overflow-hidden" style={{ border: `2px solid ${qualityBorder}`, boxShadow: `0 0 12px ${qualityColor}15` }}>
              <img src={detail.iconUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-[13px] font-bold leading-tight truncate" style={{ color: qualityColor }}>{detail.name}</div>
            {detail.level > 0 && <div className="text-[11px] text-gray-400 mt-0.5">Item Level {detail.level}</div>}
      </div>
      {users && users.length > 0 && (
        <div className="mt-1 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-3 py-2">
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Top Players Using This Item</div>
            <div className="flex flex-wrap gap-1">
              {users.map((name, i) => (
                <span key={name} className="text-[11px] font-bold text-white/80 bg-white/5 px-1.5 py-0.5 rounded">{name}</span>
              ))}
            </div>
          </div>
        </div>
      )}
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

const itemIconCache = new Map<string, string>();
function BisItemIcon({ slot, color, itemId, itemName, size = 80 }: { slot: string; color: string; itemId?: number; itemName?: string; size?: number }) {
  const cacheKey = itemId ? `item:${itemId}` : itemName ? `item:${itemName}` : "";
  const cached = cacheKey ? itemIconCache.get(cacheKey) : undefined;
  const [iconUrl, setIconUrl] = useState<string | null>(cached || null);
  useEffect(() => {
    if (!cacheKey || cached) return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const query = itemId ? `type=item&id=${itemId}` : `type=item&name=${encodeURIComponent(itemName!)}`;
    fetch(`/api/wow/blizzard/icon?${query}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        clearTimeout(timer);
        if (!cancelled && d.available && d.url) {
          itemIconCache.set(cacheKey, d.url);
          setIconUrl(d.url);
        }
      })
      .catch(() => { clearTimeout(timer); });
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [cacheKey, cached, itemId, itemName]);

  const SlotIcon = GEAR_SLOT_ICONS[slot];
  return (
    <div
      className="rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size, height: size,
        backgroundColor: `${color}10`,
        border: `2px solid ${color}30`,
        boxShadow: `0 0 20px ${color}15, 0 4px 12px rgba(0,0,0,0.3)`,
      }}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="" className="w-full h-full object-cover" />
      ) : SlotIcon ? (
        <SlotIcon className="w-8 h-8" style={{ color: `${color}bb` }} />
      ) : (
        <Gem className="w-8 h-8" style={{ color: `${color}bb` }} />
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
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [aggData, setAggData] = useState<AggregatedSpecData | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);
  const [hoveredItemUsers, setHoveredItemUsers] = useState<string[]>([]);
  const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const detailCache = useRef<Map<number, ItemDetail>>(new Map());
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = mergeAggregatedData(id, aggData, ptr);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const metaRes = await fetch(`/api/wow/blizzard-meta?spec=${id}&ptr=${ptr ? 1 : 0}`);
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

  const playerEntries: ({ name: string; realm: string; region: string; score: number; specId: string; classId: string; faction: string; race?: string; rank: number; itemLevel?: number })[] =
    (aggData?.players || [])
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        name: p.name,
        realm: p.realm,
        region: p.region,
        score: p.score,
        specId: p.specId || id,
        classId: p.classId,
        faction: "horde",
        race: p.race,
        rank: i + 1,
        itemLevel: p.itemLevel,
      }));
  const totalPages = Math.max(1, Math.ceil(playerEntries.length / PAGE_SIZE));
  const visibleEntries = playerEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const classSpecs = SPECS.filter((s) => s.classId === spec.classId);
  const roleMeta = ROLE_META[spec.role] || ROLE_META.dps;
  const RoleIcon = roleMeta.icon;

  const handleItemHover = useCallback((itemId: number | undefined, e: React.MouseEvent) => {
    if (!itemId) return;
    setHoveredItemId(itemId);
    const users = (aggData?.topPlayers || [])
      .filter((p) => p.gear?.some((g) => g.itemId === itemId))
      .map((p) => p.name)
      .slice(0, 8);
    setHoveredItemUsers(users);
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
    setHoveredItemUsers([]);
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

      <div className="relative z-10 lg:ml-[220px] max-w-6xl mx-auto px-4 pt-20 lg:pt-28 pb-12">
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
          <section>
            <h2 className="text-2xl font-black text-white mb-4">Top {spec.name} Players</h2>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.04] bg-[#0c0c18] p-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-4 bg-white/8 rounded shrink-0" />
                      <div className="w-9 h-9 bg-white/8 rounded-lg shrink-0" />
                      <div className="flex-1"><div className="h-4 bg-white/8 rounded w-1/3 mb-1.5" /><div className="h-3 bg-white/8 rounded w-1/5" /></div>
                      <div className="w-14 h-4 bg-white/8 rounded shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : playerEntries.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">No leaderboard data available for this spec yet.</p>
              </div>
            ) : (
              <>
                 <div className="flex flex-col gap-3 w-full lg:w-1/3 mx-auto">
                  {visibleEntries.map((entry) => {
                    const profileUrl = playerProfileUrl(entry.name, entry.realm, entry.region);
                    const rankColor = entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "#a0a0a0";
                    return (
                      <Link
                        key={entry.rank}
                        href={profileUrl}
                        className="group block bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 hover:bg-white/[0.06] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-sm font-black shrink-0" style={{ color: rankColor }}>#{entry.rank}</span>
                              <span className="text-sm font-bold leading-tight truncate" style={{ color: "#fff" }}>{entry.name}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">
                              {entry.realm} ({entry.region})
                              {entry.race ? <span> · {entry.race}</span> : null}
                              {entry.itemLevel ? <span> | {entry.itemLevel} ilvl</span> : null}
                            </div>
                          </div>
                          <CharacterAvatar name={entry.name} realm={entry.realm} region={entry.region} specIcon={spec.icon} classColor={color} size={72} free />
                          <div className="shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center min-w-[60px]">
                            <div className="text-sm font-black leading-none" style={{ color: rankColor }}>{entry.score.toLocaleString()}</div>
                            <div className="text-[7px] font-black text-gray-600 uppercase tracking-wider mt-0.5">Rating</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {playerEntries.length > PAGE_SIZE && (
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

          {/* ═══ POPULAR TALENTS ═══ */}
          {data && data.builds.length > 0 && (() => {
            const hardcodedData = getSpecData(id, !!ptr);
            const baseTrees: TalentTree[] = hardcodedData?.builds[0]?.trees || data.builds[0]?.trees || [];
            const aggregatedTrees = aggregatePlayerTalents(aggData?.topPlayers, baseTrees);
            if (aggregatedTrees.length === 0) return null;
            const totalPlayers = aggData?.topPlayers?.length || 0;
            return (
            <section className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-[2rem] p-6 sm:p-8">
              <h2 className="text-lg font-black text-white mb-1">Popular Talents{ptr && <span className="ml-2 text-[9px] font-black text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 rounded tracking-wider">Projected S2</span>}</h2>
              <p className="text-xs text-gray-500 mb-4">
                {totalPlayers > 0
                  ? `Talent popularity from top ${totalPlayers} ${spec.name} M+ players — orange = most selected, dim = rarely used.`
                  : `Talent guide for ${spec.name} — all recommended picks shown.`}
              </p>
              <WowAggregatedTalentTree trees={aggregatedTrees} color={color} />
            </section>
            );
          })()}

          {/* BIS Gear — banner style */}
          {data && data.bis.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-1">{spec.name} BIS Gear{ptr && <span className="ml-2 text-[9px] font-black text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 rounded tracking-wider">Projected S2</span>}</h2>
              <p className="text-xs text-gray-500 mb-6">Gear rankings based on top 50 Mythic+ players. Orange = most popular, galaxy mauve = alternative.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                {data.bis.map((slot) => {
                  return (
                    <div key={slot.slot}>
                      <div className="text-xs font-black text-white/90 uppercase tracking-[0.15em] mb-3">{slot.slot}</div>
                      {(slot.options || []).map((opt, idx) => (
                        <div
                          key={opt.itemId || idx}
                          className="flex items-start gap-3 cursor-pointer mb-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 hover:bg-white/[0.06] transition-colors"
                          onMouseEnter={(e) => handleItemHover(opt.itemId, e)}
                          onMouseLeave={handleItemLeave}
                        >
                          <BisItemIcon slot={slot.slot} color={color} itemId={opt.itemId} itemName={opt.name} size={56} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold leading-tight truncate" style={{ color: idx === 0 ? "#f97316" : "#c084fc" }}>{opt.name}</span>
                              {(slot.slot === "Head" || slot.slot === "Shoulders" || slot.slot === "Chest" || slot.slot === "Hands" || slot.slot === "Legs") && (
                                <span className="shrink-0 text-[6px] font-black text-yellow-500 bg-yellow-500/15 border border-yellow-500/30 px-1.5 py-0.5 rounded tracking-widest uppercase">Tier</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-3 rounded-md bg-white/5 overflow-hidden">
                                <div className="h-full rounded-md" style={{ width: `${opt.pct}%`, background: idx === 0 ? "linear-gradient(90deg, #f97316, #fb923c)" : "linear-gradient(90deg, #c084fc, #d8b4fe)" }} />
                              </div>
                              <span className="text-[10px] font-black shrink-0" style={{ color: idx === 0 ? "#f97316" : "#c084fc" }}>{opt.count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {hoveredItemId && itemDetail && tooltipPos && (
                <div style={{ position: "fixed", top: tooltipPos.top, left: tooltipPos.left, zIndex: 9999 }}>
                  <ItemTooltip detail={itemDetail} users={hoveredItemUsers} />
                </div>
              )}
            </section>
          )}

          {/* Enchants & Gems */}
          {data && (data.enchants.length > 0 || data.gems.length > 0) && (
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
