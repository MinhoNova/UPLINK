"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, ChevronLeft, Coins, Play, Wand2, Check, Package, X,
} from "lucide-react";
import { AION_DUNGEONS } from "@/lib/aionDungeons";
import { AION_SERVICES, formatUsd } from "@/lib/aionServices";

const FALLBACK_BG = "/aion%202%20bg%20small.mp4";
const LUDRA_VIDEO = "/ludra_sm.mp4";

function videoFor(id: string | null): string {
  if (!id) return FALLBACK_BG;
  const d = AION_DUNGEONS.find((x) => x.id === id);
  if (d?.video) return d.video;
  return id === "ludra" ? LUDRA_VIDEO : FALLBACK_BG;
}

export default function Aion2CreateOfferPage() {
  const [selId, setSelId] = useState<string | null>(AION_DUNGEONS[0].id);
  const [region, setRegion] = useState<"US" | "EU" | "NA">("US");
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<"kinah" | "cash">("cash");
  const [speed, setSpeed] = useState("Standard");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  const selectedDungeon = AION_DUNGEONS.find((d) => d.id === selId);
  const selectedSvc = AION_SERVICES.find((s) => s.id === selId);

  const bgVideo = videoFor(selId);

  const speedExtra = selectedSvc
    ? speed === "Super Express" ? (selectedSvc.superExpress ?? 0) : speed === "Express" ? (selectedSvc.express ?? 0) : 0
    : 0;
  const total = (selectedSvc ? selectedSvc.basePriceUsd : 25) * qty + speedExtra;
  const label = selectedSvc?.name || selectedDungeon?.dungeon || "";
  const sub = selectedSvc?.priceUnit || (selectedDungeon ? "BOSS RUN · " + selectedDungeon.boss : "");
  const hasVideo = selectedSvc?.id === "ludra" || !!selectedDungeon?.video;

  const pick = (id: string) => { setSelId(id); setQty(1); setPublished(false); };

  return (
    <div className="min-h-screen bg-[#030410] text-white relative overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans">

      <style>{`
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .glass { border:1px solid transparent; background: linear-gradient(rgba(6,10,24,0.55), rgba(6,10,24,0.55)) padding-box, linear-gradient(150deg, rgba(34,211,238,.5), rgba(168,85,247,.18) 50%, rgba(34,211,238,.08)) border-box; backdrop-filter: blur(16px); }
        .pick-active { box-shadow: 0 0 20px rgba(0,229,255,.32); }
      `}</style>

      {/* ═══ FULL-SCREEN BACKGROUND VIDEO (boss stays visible in the middle) ═══ */}
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
          style={{ background: "radial-gradient(120% 110% at 50% 45%, transparent 35%, rgba(3,4,16,0.5) 92%, rgba(3,4,16,0.92) 100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030410]/65 via-transparent to-[#030410]/75 pointer-events-none" />
      </div>

      {/* ═══ HEADER (minimal) ═══ */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-[1700px] px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/aion2" className="flex items-center gap-2 cursor-pointer select-none">
            <span className="relative">
              <span className="absolute -inset-1.5 rounded-full bg-cyan-400/20 blur-md" />
              <Swords className="relative h-5 w-5 text-cyan-200" />
            </span>
            <span className="text-xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent font-serif">AION</span>
            <span className="text-xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent font-serif">2</span>
          </Link>
          <Link href="/aion2" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest text-gray-200 bg-black/35 border border-white/15 hover:text-cyan-200 hover:border-cyan-400/50 transition-all backdrop-blur-md">
            <ChevronLeft className="w-3 h-3" /> LOBBY
          </Link>
        </div>
      </header>

      {/* ═══ MAIN — far-left service menu + compact right details board ═══ */}
      <main className="relative z-10 mx-auto max-w-[1700px] px-3 sm:px-6 pt-20 pb-10">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">

          {/* ── LEFT — stacked service buttons (far left, hugs edge) ── */}
          <aside className="w-full lg:w-[236px] shrink-0 glass rounded-2xl p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto">
            {/* Boss runs */}
            <p className="px-2 pt-1.5 pb-2 text-[8px] font-black tracking-[0.3em] text-cyan-300 uppercase">Boss Runs</p>
            <div className="space-y-1">
              {AION_DUNGEONS.slice(0, 4).map((d) => {
                const isSel = selId === d.id;
                return (
                  <button key={d.id} type="button" onClick={() => pick(d.id)} className={isSel ? "pick-active w-full flex items-center gap-2 rounded-lg px-2.5 py-2 border cursor-pointer border-cyan-300/70 bg-white/10 text-left" : "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 border cursor-pointer border-white/10 bg-black/25 hover:border-cyan-400/40 hover:bg-white/[0.05] text-left"}>
                    <Wand2 className={isSel ? "w-3.5 h-3.5 shrink-0 text-cyan-300" : "w-3.5 h-3.5 shrink-0 text-gray-400"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black tracking-wide text-white uppercase truncate">{d.dungeon}</span>
                        {d.video && <Play className="w-2.5 h-2.5 text-emerald-300 shrink-0" />}
                      </div>
                      <p className="text-[8px] font-bold text-gray-400 truncate">{d.boss}</p>
                    </div>
                  </button>
                );
              })}
              {AION_DUNGEONS.slice(4).map((d) => {
                const isSel = selId === d.id;
                return (
                  <button key={d.id} type="button" onClick={() => pick(d.id)} className={isSel ? "pick-active w-full flex items-center gap-2 rounded-lg px-2.5 py-2 border cursor-pointer border-cyan-300/70 bg-white/10 text-left" : "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 border cursor-pointer border-white/10 bg-black/25 hover:border-cyan-400/40 hover:bg-white/[0.05] text-left"}>
                    <Wand2 className={isSel ? "w-3.5 h-3.5 shrink-0 text-cyan-300" : "w-3.5 h-3.5 shrink-0 text-gray-400"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black tracking-wide text-white uppercase truncate">{d.dungeon}</span>
                        {d.video && <Play className="w-2.5 h-2.5 text-emerald-300 shrink-0" />}
                      </div>
                      <p className="text-[8px] font-bold text-gray-400 truncate">{d.boss}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="my-2.5 h-px bg-white/10" />

            {/* All services grouped */}
            {[
              ["Service", null],
              ["Leveling", "Leveling"],
              ["Raids", "Raids"],
              ["Dungeons", "Dungeons"],
              ["PVP", "PVP"],
              ["Collections", "Collections"],
              ["Currency", "Currency"],
              ["Professions", "Professions"],
            ].map(([title, cat]) => {
              const list = cat === null ? [] : AION_SERVICES.filter((s) => s.category === cat);
              if (cat !== null && list.length === 0) return null;
              return (
                <div key={title as string}>
                  <p className="px-2 pt-0.5 pb-1.5 text-[8px] font-black tracking-[0.3em] text-cyan-300 uppercase">{title as string}</p>
                  <div className="space-y-1">
                    {list.map((svc) => {
                      const isSel = selId === svc.id;
                      return (
                        <button key={svc.id} type="button" onClick={() => pick(svc.id)} className={isSel ? "pick-active w-full flex items-center gap-2 rounded-lg px-2.5 py-2 border cursor-pointer border-cyan-300/70 bg-white/10 text-left" : "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 border cursor-pointer border-white/10 bg-black/25 hover:border-cyan-400/40 hover:bg-white/[0.05] text-left"}>
                          <Package className={isSel ? "w-3.5 h-3.5 shrink-0 text-cyan-300" : "w-3.5 h-3.5 shrink-0 text-gray-400"} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black tracking-wide text-white uppercase truncate">{svc.name}</span>
                              {svc.id === "ludra" && <Play className="w-2.5 h-2.5 text-emerald-300 shrink-0" />}
                            </div>
                            <p className="text-[8px] font-bold text-gray-400 truncate">{svc.priceUnit}</p>
                          </div>
                          <span className="text-[9px] font-black text-amber-300 shrink-0">{formatUsd(svc.basePriceUsd)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </aside>

          {/* ── RIGHT — compact details board (pushed right, small) ── */}
          <section className="w-full lg:w-[330px] shrink-0 glass rounded-2xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between mb-3 pb-2.5 border-b border-white/10">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white font-serif truncate">{label || "SELECT A SERVICE"}</h3>
                  {hasVideo && <Play className="w-3 h-3 text-emerald-300 shrink-0" />}
                </div>
                <p className="text-[9px] font-bold text-gray-300 mt-0.5 truncate">{sub || "Pick a service from the menu"}</p>
              </div>
              {selId && (
                <button type="button" onClick={() => setSelId(null)} className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-400/50 transition-all cursor-pointer shrink-0">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Region */}
            <label className="text-[9px] font-black text-cyan-200 uppercase tracking-widest block mb-1.5">Region</label>
            <div className="flex gap-1.5 mb-3.5">
              {(["US", "EU", "NA"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRegion(r)} className={region === r ? "flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-wider border bg-cyan-500/30 border-cyan-400 text-cyan-100 cursor-pointer" : "flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-wider border bg-white/[0.05] border-white/15 text-gray-300 cursor-pointer"}>
                  {r}
                </button>
              ))}
            </div>

            {/* Slots + Speed */}
            <div className="grid grid-cols-2 gap-3 mb-3.5">
              <div>
                <label className="text-[9px] font-black text-cyan-200 uppercase tracking-widest block mb-1.5">Slots</label>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 rounded-md bg-white/[0.08] border border-white/20 font-black text-sm text-white hover:border-cyan-400/50 cursor-pointer">&#8722;</button>
                  <span className="flex-1 text-center font-black text-sm text-white">{qty}</span>
                  <button type="button" onClick={() => setQty((q) => q + 1)} className="w-7 h-7 rounded-md bg-white/[0.08] border border-white/20 font-black text-sm text-white hover:border-cyan-400/50 cursor-pointer">+</button>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-cyan-200 uppercase tracking-widest block mb-1.5">Speed</label>
                <select value={speed} onChange={(e) => setSpeed(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-1.5 text-[10px] font-black text-white outline-none focus:border-cyan-400/70">
                  <option>Standard</option>
                  <option>Express</option>
                  <option>Super Express</option>
                </select>
              </div>
            </div>

            {/* Payment */}
            <label className="text-[9px] font-black text-cyan-200 uppercase tracking-widest block mb-1.5">Payment</label>
            <div className="flex gap-1.5 mb-4">
              {(["cash", "kinah"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} className={method === m ? "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-cyan-500/30 border-cyan-400 text-cyan-100 cursor-pointer" : "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-white/[0.05] border-white/15 text-gray-300 cursor-pointer"}>
                  {m === "cash" ? "USD" : "Kinah"}
                </button>
              ))}
            </div>

            {/* Total */}
            <div className="rounded-xl border border-amber-400/35 bg-black/30 px-3 py-2.5 flex items-center justify-between mb-4">
              <span className="text-[9px] font-black text-gray-200 uppercase tracking-widest">Total Reward</span>
              <span className="text-base font-black text-amber-300">{method === "cash" ? formatUsd(total) : Math.round(total) + "K"}</span>
            </div>

            <button type="button" onClick={() => setPublished(true)} className="relative flex w-full items-center justify-center gap-2 rounded-xl py-3 font-black uppercase tracking-[0.18em] text-[10px] text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 border border-cyan-300/80 shadow-[0_0_25px_rgba(0,255,255,0.4)] hover:shadow-[0_0_38px_rgba(0,255,255,0.7)] transition-all cursor-pointer">
              <span className="absolute inset-[2px] border border-white/20" />
              <Coins className="w-3.5 h-3.5" /> Deploy Mission
            </button>
          </section>
        </div>
      </main>

      {/* ═══ SUCCESS OVERLAY ═══ */}
      <AnimatePresence>
        {published && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 18 }} className="relative w-full max-w-sm rounded-3xl border border-cyan-300/60 bg-[#0a0e26] p-7 text-center shadow-[0_0_60px_rgba(0,255,255,0.3)]">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/60 flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.5)]">
                <Check className="w-6 h-6 text-emerald-300" />
              </div>
              <h3 className="font-serif text-lg font-black tracking-widest uppercase text-white">Mission Deployed</h3>
              <p className="mt-2 text-[10px] text-gray-300 font-bold leading-relaxed">
                <span className="text-cyan-300">{label || "—"}</span> &middot; {region} &middot; {qty} slot{qty > 1 ? "s" : ""}<br />
                Reward {method === "cash" ? formatUsd(total) : Math.round(total) + "K Kinah"}
              </p>
              <div className="mt-5 flex flex-col gap-2">
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