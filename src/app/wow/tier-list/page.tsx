"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SPECS, getClassColor } from "@/lib/wowData";
import { Swords, HeartHandshake, Shield, AlertCircle } from "lucide-react";

const ROLES = [
  { id: "dps", label: "DPS", icon: Swords },
  { id: "healer", label: "Healer", icon: HeartHandshake },
  { id: "tank", label: "Tank", icon: Shield },
] as const;

const TIERS = ["S", "A", "B", "C", "D", "F"] as const;

const TIER_META: Record<string, { color: string; bg: string; pillarBg: string; label: string }> = {
  S: { color: "#ff8c00", bg: "rgba(255,140,0,0.12)", pillarBg: "rgba(255,140,0,0.25)", label: "S" },
  A: { color: "#9b59b6", bg: "rgba(155,89,182,0.12)", pillarBg: "rgba(155,89,182,0.25)", label: "A" },
  B: { color: "#3498db", bg: "rgba(52,152,219,0.12)", pillarBg: "rgba(52,152,219,0.25)", label: "B" },
  C: { color: "#2ecc71", bg: "rgba(46,204,113,0.12)", pillarBg: "rgba(46,204,113,0.25)", label: "C" },
  D: { color: "#ffffff", bg: "rgba(255,255,255,0.06)", pillarBg: "rgba(255,255,255,0.12)", label: "D" },
  F: { color: "#888888", bg: "rgba(136,136,136,0.12)", pillarBg: "rgba(136,136,136,0.25)", label: "F" },
};

interface MetaSpec {
  id: string;
  score: number;
  highestKey: string;
  tier: string;
}

function SpecCard({ spec, score, highestKey, tier }: { spec: { id: string; name: string; classId: string; icon: string }; score: number; highestKey: string; tier: string }) {
  const color = getClassColor(spec.classId);
  return (
    <Link
      href={`/wow/spec/${spec.id}`}
      className="group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 min-w-[260px] flex-1 sm:flex-none overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}12 0%, ${color}06 40%, #0c0c18 70%)`,
        border: `1.5px solid ${color}30`,
        boxShadow: `0 0 0 0 ${color}00, inset 0 1px 0 ${color}10`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}80`;
        e.currentTarget.style.boxShadow = `0 0 30px ${color}25, inset 0 1px 0 ${color}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}30`;
        e.currentTarget.style.boxShadow = `0 0 0 0 ${color}00, inset 0 1px 0 ${color}10`;
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(200px at 40% 50%, ${color}15 0%, transparent 70%)` }} />
      <div className="relative z-10 flex items-center gap-3 w-full">
        <div className="relative shrink-0">
          <img src={spec.icon} alt={spec.name} className="w-10 h-10 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}20` }} />
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: `inset 0 0 15px ${color}40` }} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-wider mb-0.5" style={{ backgroundColor: `${color}25`, color }}>
            {spec.classId.replace(/-/g, " ")}
          </span>
          <div className="text-sm font-bold text-white truncate">{spec.name}</div>
        </div>
        <div className="text-right shrink-0 flex items-center gap-3 z-10">
          <div>
            <div className="text-[10px] font-black leading-none" style={{ color: `${color}bb` }}>+{highestKey}</div>
            <div className="text-[6px] font-black text-gray-600 uppercase tracking-widest">KEY</div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: `${color}20` }} />
          <div>
            <div className="text-base font-black leading-none" style={{ color }}>{score > 0 ? score.toLocaleString() : "—"}</div>
            <div className="text-[6px] font-black text-gray-600 uppercase tracking-widest mt-0.5">SCORE</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonSpecCard() {
  return (
    <div className="flex items-center gap-3 bg-[#0c0c18] rounded-xl px-4 py-3 min-w-[260px] flex-1 sm:flex-none animate-pulse" style={{ border: "1.5px solid rgba(255,255,255,0.06)" }}>
      <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
      <div className="flex-1"><div className="h-3 w-16 bg-white/10 rounded mb-1" /><div className="h-4 w-28 bg-white/10 rounded" /></div>
      <div className="text-right flex items-center gap-3"><div className="h-8 w-10 bg-white/10 rounded" /><div className="h-8 w-14 bg-white/10 rounded" /></div>
    </div>
  );
}

