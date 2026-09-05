"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, ChevronLeft, Sparkles, Users, Coins, Timer, Play,
  Shield, Wand2, Check, Ghost, Video,
} from "lucide-react";
import { AION_DUNGEONS } from "@/lib/aionDungeons";
import { AION_SERVICES, AION_CATEGORIES, formatUsd } from "@/lib/aionServices";

const FALLBACK_BG = "/aion%202%20bg%20small.mp4";

export default function Aion2CreateOfferPage() {
  const [activeId, setActiveId] = useState(AION_DUNGEONS[0].id);
  const [cat, setCat] = useState("Dungeons");
  const [serviceId, setServiceId] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("25");
  const [method, setMethod] = useState<"kinah" | "cash">("kinah");
  const [speed, setSpeed] = useState("Standard");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  const active = AION_DUNGEONS.find((d) => d.id === activeId) || AION_DUNGEONS[0];
  const selectedVideo = active.video || FALLBACK_BG;
  const services = AION_SERVICES.filter((s) => s.category === cat);
  const total = (parseFloat(price) || 0) * qty;
  const canPublish = (parseFloat(price) || 0) > 0;

  const publish = () => {
    setPublished(true);
  };

  return (
    <div className="min-h-screen bg-[#030410] text-white relative overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans">

      <style>{`
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulseGlow { 0%,100% { opacity:.35; } 50% { opacity:.8; } }
        .hero-glow { text-shadow: 0 0 22px rgba(130,225,255,.6), 0 0 70px rgba(120,90,255,.4); }
        .glass-panel { border:1px solid transparent; background: linear-gradient(rgba(6,10,24,0.52), rgba(6,10,24,0.52)) padding-box, linear-gradient(150deg, rgba(34,211,238,.5), rgba(168,85,247,.18) 50%, rgba(34,211,238,.08)) border-box; backdrop-filter: blur(16px); }
      `}</style>

      {/* ═══ FULL-SCREEN CINEMATIC BACKGROUND VIDEO ═══ */}
      <div className="fixed inset-0 z-0 bg-[#030410]">
        <AnimatePresence mode="popLayout">
          <motion.video
            key={selectedVideo}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            autoPlay muted loop playsInline preload="metadata"
          >
            <source src={selectedVideo} type="video/mp4" />
          </motion.video>
        </AnimatePresence>

        {/* Light touch — the video is the star; only a faint vignette + bottom fade for readability */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(120% 110% at 50% 18%, transparent 45%, rgba(3,4,16,0.55) 88%, rgba(3,4,16,0.9) 100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030410]/55 via-[#030410]/18 to-[#030410]/78 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(52% 48% at 50% 34%, ${active.glow}, transparent 72%)` }} />
      </div>

      {/* Floating runes */}
      {[
        { l: "8%", t: "16%", s: 15, d: "0s" },
        { l: "16%", t: "82%", s: 12, d: "1.4s" },
        { l: "88%", t: "24%", s: 14, d: "2.2s" },
        { l: "92%", t: "70%", s: 11, d: "0.8s" },
      ].map((r, i) => (
        <span key={i} className="pointer-events-none fixed z-0 text-cyan-100/25 font-serif italic select-none" style={{ left: r.l, top: r.t, fontSize: r.s, animation: `floaty ${7 + i}s ease-in-out infinite`, animationDelay: r.d }}>&#10022;</span>
      ))}

      {/* ═══ Header — floating over the video ═══ */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#030410]/85 to-transparent border-b border-white/[0.06]">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/aion2" className="flex items-center gap-2 group cursor-pointer select-none">
            <span className="relative">
              <span className="absolute -inset-1.5 rounded-full bg-cyan-400/20 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <Swords className="relative h-6 w-6 text-cyan-200" />
            </span>
            <span className="text-2xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent font-serif">AION</span>
            <span className="text-2xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent font-serif">2</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link href="/aion2" className="px-5 py-2 text-[11px] font-black tracking-[0.18em] text-gray-300 hover:text-white transition-colors">LOBBY</Link>
            <Link href="/aion2/classes" className="px-5 py-2 text-[11px] font-black tracking-[0.18em] text-gray-300 hover:text-white transition-colors">CLASSES</Link>
            <span className="relative flex items-center gap-2 px-5 py-2 text-[11px] font-black tracking-[0.18em] text-cyan-100">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> CREATE OFFER
              <span className="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_10px_rgba(34,211,238,.9)]" />
              <span className="absolute inset-0 bg-cyan-400/[0.06]" />
            </span>
          </nav>
        </div>
      </header>

      {/* ═══ Main ═══ */}
      <main className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-8 pt-28 pb-14">
        <div className="flex items-center justify-between mb-7">
          <Link href="/aion2" className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black tracking-widest text-gray-200 bg-black/35 border border-white/15 hover:text-cyan-200 hover:border-cyan-400/50 transition-all backdrop-blur-md">
            <ChevronLeft className="w-3.5 h-3.5" /> BACK TO LOBBY
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/35 border border-emerald-400/30 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-black tracking-widest text-emerald-300 uppercase">24/7 BOOST TEAMS ONLINE</span>
          </div>
        </div>

        {/* Hero — big cinematic title floating on the video */}
        <AnimatePresence mode="wait">
          <motion.div key={active.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5 }} className="mb-9 max-w-4xl">
            <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black tracking-[0.42em] text-cyan-200">
              <span className="h-px w-14 bg-gradient-to-r from-transparent to-cyan-200/80" />
              NOW RUNNING <span className="text-violet-300">&#10022;</span> {active.dungeon.toUpperCase()}
              <span className="h-px w-14 bg-gradient-to-l from-transparent to-cyan-200/80" />
            </div>
            <h1 className="mt-4 font-serif text-5xl sm:text-7xl font-black tracking-[0.06em] text-white hero-glow leading-none">
              {active.dungeon.toUpperCase()}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-2 text-sm font-black text-cyan-200">
                <Ghost className="w-4 h-4 text-violet-300" /> {active.boss}
              </span>
              <span className="h-4 w-px bg-white/20 hidden sm:block" />
              <span className="text-[12px] text-slate-100/90 font-medium max-w-xl">{active.tagline}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ═══ LEFT — Dungeon / Boss selector (glass) ═══ */}
          <aside className="w-full lg:w-[340px] shrink-0 glass-panel rounded-3xl p-5 shadow-[0_10px_42px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.1]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-300" />
                <h3 className="text-[11px] font-black tracking-[0.25em] uppercase text-cyan-100 font-serif">CHOOSE YOUR DUNGEON</h3>
              </div>
              <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">{AION_DUNGEONS.filter(d => d.video).length} CINEMATIC</span>
            </div>

            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {AION_DUNGEONS.map((d) => {
                const isActive = d.id === activeId;
                return (
                  <button key={d.id} type="button" onClick={() => { setActiveId(d.id); setCat(d.category); }} className={isActive ? "group w-full text-left rounded-2xl px-4 py-3.5 border transition-all duration-200 cursor-pointer border-cyan-300/70 bg-white/10 shadow-[0_0_22px_rgba(0,229,255,0.35)] backdrop-blur-md" : "group w-full text-left rounded-2xl px-4 py-3.5 border transition-all duration-200 cursor-pointer border-white/10 bg-black/25 hover:border-cyan-400/40 hover:bg-white/[0.05] backdrop-blur-md"}>
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "w-9 h-9 shrink-0 rounded-lg bg-gradient-to-b from-cyan-500/40 to-purple-600/40 border border-cyan-400/50 flex items-center justify-center text-cyan-200" : "w-9 h-9 shrink-0 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center text-gray-300 group-hover:text-cyan-200"}>
                        <Wand2 className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={isActive ? "text-xs font-black tracking-wide text-white uppercase truncate" : "text-xs font-black tracking-wide text-gray-100 uppercase truncate"}>{d.dungeon}</h4>
                          {d.video && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shrink-0">
                              <Play className="w-2 h-2" /> VIDEO
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-gray-300 truncate mt-0.5">Boss — {d.boss}</p>
                      </div>
                      <span className={isActive ? "text-[9px] font-black text-cyan-200 px-2 py-0.5 rounded border border-cyan-400/50" : "text-[9px] font-black text-gray-400 px-2 py-0.5 rounded border border-white/10"}>
                        {d.region}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-[9px] text-gray-300 font-bold leading-relaxed border-t border-white/[0.1] pt-3">
              <Video className="inline w-3 h-3 text-cyan-300 mr-1" />
              <span className="text-cyan-300">LIVE PREVIEW:</span> pick any dungeon — the entire screen becomes its battlefield footage. Videos for the rest are on their way.
            </p>
          </aside>

          {/* ═══ RIGHT — Configurator (glass) ═══ */}
          <section className="flex-1 w-full glass-panel rounded-3xl p-5 sm:p-7 shadow-[0_10px_42px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.1]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-cyan-300" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white font-serif">LAUNCH YOUR BOOST</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/40 bg-black/30 backdrop-blur-md">
                <Users className="w-3 h-3 text-cyan-300" />
                <span className="text-[9px] font-black tracking-widest text-cyan-200 uppercase">{active.dungeon} &middot; SOLO or PARTY</span>
              </div>
            </div>

            {/* Category */}
            <label className="text-[10px] font-black text-cyan-200 uppercase tracking-widest block mb-2">Category</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {AION_CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => { setCat(c); setServiceId(""); }} className={cat === c ? "px-3.5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all cursor-pointer" : "px-3.5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border bg-white/[0.06] border-white/15 text-gray-200 hover:text-white transition-all cursor-pointer"}>
                  {c}
                </button>
              ))}
            </div>

            {/* Service */}
            <label className="text-[10px] font-black text-cyan-200 uppercase tracking-widest block mb-2">Service Type</label>
            <div className="space-y-2 mb-5 max-h-40 overflow-y-auto pr-1">
              {services.map((svc) => (
                <button key={svc.id} type="button" onClick={() => { setServiceId(svc.id); setPrice(svc.basePriceUsd.toFixed(0)); }} className={svc.id === serviceId ? "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-left border-cyan-400 bg-cyan-500/25 text-white shadow-[0_0_15px_rgba(0,255,255,0.25)] transition-all cursor-pointer" : "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-left border-white/15 bg-white/[0.04] text-gray-200 hover:border-white/30 transition-all cursor-pointer"}>
                  <span className="text-xs font-black truncate">{svc.name}</span>
                  <span className="text-[10px] font-black text-amber-400">{formatUsd(svc.basePriceUsd)}</span>
                </button>
              ))}
              {services.length === 0 && <p className="text-[10px] text-gray-300 font-bold px-2">No services for this category yet.</p>}
            </div>

            {/* Qty + price */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Party Slots</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/20 font-black text-white hover:border-cyan-400/50 cursor-pointer">&#8722;</button>
                  <span className="flex-1 text-center font-black text-base text-white">{qty}</span>
                  <button type="button" onClick={() => setQty((q) => q + 1)} className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/20 font-black text-white hover:border-cyan-400/50 cursor-pointer">+</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Price Per Run ({method === "kinah" ? "K" : "$"})</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25" className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-4 py-2.5 text-sm font-black text-white outline-none focus:border-cyan-400/70" />
              </div>
            </div>

            {/* Payment + speed */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Payment</label>
                <div className="flex gap-2">
                  {(["kinah", "cash"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMethod(m)} className={method === m ? "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,255,255,0.3)] transition-all cursor-pointer" : "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-white/[0.06] border-white/15 text-gray-200 transition-all cursor-pointer"}>
                      {m === "kinah" ? "Kinah" : "USD"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Speed</label>
                <select value={speed} onChange={(e) => setSpeed(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 text-xs font-black text-white outline-none focus:border-cyan-400/70">
                  <option>Standard</option>
                  <option>Express</option>
                  <option>Super Express</option>
                </select>
              </div>
            </div>

            {/* Summary + publish */}
            <div className="rounded-2xl border border-amber-400/35 bg-black/35 backdrop-blur-md p-4 flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="text-[10px] font-black text-gray-200 uppercase tracking-widest mb-1">Total Reward</div>
                <div className="text-xl font-black text-amber-300">{method === "cash" ? formatUsd(total) : Math.round(total) + "K Kinah"}</div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-200 uppercase tracking-widest">
                <Timer className="w-3.5 h-3.5 text-cyan-300" /> {speed}
                <span className="h-4 w-px bg-white/20 mx-1" />
                <Coins className="w-3.5 h-3.5 text-amber-400" /> {active.dungeon}
              </div>
            </div>

            <button disabled={!canPublish} onClick={publish} className="relative flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-xs text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 border border-cyan-300/80 shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:shadow-[0_0_45px_rgba(0,255,255,0.7)] hover:border-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
              <span className="absolute inset-[3px] border border-white/20" />
              <Swords className="w-4 h-4" /> DEPLOY MISSION
            </button>
            <p className="mt-3 text-center text-[9px] text-gray-200 font-bold uppercase tracking-widest">
              UPLINK SECURE ESCROW &middot; RATED DAEVAS &middot; FAST TRACK
            </p>
          </section>
        </div>
      </main>

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
                <span className="text-cyan-300">{active.dungeon}</span> &middot; {active.boss}<br />
                Rewarded {method === "cash" ? formatUsd(total) : Math.round(total) + "K Kinah"} &middot; {speed} &middot; {qty} slot{qty > 1 ? "s" : ""}
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