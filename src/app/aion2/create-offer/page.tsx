"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, ChevronLeft, Sparkles, Coins, Play, Skull, Flame,
  TrendingUp, Wand2, Check, Video,
} from "lucide-react";
import { AION_DUNGEONS } from "@/lib/aionDungeons";
import { AION_SERVICES, formatUsd } from "@/lib/aionServices";

const FALLBACK_BG = "/aion%202%20bg%20small.mp4";
const LUDRA_VIDEO = "/ludra_sm.mp4";

const NAV = [
  { key: "Raids", label: "RAIDS", icon: Skull },
  { key: "Dungeons", label: "DUNGEONS", icon: Swords },
  { key: "Leveling", label: "LEVELING", icon: TrendingUp },
  { key: "PVP", label: "PVP", icon: Flame },
];

export default function Aion2CreateOfferPage() {
  const [side, setSide] = useState("Dungeons");
  const [selId, setSelId] = useState<string | null>(AION_DUNGEONS[0].id);
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<"kinah" | "cash">("cash");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  const raidingServices = AION_SERVICES.filter((s) => s.category === "Raids");
  const levelingServices = AION_SERVICES.filter((s) => s.category === "Leveling");
  const pvpServices = AION_SERVICES.filter((s) => s.category === "PVP");

  const selectedDungeon = AION_DUNGEONS.find((d) => d.id === selId);
  const selectedSvc = AION_SERVICES.find((s) => s.id === selId);

  /* Background video: boss/raid videos take over the whole screen */
  const bgVideo =
    side === "Dungeons"
      ? selectedDungeon?.video || FALLBACK_BG
      : side === "Raids"
        ? (selectedSvc?.id === "ludra" ? LUDRA_VIDEO : FALLBACK_BG)
        : FALLBACK_BG;

  const basePrice = selectedSvc ? selectedSvc.basePriceUsd : 25;
  const total = basePrice * qty;
  const label = selectedSvc?.name || selectedDungeon?.dungeon || "";
  const unit = selectedSvc?.priceUnit || "per slot";

  const pick = (id: string) => { setSelId(id); setQty(1); };

  return (
    <div className="min-h-screen bg-[#030410] text-white relative overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans">

      <style>{`
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .glass-panel { border:1px solid transparent; background: linear-gradient(rgba(6,10,24,0.5), rgba(6,10,24,0.5)) padding-box, linear-gradient(150deg, rgba(34,211,238,.5), rgba(168,85,247,.18) 50%, rgba(34,211,238,.08)) border-box; backdrop-filter: blur(16px); }
        .row-active { box-shadow: 0 0 22px rgba(0,229,255,0.35); }
      `}</style>

      {/* ═══ FULL-SCREEN BACKGROUND VIDEO ═══ */}
      <div className="fixed inset-0 z-0 bg-[#030410]">
        <AnimatePresence mode="popLayout">
          <motion.video
            key={bgVideo}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            autoPlay muted loop playsInline preload="metadata"
          >
            <source src={bgVideo} type="video/mp4" />
          </motion.video>
        </AnimatePresence>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(120% 110% at 50% 18%, transparent 40%, rgba(3,4,16,0.55) 90%, rgba(3,4,16,0.92) 100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030410]/60 via-[#030410]/15 to-[#030410]/85 pointer-events-none" />
      </div>

      {/* Floating runes */}
      {[
        { l: "6%", t: "20%", s: 15, d: "0s" },
        { l: "90%", t: "22%", s: 14, d: "2s" },
        { l: "12%", t: "80%", s: 12, d: "1.2s" },
      ].map((r, i) => (
        <span key={i} className="pointer-events-none fixed z-0 text-cyan-100/25 font-serif italic select-none" style={{ left: r.l, top: r.t, fontSize: r.s, animation: `floaty ${7 + i}s ease-in-out infinite`, animationDelay: r.d }}>&#10022;</span>
      ))}

      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-[1700px] px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/aion2" className="flex items-center gap-2 cursor-pointer select-none">
            <span className="relative">
              <span className="absolute -inset-1.5 rounded-full bg-cyan-400/20 blur-md" />
              <Swords className="relative h-6 w-6 text-cyan-200" />
            </span>
            <span className="text-2xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent font-serif">AION</span>
            <span className="text-2xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent font-serif">2</span>
          </Link>
          <Link href="/aion2" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black tracking-widest text-gray-200 bg-black/35 border border-white/15 hover:text-cyan-200 hover:border-cyan-400/50 transition-all backdrop-blur-md">
            <ChevronLeft className="w-3.5 h-3.5" /> BACK TO LOBBY
          </Link>
        </div>
      </header>

      {/* ═══ MAIN: NAV left + compact list right ═══ */}
      <main className="relative z-10 mx-auto max-w-[1500px] px-3 sm:px-6 pt-24 pb-28">
        <div className="flex gap-4 lg:gap-5 items-start">

          {/* ── LEFT — SkyCoach-style side menu ── */}
          <aside className="w-[64px] sm:w-[212px] shrink-0 glass-panel rounded-2xl p-2 sm:p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            <p className="hidden sm:block px-3 pt-2 pb-3 text-[9px] font-black tracking-[0.3em] text-cyan-300 uppercase">Menu</p>
            <nav className="flex flex-col gap-1.5">
              {NAV.map((item) => {
                const active = side === item.key;
                const Icon = item.icon;
                return (
                  <button key={item.key} type="button" onClick={() => { setSide(item.key); setSelId(null); }} className={active ? "relative flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all cursor-pointer border border-cyan-300/70 bg-white/10 row-active" : "flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all cursor-pointer border border-white/10 bg-black/25 hover:border-cyan-400/40 hover:bg-white/[0.05]"}>
                    <Icon className={active ? "w-4.5 h-4.5 shrink-0 text-cyan-300" : "w-4.5 h-4.5 shrink-0 text-gray-400"} />
                    <span className={active ? "hidden sm:block text-[11px] font-black tracking-[0.18em] text-white" : "hidden sm:block text-[11px] font-black tracking-[0.18em] text-gray-300"}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── RIGHT — compact list by category ── */}
          <section className="flex-1 w-full glass-panel rounded-2xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <h3 className="text-[11px] sm:text-sm font-black uppercase tracking-[0.2em] text-white font-serif">{side}</h3>
              </div>
              <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">LIVE</span>
            </div>

            <div className="space-y-2">
              {/* DUNGEONS → boss/raid picker with video backgrounds */}
              {side === "Dungeons" &&
                AION_DUNGEONS.map((d) => {
                  const isSel = selId === d.id;
                  return (
                    <button key={d.id} type="button" onClick={() => pick(d.id)} className={isSel ? "row-active w-full flex items-center gap-3 rounded-xl px-3 py-3 border cursor-pointer border-cyan-300/70 bg-white/10 text-left" : "w-full flex items-center gap-3 rounded-xl px-3 py-3 border cursor-pointer border-white/10 bg-black/25 hover:border-cyan-400/40 hover:bg-white/[0.05] text-left"}>
                      <span className={isSel ? "w-8 h-8 shrink-0 rounded-lg bg-gradient-to-b from-cyan-500/40 to-purple-600/40 border border-cyan-400/50 flex items-center justify-center text-cyan-200" : "w-8 h-8 shrink-0 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center text-gray-300"}>
                        <Wand2 className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[11px] sm:text-xs font-black tracking-wide text-white uppercase truncate">{d.dungeon}</h4>
                          {d.video && (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shrink-0">
                              <Play className="w-2 h-2" /> VIDEO
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-gray-300 truncate">{d.boss}</p>
                      </div>
                      <span className="text-[9px] font-black text-gray-400 px-1.5 py-0.5 rounded border border-white/10 shrink-0">{d.region}</span>
                    </button>
                  );
                })}

              {/* RAIDS / LEVELING / PVP → service rows */}
              {(side === "Raids" ? raidingServices : side === "Leveling" ? levelingServices : pvpServices).map((svc) => {
                const isSel = selId === svc.id;
                return (
                  <button key={svc.id} type="button" onClick={() => pick(svc.id)} className={isSel ? "row-active w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 border cursor-pointer border-cyan-300/70 bg-white/10 text-left" : "w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 border cursor-pointer border-white/10 bg-black/25 hover:border-cyan-400/40 hover:bg-white/[0.05] text-left"}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[11px] sm:text-xs font-black tracking-wide text-white truncate">{svc.name}</h4>
                        {svc.id === "ludra" && (
                          <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shrink-0">
                            <Play className="w-2 h-2" /> VIDEO
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-gray-300 truncate">{svc.priceUnit}</p>
                    </div>
                    <span className="text-[11px] font-black text-amber-300 shrink-0">{formatUsd(svc.basePriceUsd)}</span>
                  </button>
                );
              })}

              {(side === "Leveling" || side === "PVP") && (
                <p className="px-1 pt-2 text-[9px] text-gray-300 font-bold">
                  <Video className="inline w-3 h-3 text-cyan-300 mr-1" /> More {side.toLowerCase()} services landing soon — pick one to preview the cinematic backdrop.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ═══ BOTTOM SLIM ACTION BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-300/25 bg-[#04060f]/85 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
          <div className="min-w-0">
            <p className="text-[8px] font-black tracking-[0.28em] text-cyan-300 uppercase">Selected</p>
            <p className="text-xs sm:text-sm font-black text-white uppercase truncate">{label || "—"}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-[9px] font-black tracking-widest text-gray-400 uppercase">Slots</span>
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg bg-white/[0.08] border border-white/20 font-black text-white hover:border-cyan-400/50 cursor-pointer">&#8722;</button>
            <span className="w-8 text-center font-black text-base text-white">{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)} className="w-9 h-9 rounded-lg bg-white/[0.08] border border-white/20 font-black text-white hover:border-cyan-400/50 cursor-pointer">+</button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-white/15">
              {(["cash", "kinah"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} className={method === m ? "px-3 py-2 text-[9px] font-black tracking-widest uppercase bg-cyan-500/30 text-cyan-100 cursor-pointer" : "px-3 py-2 text-[9px] font-black tracking-widest uppercase bg-black/20 text-gray-400 cursor-pointer"}>
                  {m === "cash" ? "USD" : "KINAH"}
                </button>
              ))}
            </div>
            <div className="px-4 py-2 rounded-lg border border-amber-400/40 bg-black/30">
              <span className="text-sm sm:text-base font-black text-amber-300">{method === "cash" ? formatUsd(total) : Math.round(total) + "K"}</span>
              <span className="ml-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">{unit}</span>
            </div>
            <button type="button" onClick={() => setPublished(true)} className="relative flex items-center gap-2 rounded-xl px-5 py-2.5 font-black uppercase tracking-[0.18em] text-[10px] text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 border border-cyan-300/80 shadow-[0_0_25px_rgba(0,255,255,0.4)] hover:shadow-[0_0_38px_rgba(0,255,255,0.7)] transition-all cursor-pointer">
              <Coins className="w-3.5 h-3.5" /> Deploy Mission
            </button>
          </div>
        </div>
      </div>

      {/* ═══ SUCCESS OVERLAY ═══ */}
      <AnimatePresence>
        {published && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 18 }} className="relative w-full max-w-md rounded-3xl border border-cyan-300/60 bg-[#0a0e26] p-8 text-center shadow-[0_0_60px_rgba(0,255,255,0.3)]">
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/60 flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.5)]">
                <Check className="w-7 h-7 text-emerald-300" />
              </div>
              <h3 className="font-serif text-xl font-black tracking-widest uppercase text-white">Mission Deployed</h3>
              <p className="mt-2 text-[11px] text-gray-300 font-bold leading-relaxed">
                <span className="text-cyan-300">{label || "—"}</span> &middot; {qty} slot{qty > 1 ? "s" : ""}<br />
                Reward {method === "cash" ? formatUsd(total) : Math.round(total) + "K Kinah"}
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <Link href="/aion2" className="rounded-xl py-3 font-black uppercase tracking-widest text-xs text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 border border-cyan-300/80 shadow-[0_0_25px_rgba(0,255,255,0.35)] text-center">
                  RETURN TO LOBBY
                </Link>
                <button type="button" onClick={() => setPublished(false)} className="rounded-xl py-3 font-black uppercase tracking-widest text-xs text-gray-300 border border-white/15 hover:border-cyan-400/50 hover:text-white transition-all cursor-pointer">
                  BUILD ANOTHER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}