export default function WowTierListPage() {
  const [activeRole, setActiveRole] = useState<string>("dps");
  const [data, setData] = useState<Record<string, MetaSpec[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seasonDisplay, setSeasonDisplay] = useState("");

  async function fetchData() {
    try {
      const res = await fetch("/api/wow/meta-classes");
      if (!res.ok) return;
      const json = await res.json();
      if (json.roles) {
        const grouped: Record<string, MetaSpec[]> = {};
        for (const role of ["dps", "healer", "tank"]) grouped[role] = json.roles[role]?.specs || [];
        setData(grouped);
      }
      if (json.seasonDisplay) setSeasonDisplay(json.seasonDisplay);
    } catch { /* will retry */ }
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const specs = data?.[activeRole] || [];
  const grouped: Record<string, MetaSpec[]> = {};
  for (const tier of TIERS) grouped[tier] = [];
  for (const s of specs) { if (grouped[s.tier]) grouped[s.tier].push(s); }

  const totalParses = data ? Object.values(data).flat().reduce((sum, s) => sum + s.score, 0) : 0;

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff8c00]/[0.04] blur-[160px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#9b59b6]/[0.04] blur-[140px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <div className="relative mb-10 pt-8 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c0c18] via-[#0a0a14] to-black">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="relative px-8 py-10">
            <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">← Back to WoW</Link>
            <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-2 tracking-tight">
              Meta <span className="text-[#ff8c00] drop-shadow-[0_0_15px_rgba(255,140,0,0.4)]">Classes</span>
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              WoW spec rankings for Mythic+. Powered by live Raider.IO data — auto-updates every minute.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                Live
              </div>
              {seasonDisplay && (
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span className="text-white">{seasonDisplay}</span>
                </div>
              )}
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Total Score: <span className="text-white">{totalParses.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/5 mb-8 w-fit">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <button key={role.id} onClick={() => setActiveRole(role.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${activeRole === role.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
                <Icon className="w-3.5 h-3.5" /> {role.label}
              </button>
            );
          })}
        </div>

        {error && !loading && (
          <div className="text-center py-16">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {TIERS.map((tier) => (
              <div key={tier} className="rounded-xl overflow-hidden border border-white/[0.06] opacity-50">
                <div className="flex items-stretch">
                  <div className="w-20 flex items-center justify-center shrink-0 bg-white/5">
                    <span className="text-5xl font-black text-gray-600">{tier}</span>
                  </div>
                  <div className="flex-1 bg-black/40 p-3.5">
                    <div className="flex flex-wrap gap-2.5">
                      {Array.from({ length: 4 }).map((_, i) => <SkeletonSpecCard key={i} />)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2">
            {TIERS.map((tier) => {
              const tierSpecs = grouped[tier] || [];
              if (tierSpecs.length === 0) return null;
              const meta = TIER_META[tier];
              return (
                <div key={tier} className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <div className="flex items-stretch">
                    <div className="w-20 flex items-center justify-center shrink-0" style={{ backgroundColor: meta.pillarBg }}>
                      <span className="text-5xl font-black" style={{ color: meta.color, textShadow: `0 0 20px ${meta.color}60` }}>{meta.label}</span>
                    </div>
                    <div className="flex-1 bg-black/40 p-3.5">
                      <div className="flex flex-wrap gap-2.5">
                        {tierSpecs.map(({ id, score, highestKey, tier: t }) => {
                          const spec = SPECS.find((s) => s.id === id);
                          if (!spec) return null;
                          return <SpecCard key={id} spec={spec} score={score} highestKey={highestKey} tier={t} />;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && !TIERS.some((t) => (grouped[t] || []).length > 0) && (
          <div className="text-center py-12 text-gray-500 text-xs font-black uppercase tracking-widest">No data available for this role yet.</div>
        )}

        <div className="mt-16 border-t border-white/5 pt-10">
          <h2 className="text-lg font-black text-white mb-1">Spec Details</h2>
          <p className="text-sm text-gray-400 mb-6">Click any spec card above to see its full breakdown — talents, gear, enchants, gems, and stat priorities.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {["discipline-priest", "devastation-evoker", "arms-warrior"].map((id) => {
              const spec = SPECS.find((s) => s.id === id);
              if (!spec) return null;
              const color = getClassColor(spec.classId);
              return (
                <Link key={id} href={`/wow/spec/${id}`} className="group relative bg-gradient-to-br from-[#0c0c18] to-black rounded-[1.5rem] p-6 transition-all duration-200" style={{ border: `1.5px solid ${color}25` }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}60`; e.currentTarget.style.boxShadow = `0 0 40px ${color}15`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${color}25`; e.currentTarget.style.boxShadow = `none`; }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img src={spec.icon} alt={spec.name} className="w-12 h-12 rounded-xl" />
                    <div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mb-0.5" style={{ backgroundColor: `${color}20`, color }}>{spec.classId.replace(/-/g, " ")}</span>
                      <div className="text-sm font-bold text-white">{spec.name}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5"><span className="text-gray-500">BIS Gear</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5"><span className="text-gray-500">Enchants</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5"><span className="text-gray-500">Gems</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5"><span className="text-gray-500">Stats</span><br /><span className="text-white font-black">View →</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
