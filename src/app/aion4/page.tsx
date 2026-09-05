"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, Zap, Flame, Crosshair, Skull, Terminal, Users, ArrowRight, Coins, Activity, Shield, Swords, Play,
} from "lucide-react";

/* ── DATA ── */
const OFFERS = [
  { id: "o1", name: "SANCTUM LUDRA // CLEAR", category: "Dungeons", region: "US", reward: "$13", meta: "2P", speed: "PRE" },
  { id: "o2", name: "SIRENES LAND // EXPED", category: "Dungeons", region: "EU", reward: "$5", meta: "4P", speed: "STD" },
  { id: "o3", name: "LVL 1→80 // BOOST", category: "Leveling", region: "NA", reward: "$42", meta: "SOLO", speed: "MAX" },
  { id: "o4", name: "ABYSS RP // FARM", category: "PVP", region: "US", reward: "$7", meta: "1R", speed: "STD" },
  { id: "o5", name: "CONTINENT // GLORY", category: "Raids", region: "EU", reward: "$24", meta: "8P", speed: "PRE" },
  { id: "o6", name: "KINAH // WIRE", category: "Currency", region: "NA", reward: "$11", meta: "10M", speed: "MAX" },
];

const TABS = ["all", "Dungeons", "Leveling", "Raids", "PVP", "Currency"];

function Bracket({ cl }: { cl: string }) {
  return (
    <>
      <span className={`pointer-events-none absolute h-3 w-3 border-l-2 border-t-2 ${cl}`} style={{ top: -1, left: -1 }} />
      <span className={`pointer-events-none absolute h-3 w-3 border-r-2 border-t-2 ${cl}`} style={{ top: -1, right: -1 }} />
      <span className={`pointer-events-none absolute h-3 w-3 border-b-2 border-l-2 ${cl}`} style={{ bottom: -1, left: -1 }} />
      <span className={`pointer-events-none absolute h-3 w-3 border-b-2 border-r-2 ${cl}`} style={{ bottom: -1, right: -1 }} />
    </>
  );
}

