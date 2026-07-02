"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { SPECS, getClassColor } from "@/lib/wowData";
import { Swords, HeartHandshake, Shield, AlertCircle, ShieldCheck, WandSparkles, Diamond, TrendingUp, Sparkles, Zap } from "lucide-react";

const ROLE_COLORS: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  dps: { color: "#ff4444", bg: "rgba(255,68,68,0.15)", border: "rgba(255,68,68,0.3)", glow: "rgba(255,68,68,0.25)" },
  healer: { color: "#00cc66", bg: "rgba(0,204,102,0.15)", border: "rgba(0,204,102,0.3)", glow: "rgba(0,204,102,0.25)" },
  tank: { color: "#4488ff", bg: "rgba(68,136,255,0.15)", border: "rgba(68,136,255,0.3)", glow: "rgba(68,136,255,0.25)" },
};

const ROLES = [
  { id: "dps", label: "DPS", icon: Swords },
  { id: "healer", label: "Healer", icon: HeartHandshake },
  { id: "tank", label: "Tank", icon: Shield },
] as const;

const TIERS = ["S", "A", "B", "C", "D", "F"] as const;

const TIER_META: Record<string, { color: string; bg: string; pillarBg: string; pillarFrom: string; pillarTo: string; label: string }> = {
  S: { color: "#ff8c00", bg: "rgba(255,140,0,0.12)", pillarBg: "rgba(255,140,0,0.25)", pillarFrom: "#ff8c00", pillarTo: "#ff4400", label: "S" },
  A: { color: "#9b59b6", bg: "rgba(155,89,182,0.12)", pillarBg: "rgba(155,89,182,0.25)", pillarFrom: "#9b59b6", pillarTo: "#6c3483", label: "A" },
  B: { color: "#3498db", bg: "rgba(52,152,219,0.12)", pillarBg: "rgba(52,152,219,0.25)", pillarFrom: "#3498db", pillarTo: "#1a5276", label: "B" },
  C: { color: "#2ecc71", bg: "rgba(46,204,113,0.12)", pillarBg: "rgba(46,204,113,0.25)", pillarFrom: "#2ecc71", pillarTo: "#1a6e3e", label: "C" },
  D: { color: "#ffffff", bg: "rgba(255,255,255,0.06)", pillarBg: "rgba(255,255,255,0.12)", pillarFrom: "#ffffff", pillarTo: "#888888", label: "D" },
  F: { color: "#888888", bg: "rgba(136,136,136,0.12)", pillarBg: "rgba(136,136,136,0.25)", pillarFrom: "#888888", pillarTo: "#444444", label: "F" },
};

interface MetaSpec {
  id: string;
  score: number;
  highestKey: string;
  tier: string;
}

function AnimatedScore({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = Math.max(1, Math.floor(value / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, duration / (value / step || 30));
    return () => clearInterval(timer);
  }, [value]);
  return <span style={{ color }}>{display.toLocaleString()}</span>;
}