export default function Aion4Page() {
  const [activeTab, setActiveTab] = useState("all");
  const [hovered, setHovered] = useState<string | null>(null);
  const visible = activeTab === "all" ? OFFERS : OFFERS.filter((o) => o.category === activeTab);

  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020204] text-white selection:bg-[#ff2ec4] selection:text-black font-mono">
      {/* ── Neon grid floor ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,46,196,0.05) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(ellipse at 50% 0%, black 20%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 20%, transparent 75%)",
      }} />
      {/* glow orbs */}
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(closest-side, #ff2ec4, transparent)" }} />
      <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(closest-side, #00e5ff, transparent)" }} />

      {/* scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ background: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)" }} />

      <style>{`
        @keyframes blinkBox { 0%,100% { opacity: 1 } 50% { opacity: .2 } }
        @keyframes glitch { 0%,100% { transform: translate(0,0) skewX(0) } 20% { transform: translate(-2px,1px) skewX(-2deg) } 40% { transform: translate(2px,-1px) skewX(2deg) } 60% { transform: translate(-1px,-1px) skewX(-1deg) } 80% { transform: translate(1px,1px) skewX(1deg) } }
        .neon-magenta { text-shadow: 0 0 10px rgba(255,46,196,.9), 0 0 34px rgba(255,46,196,.5); }
        .neon-cyan { text-shadow: 0 0 10px rgba(0,229,255,.9), 0 0 34px rgba(0,229,255,.5); }
        .glitch-hover:hover { animation: glitch .32s steps(2) infinite; }
        .scanline-grad { background: linear-gradient(90deg, transparent, rgba(255,46,196,.8), rgba(0,229,255,.8), transparent); }
      `}</style>

      {/* ── HUD Header ── */}
      <header className="relative z-40 border-b-2 border-[#ff2ec4]/30 bg-[#020204]/85 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 -skew-x-6 items-center justify-center bg-gradient-to-br from-[#ff2ec4] to-[#00e5ff] shadow-[0_0_22px_rgba(0,229,255,0.5)]">
              <Radar className="h-5 w-5 text-black" />
            </div>
            <div className="leading-none">
              <p className="text-base font-black tracking-widest">AION<span className="text-[#ff2ec4]">//</span>ABYSS</p>
              <p className="mt-1 text-[8px] tracking-[0.3em] text-[#00e5ff]">CLIENT v4.2 // DAWN OF THE ABYSS</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {["MISSION BOARD", "SQUAD MATCH", "ARSENAL", "LIVE FEED"].map((n, i) => (
              <a key={n} href="#board" className="group text-[10px] font-bold tracking-[0.24em] text-white/50 transition-colors hover:text-white">
                <span className="mr-1.5 text-[#ff2ec4]">{String(i + 1).padStart(2, "0")}</span>{n}
                <span className="block h-0.5 w-0 bg-gradient-to-r from-[#ff2ec4] to-[#00e5ff] transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-[#00e5ff]">
              <span className="flex h-2.5 w-2.5 items-center justify-center"><span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" /></span>
              ONLINE 1,204
            </div>
            <a href="/aion2/create-offer" className="glitch-hover -skew-x-6 bg-gradient-to-r from-[#ff2ec4] to-[#00e5ff] px-5 py-2.5 text-[10px] font-black tracking-[0.2em] text-black shadow-[0_0_26px_rgba(255,46,196,0.5)] transition-shadow hover:shadow-[0_0_44px_rgba(0,229,255,0.7)]">
              <span className="inline-block skew-x-6">SIGN MISSION</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-20 mx-auto max-w-6xl px-5 pt-16 pb-14 text-center sm:pt-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="flex items-center justify-center gap-2 text-[9px] font-bold tracking-[0.4em] text-[#00e5ff] uppercase">
          <Activity className="h-3.5 w-3.5" /> <span className="blink" style={{ animation: "blinkBox 1.6s infinite" }}>▮</span> System Booted
        </motion.div>

        <motion.h1 initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="mt-6 flex flex-wrap items-center justify-center gap-x-4 text-6xl font-black tracking-tight sm:text-8xl">
          <span className="text-white">AION<span className="neon-magenta">//</span></span>
          <span className="neon-cyan text-[#00e5ff]">ABYSS</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }} className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/55">
          <span className="text-[#ff2ec4]">No mercy.</span> Real Daevas, real raids, real results. Match with the sharpest party in Atreia — and take the Abyss.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="/aion2/create-offer" className="glitch-hover group -skew-x-6 bg-gradient-to-r from-[#ff2ec4] via-[#a855f7] to-[#00e5ff] px-10 py-4 text-[11px] font-black tracking-[0.22em] text-black shadow-[0_0_40px_rgba(255,46,196,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_60px_rgba(0,229,255,0.75)]">
            <span className="inline-flex skew-x-6 items-center gap-3"><Crosshair className="h-4 w-4" /> ENTER THE FRAY <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" /></span>
          </a>
          <a href="#board" className="-skew-x-6 border-2 border-white/20 px-10 py-4 text-[11px] font-black tracking-[0.22em] text-white/70 transition-all hover:border-[#00e5ff] hover:text-[#00e5ff] hover:shadow-[0_0_26px_rgba(0,229,255,0.35)]">
            <span className="inline-block skew-x-6">SCOUT MISSION BOARD</span>
          </a>
        </motion.div>

        {/* ticker */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 1 }} className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-3 border-y border-white/10 py-4 text-[10px] font-bold tracking-[0.2em] upperleft">
          {[
            ["SQUADS LIVE", "212"],
            ["MISSIONS DONE", "14,880"],
            ["AVG. CLEAR", "11 MIN"],
            ["RANK #1 ELYOS", "✦ AURIEL"],
          ].map(([label, v]) => (
            <span key={label} className="flex items-center gap-2 px-3 py-1 text-white/70">
              <span className="text-[#ff2ec4]">▮</span>{v}
              <span className="text-white/35">{label}</span>
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── Tabs ── */}
      <section id="board" className="relative z-20 mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)} className={`-skew-x-6 px-5 py-2.5 text-[9px] font-black tracking-[0.24em] uppercase transition-all duration-200 ${activeTab === t ? "bg-gradient-to-r from-[#ff2ec4] to-[#00e5ff] text-black shadow-[0_0_24px_rgba(255,46,196,0.55)]" : "border border-white/15 text-white/45 hover:border-[#00e5ff]/60 hover:text-[#00e5ff]"}`}>
              <span className="inline-block skew-x-6">{t}</span>
            </button>
          ))}
        </div>
        <div className="scanline-grad mt-5 h-0.5 w-full" />
      </section>

      {/* ── Content ── */}
      <main className="relative z-20 mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Offers */}
          <div>
            <div className="mb-5 flex items-center justify-between border border-white/10 bg-black/50 px-4 py-2.5">
              <span className="flex items-center gap-2 text-[10px] font-black tracking-[0.26em] text-white"><Zap className="h-3.5 w-3.5 text-[#ff2ec4]" /> SORTED // {activeTab.toUpperCase()}</span>
              <span className="hidden text-[9px] tracking-widest text-white/35 sm:block">TAB // SWITCH ↑↓</span>
            </div>

            <div className="space-y-3.5">
              <AnimatePresence mode="popLayout">
                {visible.map((o, i) => (
                  <motion.button
                    key={o.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    onMouseEnter={() => setHovered(o.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setHovered(o.id)}
                    className={`group relative block w-full border-2 px-5 py-4 text-left transition-all duration-200 ${hovered === o.id ? "border-[#ff2ec4] bg-[#ff2ec4]/[0.06] shadow-[0_0_30px_rgba(255,46,196,0.25)]" : "border-white/10 bg-white/[0.02] hover:border-[#00e5ff]/60 hover:bg-white/[0.04]"}`}
                  >
                    <Bracket cl={hovered === o.id ? "border-[#ff2ec4]" : "border-white/25 group-hover:border-[#00e5ff]" } />

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center -skew-x-6 border-2 ${hovered === o.id ? "border-[#ff2ec4] bg-[#ff2ec4]/10 text-[#ff2ec4]" : "border-white/15 text-[#00e5ff]"}`}>
                          <Skull className="h-4 w-4 skew-x-6" />
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-[13px] font-black tracking-wider uppercase transition-colors ${hovered === o.id ? "text-white" : "text-white/85"}`}>
                            <span className="text-[#ff2ec4]">▸ </span>{o.name}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-[9px] font-bold tracking-widest text-white/40 uppercase">
                            <span className="text-[#00e5ff]">{o.meta}</span>
                            <span>{o.region}</span>
                            <span className={`${o.speed === "MAX" ? "text-[#ff2ec4]" : "text-white/35"}`}>{o.speed}</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden shrink-0 items-center gap-4 sm:flex">
                        <div className={`border px-2 py-1 text-[11px] font-black ${hovered === o.id ? "border-[#ff2ec4] text-[#ff2ec4] bg-black/40" : "border-white/15 text-white/80"}`}>
                          <Coins className="mr-1 inline h-3 w-3" />{o.reward}
                        </div>
                        <span className={`flex h-8 w-8 items-center justify-center -skew-x-6 text-[12px] font-black transition-transform ${hovered === o.id ? "translate-x-1 bg-gradient-to-r from-[#ff2ec4] to-[#00e5ff] text-black skew-x-6" : "border border-white/20 text-[#00e5ff] skew-x-6"}`}>
                          <Play className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Operations feed */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="border-2 border-[#00e5ff]/30 bg-black/80">
              <Bracket cl="border-[#00e5ff]/60" />
              <div className="flex items-center justify-between border-b border-[#00e5ff]/25 bg-[#00e5ff]/[0.06] px-4 py-2.5">
                <span className="flex items-center gap-2 text-[10px] font-black tracking-[0.24em] text-[#00e5ff]"><Terminal className="h-3.5 w-3.5" /> OPERATIONS FEED</span>
                <span className="flex gap-1.5">
                  {["bg-[#ff2ec4]", "bg-[#00e5ff]", "bg-white/40"].map((c, i) => (
                    <span key={i} className={`h-2 w-2 ${c}`} />
                  ))}
                </span>
              </div>
              <div className="space-y-2.5 px-4 py-4 font-mono text-[10px] leading-relaxed">
                {[
                  ["[22:01] p0ny.ex", "joined Sanctorum squad", "#ff2ec4"],
                  ["[21:58] aghria", "completed GLORY-04", "#00e5ff"],
                  ["[21:54] xVaelor", "flagged in DREDGION-HJ", "#ff2ec4"],
                  ["[21:47] <SYS>", "server load 31% /// nominal", "#ffffff"],
                  ["[21:40] mori_", "boost LVL 1→80 finished", "#00e5ff"],
                ].map(([t, msg, c]) => (
                  <p key={t} style={{ color: c }}>
                    <span className="text-white/25">{t}</span> <span className="text-white/70">{msg}</span>
                  </p>
                ))}
                <p className="animate-pulse text-[#ff2ec4]">▮</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-2 border-white/10 bg-black/60 px-4 py-3">
              <span className="flex items-center gap-2 text-[9px] font-black tracking-[0.22em] text-white/60 uppercase"><Shield className="h-3.5 w-3.5 text-[#ff2ec4]" /> Region locked</span>
              <span className="text-[9px] font-bold tracking-widest text-white/35 uppercase">P1 // JOIN · P2 // SURF</span>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-20 border-t-2 border-white/10 px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex max-w-sm items-center gap-3">
          <span className="h-0.5 flex-1 scanline-grad" />
          <Swords className="h-4 w-4 text-[#ff2ec4]" />
          <span className="h-0.5 flex-1 scanline-grad" />
        </div>
        <p className="text-[9px] font-black tracking-[0.3em] uppercase text-white/30">
          POWERED BY UPLINK <span className="text-[#ff2ec4]">//</span> ABYSS PROTOCOL
        </p>
      </footer>
    </div>
  );
}