function SpecCard({ spec, score, highestKey, tier: t, index }: { spec: { id: string; name: string; classId: string; icon: string }; score: number; highestKey: string; tier: string; index: number }) {
  const color = getClassColor(spec.classId);
  const cardRef = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={cardRef}
      href={`/wow/spec/${spec.id}`}
      className="group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500 min-w-[260px] flex-1 sm:flex-none overflow-hidden spec-card"
      style={{
        background: `linear-gradient(135deg, ${color}12 0%, ${color}06 40%, #0c0c18 70%)`,
        border: `1.5px solid ${color}30`,
        boxShadow: `0 0 0 0 ${color}00, inset 0 1px 0 ${color}10`,
        animation: `specFadeIn 0.6s ease-out both`,
        animationDelay: `${index * 0.08}s`,
        transform: `perspective(800px)`,
        transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = `${color}80`;
        el.style.boxShadow = `0 0 40px ${color}30, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${color}20`;
        el.style.transform = `perspective(800px) translateY(-3px) scale(1.02)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = `${color}30`;
        el.style.boxShadow = `0 0 0 0 ${color}00, inset 0 1px 0 ${color}10`;
        el.style.transform = `perspective(800px) translateY(0) scale(1)`;
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(250px at 40% 50%, ${color}20 0%, transparent 70%)` }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, ${color}05 0%, transparent 50%, ${color}05 100%)` }} />
      <div className="absolute -inset-full opacity-0 group-hover:opacity-30 transition-all duration-700" style={{ background: `linear-gradient(90deg, transparent 0%, ${color}15 50%, transparent 100%)`, transform: `skewX(-20deg)`, animation: `shimmer 2s ease-in-out infinite` }} />
      <div className="relative z-10 flex items-center gap-3 w-full">
        <div className="relative shrink-0">
          <Image src={spec.icon} alt={spec.name} width={40} height={40} className="rounded-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: `${color}20`, boxShadow: `0 0 0 ${color}00` }} />
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500" style={{ boxShadow: `inset 0 0 20px ${color}50, 0 0 15px ${color}30` }} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-wider mb-0.5 transition-all duration-300" style={{ backgroundColor: `${color}25`, color }}>
            {spec.classId.replace(/-/g, " ")}
          </span>
          <div className="text-sm font-bold text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-300" style={{ backgroundImage: `linear-gradient(90deg, ${color}, #fff)` }}>{spec.name}</div>
        </div>
        <div className="text-right shrink-0 flex items-center gap-3 z-10">
          <div>
            <div className="text-[10px] font-black leading-none transition-all duration-300 group-hover:scale-110" style={{ color: `${color}bb` }}>+{highestKey}</div>
            <div className="text-[6px] font-black text-gray-600 uppercase tracking-widest">KEY</div>
          </div>
          <div className="w-px h-8 transition-all duration-300 group-hover:h-10" style={{ backgroundColor: `${color}20`, boxShadow: `0 0 4px ${color}30` }} />
          <div>
            <div className="text-base font-black leading-none" style={{ color }}><AnimatedScore value={score} color={color} /></div>
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

export default function TierListClient({ ptr: initialPtr = false }: { ptr?: boolean }) {
  const [activeRole, setActiveRole] = useState<string>("dps");
  const [ptr, setPtr] = useState(initialPtr);
  const [data, setData] = useState<Record<string, MetaSpec[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seasonDisplay, setSeasonDisplay] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  async function fetchData() {
    try {
      const url = ptr ? "/api/wow/meta-classes?ptr=1" : "/api/wow/meta-classes";
      const res = await fetch(url);
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
    setLoading(true);
    setData(null);
    fetchData().finally(() => setLoading(false));
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [ptr]);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const specs = data?.[activeRole] || [];
  const grouped: Record<string, MetaSpec[]> = {};
  for (const tier of TIERS) grouped[tier] = [];
  for (const s of specs) { if (grouped[s.tier]) grouped[s.tier].push(s); }

  const totalParses = data ? Object.values(data).flat().reduce((sum, s) => sum + s.score, 0) : 0;

  return (
    <div className="min-h-screen bg-[#05050a] text-white overflow-hidden">
      <style>{`
        @keyframes specFadeIn {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -40px) scale(1.15); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(40px, -15px) scale(1.05); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-35px, 30px) scale(1.1); }
          66% { transform: translate(25px, -25px) scale(0.85); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -50px) scale(1.2); }
        }
        @keyframes shimmer {
          0% { transform: skewX(-20deg) translateX(-100%); }
          100% { transform: skewX(-20deg) translateX(200%); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes grain { 0%,100% { transform:translate(0,0) } 10% { transform:translate(-5%,-5%) } 20% { transform:translate(-10%,5%) } 30% { transform:translate(5%,-10%) } 40% { transform:translate(-5%,15%) } 50% { transform:translate(-10%,10%) } 60% { transform:translate(15%,0) } 70% { transform:translate(0,10%) } 80% { transform:translate(-15%,0) } 90% { transform:translate(10%,5%) } }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(255,140,0,0.3); }
          50% { border-color: rgba(255,140,0,0.6); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Floating background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #ff8c00 0%, transparent 70%)", top: "5%", left: "10%", animation: "orbFloat 25s ease-in-out infinite" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #9b59b6 0%, transparent 70%)", top: "40%", right: "5%", animation: "orbFloat2 20s ease-in-out infinite 3s" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.025]" style={{ background: "radial-gradient(circle, #00ffff 0%, transparent 70%)", bottom: "10%", left: "30%", animation: "orbFloat3 18s ease-in-out infinite 5s" }} />
        {/* Mouse-reactive glow */}
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-[0.06] transition-all duration-700 ease-out hidden sm:block" style={{ background: `radial-gradient(circle, ${activeRole === "dps" ? "#ff4444" : activeRole === "healer" ? "#00cc66" : "#4488ff"} 0%, transparent 70%)`, left: mousePos.x - 150, top: mousePos.y - 150 }} />
      </div>

      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "256px 256px", animation: "grain 1s steps(4) infinite" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* ═══ HEADER ═══ */}
        <div className="relative mb-10 pt-8 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c0c18] via-[#0a0a14] to-black" style={{ animation: "fadeSlideUp 0.6s ease-out" }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] opacity-[0.04]" style={{ background: "radial-gradient(circle, #ff8c00 0%, transparent 60%)", animation: "pulseGlow 4s ease-in-out infinite" }} />
          <div className="relative px-8 py-10">
            <Link href="/wow" className="inline-flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
              <Zap className="w-3 h-3" /> ← Back to WoW
            </Link>
            <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-2 tracking-tight flex items-center flex-wrap gap-3">
              Meta <span className="text-[#ff8c00]" style={{ textShadow: `0 0 30px rgba(255,140,0,0.5), 0 0 60px rgba(255,140,0,0.2)` }}>Classes</span>
              <Sparkles className="w-6 h-6 text-[#ff8c00] opacity-60" style={{ animation: "pulseGlow 3s ease-in-out infinite" }} />
              {ptr && (
                <span className="inline-block text-sm font-black text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/30 px-2.5 py-1 rounded-lg tracking-wider" style={{ animation: "pulseGlow 2s ease-in-out infinite" }}>
                  PTR S2 Preview
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              {ptr
                ? "Projected WoW spec rankings for Midnight Season 2 based on current PTR data. Auto-updates every minute."
                : "WoW spec rankings for Mythic+. Powered by live Raider.IO data — auto-updates every minute."
              }
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-white/5">
              <button onClick={() => setPtr(!ptr)} className="group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200" style={{
                background: ptr ? 'rgba(200,50,255,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${ptr ? 'rgba(200,50,255,0.3)' : 'rgba(16,185,129,0.3)'}`,
                color: ptr ? '#d946ef' : '#10b981',
              }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: ptr ? '#d946ef' : '#10b981',
                  boxShadow: ptr ? '0 0 6px rgba(217,70,239,0.5)' : '0 0 6px rgba(16,185,129,0.5)',
                  animation: 'pulseGlow 2s ease-in-out infinite',
                }} />
                <span>{ptr ? 'PTR S2 Preview' : 'Live'}</span>
                <span className="text-[8px] opacity-50 ml-1 transition-transform group-hover:translate-x-0.5">({ptr ? 'switch to live' : 'switch to ptr'})</span>
              </button>
              {seasonDisplay && (
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Season: <span className="text-white">{seasonDisplay}</span>
                </div>
              )}
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Total Score: <span className="text-white">{totalParses.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ROLE FILTERS ═══ */}
        <div className="flex items-center gap-2 mb-8" style={{ animation: "fadeSlideUp 0.6s ease-out 0.1s both" }}>
          {ROLES.map((role) => {
            const Icon = role.icon;
            const rc = ROLE_COLORS[role.id];
            const active = activeRole === role.id;
            return (
              <button key={role.id} onClick={() => setActiveRole(role.id)}
                className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 overflow-hidden"
                style={active ? {
                  background: `linear-gradient(135deg, ${rc.bg} 0%, rgba(255,255,255,0.03) 100%)`,
                  border: `1.5px solid ${rc.border}`,
                  color: rc.color,
                  boxShadow: `0 0 25px ${rc.glow}`,
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.35)',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = `${rc.border}`; e.currentTarget.style.color = rc.color; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = `0 0 15px ${rc.glow}`; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                <Icon className="w-4 h-4 transition-transform duration-300" style={active ? { transform: 'scale(1.15)' } : {}} />
                <span>{role.label}</span>
                {active && (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full" style={{ backgroundColor: rc.color, boxShadow: `0 0 8px ${rc.glow}`, animation: 'pulseGlow 2s ease-in-out infinite' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ═══ ERROR ═══ */}
        {error && !loading && (
          <div className="text-center py-16" style={{ animation: "fadeSlideUp 0.6s ease-out" }}>
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        {/* ═══ LOADING ═══ */}
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

        {/* ═══ TIERS ═══ */}
        {!loading && !error && (
          <div className="space-y-2">
            {TIERS.map((tier, ti) => {
              const tierSpecs = grouped[tier] || [];
              if (tierSpecs.length === 0) return null;
              const meta = TIER_META[tier];
              return (
                <div key={tier} className="rounded-xl overflow-hidden border border-white/[0.06] transition-all duration-500 hover:border-opacity-40" style={{ animation: "fadeSlideUp 0.6s ease-out both", animationDelay: `${0.2 + ti * 0.1}s` }}>
                  <div className="flex items-stretch">
                    <div className="w-20 flex items-center justify-center shrink-0 relative overflow-hidden group/tier" style={{ background: `linear-gradient(180deg, ${meta.pillarFrom}25 0%, ${meta.pillarTo}10 100%)` }}>
                      <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(80px at 50% 30%, ${meta.pillarFrom}30 0%, transparent 70%)` }} />
                      <div className="absolute inset-0 opacity-0 group-hover/tier:opacity-40 transition-opacity duration-500" style={{ background: `radial-gradient(120px at 50% 50%, ${meta.pillarFrom}30 0%, transparent 70%)` }} />
                      <span className="text-5xl font-black relative z-10 transition-all duration-500 group-hover/tier:scale-110" style={{
                        color: meta.color,
                        textShadow: `0 0 25px ${meta.color}80, 0 0 50px ${meta.color}30`,
                        animation: `pulseGlow 3s ease-in-out infinite`,
                        animationDelay: `${ti * 0.3}s`,
                      }}>{meta.label}</span>
                    </div>
                    <div className="flex-1 bg-black/40 p-3.5">
                      <div className="flex flex-wrap gap-2.5">
                        {tierSpecs.map(({ id, score, highestKey, tier: t }, i) => {
                          const spec = SPECS.find((s) => s.id === id);
                          if (!spec) return null;
                          return <SpecCard key={id} spec={spec} score={score} highestKey={highestKey} tier={t} index={i} />;
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

        {/* ═══ FEATURED SPECS ═══ */}
        <div className="mt-16 border-t border-white/5 pt-10" style={{ animation: "fadeSlideUp 0.6s ease-out 0.6s both" }}>
          <h2 className="text-lg font-black text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ff8c00]" />
            Featured Spec Details
          </h2>
          <p className="text-sm text-gray-400 mb-6">Click any spec card above to see its full breakdown — talents, gear, enchants, gems, and stat priorities.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {["discipline-priest", "devastation-evoker", "arms-warrior"].map((id, i) => {
              const spec = SPECS.find((s) => s.id === id);
              if (!spec) return null;
              const color = getClassColor(spec.classId);
              return (
                <Link key={id} href={`/wow/spec/${id}`} className="group relative bg-gradient-to-br from-[#0c0c18] to-black rounded-[1.5rem] p-6 transition-all duration-500 overflow-hidden" style={{
                  border: `1.5px solid ${color}25`,
                  animation: "fadeSlideUp 0.6s ease-out both",
                  animationDelay: `${0.7 + i * 0.15}s`,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}60`; e.currentTarget.style.boxShadow = `0 0 50px ${color}20, 0 12px 40px rgba(0,0,0,0.4)`; e.currentTarget.style.transform = `translateY(-4px)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${color}25`; e.currentTarget.style.boxShadow = `none`; e.currentTarget.style.transform = `translateY(0)`; }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(300px at 50% 40%, ${color}12 0%, transparent 70%)` }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Image src={spec.icon} alt={spec.name} width={48} height={48} className="rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
                      <div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mb-0.5" style={{ backgroundColor: `${color}20`, color }}>{spec.classId.replace(/-/g, " ")}</span>
                        <div className="text-sm font-bold text-white">{spec.name}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-lg p-2.5 transition-all duration-300 group-hover:scale-105" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25`, backdropFilter: "blur(4px)" }}>
                        <ShieldCheck className="w-3.5 h-3.5 mb-1" style={{ color }} />
                        <div className="text-gray-400" style={{ color: `${color}cc` }}>BIS Gear</div>
                        <div className="text-white font-black text-[10px]">View →</div>
                      </div>
                      <div className="rounded-lg p-2.5 transition-all duration-300 group-hover:scale-105" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25`, backdropFilter: "blur(4px)" }}>
                        <WandSparkles className="w-3.5 h-3.5 mb-1" style={{ color }} />
                        <div className="text-gray-400" style={{ color: `${color}cc` }}>Enchants</div>
                        <div className="text-white font-black text-[10px]">View →</div>
                      </div>
                      <div className="rounded-lg p-2.5 transition-all duration-300 group-hover:scale-105" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25`, backdropFilter: "blur(4px)" }}>
                        <Diamond className="w-3.5 h-3.5 mb-1" style={{ color }} />
                        <div className="text-gray-400" style={{ color: `${color}cc` }}>Gems</div>
                        <div className="text-white font-black text-[10px]">View →</div>
                      </div>
                      <div className="rounded-lg p-2.5 transition-all duration-300 group-hover:scale-105" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25`, backdropFilter: "blur(4px)" }}>
                        <TrendingUp className="w-3.5 h-3.5 mb-1" style={{ color }} />
                        <div className="text-gray-400" style={{ color: `${color}cc` }}>Stats</div>
                        <div className="text-white font-black text-[10px]">View →</div>
                      </div>
                    </div>
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
