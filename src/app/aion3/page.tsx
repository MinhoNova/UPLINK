"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Feather, Crown, SwatchBook, Gem, Users, ArrowRight, Coins, Timer, Shield, Star, Swords,
} from "lucide-react";

/* ── DATA ── */
const OFFERS = [
  { id: "o1", name: "SANCTUM LUDRA CLEAR", category: "Dungeons", region: "US", reward: "€11.60", meta: "2 × PARTY", speed: "Priority" },
  { id: "o2", name: "SIRENES LAND EXPEDITION", category: "Dungeons", region: "EU", reward: "€4.80", meta: "4 × PARTY", speed: "Standard" },
  { id: "o3", name: "LEVEL 1 → 80 DIVINE DOT", category: "Leveling", region: "NA", reward: "€38.00", meta: "SOLO", speed: "Express" },
  { id: "o4", name: "ABYSS POINTS FARM", category: "PVP", region: "US", reward: "€6.40", meta: "1 × RUN", speed: "Standard" },
  { id: "o5", name: "CONTINENT GLORY RUN", category: "Raids", region: "EU", reward: "€22.30", meta: "8 × PARTY", speed: "Priority" },
  { id: "o6", name: "TRADE BROKER KINAH", category: "Currency", region: "NA", reward: "€12.00", meta: "10M KINAH", speed: "Express" },
];

const TABS = ["all", "Dungeons", "Leveling", "Raids", "PVP", "Currency"];

const CORNER = { position: "absolute", width: 9, height: 9, borderColor: "rgba(212,175,55,0.8)" } as const;

export default function Aion3Page() {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<string | null>("o1");
  const visible = activeTab === "all" ? OFFERS : OFFERS.filter((o) => o.category === activeTab);

  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050307] text-[#f3ecdf] selection:bg-[#d4af37] selection:text-black font-sans">
      {/* ── Ambient aurora ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.7), rgba(191,227,255,0.15), transparent)" }} />
        <div className="absolute bottom-0 left-0 h-[420px] w-[620px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(191,227,255,0.65), transparent)" }} />
        <div className="absolute bottom-10 right-0 h-[380px] w-[520px] rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(240,195,106,0.6), transparent)" }} />
      </div>

      {/* ── Floating motes ── */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 26 }).map((_, i) => (
          <span key={i} className="absolute rounded-full" style={{
            left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`,
            width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
            background: i % 2 === 0 ? "rgba(248,230,190,0.7)" : "rgba(191,227,255,0.6)",
            boxShadow: "0 0 8px 1px rgba(212,175,55,0.35)",
            animation: `mote ${7 + (i % 6)}s ease-in-out ${i * 0.4}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes mote { 0%,100% { transform: translateY(0); opacity:.25 } 50% { transform: translateY(-26px); opacity:.9 } }
        @keyframes shimmerGold { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        .gold-title { text-shadow: 0 0 24px rgba(212,175,55,.35), 0 0 80px rgba(212,175,55,.18); }
        .gold-shimmer { background: linear-gradient(100deg, transparent 30%, rgba(248,230,190,.95) 50%, transparent 70%); background-size: 200% 100%; animation: shimmerGold 3.4s linear infinite; }
        .hairline-gold { background: linear-gradient(90deg, transparent, rgba(212,175,55,.65), transparent); }
      `}</style>

      {/* ── Header ── */}
      <header className="relative z-40 border-b border-[#d4af37]/15">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Feather className="h-5 w-5 text-[#d4af37]" />
            <span className="font-serif text-2xl font-black tracking-[0.22em] text-[#f8e6be]">EL</span>
            <span className="mt-1 text-[8px] font-black tracking-[0.34em] text-[#d4af37] uppercase">Ethereal Order</span>
          </div>
          <nav className="hidden items-center gap-7 md:flex">
            {["Sanctum", "Portals", "Rites", "Archive"].map((n) => (
              <a key={n} href="#archives" className="text-[10px] font-bold tracking-[0.28em] text-[#f3ecdf]/55 uppercase transition-colors hover:text-[#f8e6be]">{n}</a>
            ))}
          </nav>
          <a href="/aion2/create-offer" className="group relative overflow-hidden rounded-full border border-[#d4af37]/60 px-6 py-2.5 text-[10px] font-black tracking-[0.22em] text-[#f8e6be] uppercase transition-all hover:border-[#f8e6be] hover:shadow-[0_0_28px_rgba(212,175,55,0.4)]">
            <span className="gold-shimmer absolute inset-0 opacity-0 group-hover:opacity-40" />
            Consecrate <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">❖</span>
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-20 mx-auto max-w-6xl px-5 pt-20 pb-16 text-center sm:pt-28">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex items-center justify-center gap-3 text-[9px] font-black tracking-[0.42em] text-[#d4af37] uppercase">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#d4af37]" />
          The Elyos Ascend
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#d4af37]" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }} className="gold-title mt-6 font-serif text-5xl font-black leading-none tracking-wide text-[#f8e6be] sm:text-7xl">
          AION <span className="italic text-[#d4af37]">III</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.35 }} className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-[#f3ecdf]/60">
          Where light is law. Enter the Elyos sanctuary and commission trusted Daevas for your raids, rites, and glory runs.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="/aion2/create-offer" className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-b from-[#f8e6be] via-[#e8c468] to-[#d4af37] px-9 py-4 text-[11px] font-black tracking-[0.2em] text-black uppercase shadow-[0_0_44px_rgba(212,175,55,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_64px_rgba(240,195,106,0.75)]">
            <Crown className="h-4 w-4 transition-transform group-hover:rotate-[14deg]" />
            Consecrate an Offer
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </a>
          <a href="#archives" className="inline-flex items-center gap-3 rounded-full border border-[#f3ecdf]/20 px-9 py-4 text-[11px] font-black tracking-[0.2em] text-[#f3ecdf]/80 uppercase transition-all hover:border-[#d4af37]/60 hover:text-[#f8e6be]">
            <SwatchBook className="h-4 w-4" /> Descend the Archive
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }} className="mx-auto mt-14 flex max-w-2xl items-center justify-center gap-3 sm:gap-6">
          {[
            ["DAEVAS", "1,702"],
            ["OFFERS", "64"],
            ["RITES DONE", "9,211"],
          ].map(([l, v], i, arr) => (
            <div key={l} className="flex items-center gap-3 sm:gap-6">
              {i > 0 && <span className="h-6 w-px hairline-gold" />}
              <div className="text-center">
                <p className="font-serif text-xl font-black text-[#f8e6be]">{v}</p>
                <p className="mt-1 text-[8px] font-black tracking-[0.28em] text-[#d4af37]/80 uppercase">{l}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Tabs ── */}
      <section className="relative z-20 mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)} className={`relative px-5 py-2.5 text-[9px] font-black tracking-[0.24em] uppercase transition-all ${activeTab === t ? "text-[#f8e6be]" : "text-[#f3ecdf]/40 hover:text-[#f3ecdf]/75"}`}>
              {activeTab === t && (
                <motion.div layoutId="a3gold" className="absolute inset-x-1 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
              )}
              {t}
            </button>
          ))}
        </div>
        <div className="mt-5 h-px w-full bg-white/[0.05]" />
      </section>

      {/* ── Content ── */}
      <main id="archives" className="relative z-20 mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Offers */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Gem className="h-4 w-4 text-[#d4af37]" />
              <h2 className="font-serif text-sm font-black tracking-[0.3em] text-[#f8e6be] uppercase">Offer Plates</h2>
              <span className="text-[#d4af37]">❖</span>
              <span className="text-[9px] font-bold tracking-widest text-[#f3ecdf]/40 uppercase">Live & Consecrated</span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {visible.map((o, i) => {
                  const isSel = selected === o.id;
                  return (
                    <motion.button key={o.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ delay: i * 0.05 }} type="button" onClick={() => setSelected(o.id)} className={`group relative w-full overflow-hidden rounded-md border px-5 py-4 text-left transition-all duration-300 ${isSel ? "border-[#d4af37]/70 bg-[#d4af37]/[0.07] shadow-[0_0_34px_rgba(212,175,55,0.14)]" : "border-[#f3ecdf]/10 bg-white/[0.02] hover:border-[#d4af37]/40 hover:bg-white/[0.04]"}`}>
                      {/* diamond corners */}
                      <span style={{ ...CORNER, top: -1, left: -1, borderTop: "1px solid", borderLeft: "1px solid" }} />
                      <span style={{ ...CORNER, top: -1, right: -1, borderTop: "1px solid", borderRight: "1px solid" }} />
                      <span style={{ ...CORNER, bottom: -1, left: -1, borderBottom: "1px solid", borderLeft: "1px solid" }} />
                      <span style={{ ...CORNER, bottom: -1, right: -1, borderBottom: "1px solid", borderRight: "1px solid" }} />

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${isSel ? "border-[#d4af37]/60 bg-[#d4af37]/15 text-[#f8e6be]" : "border-[#f3ecdf]/15 bg-white/[0.03] text-[#d4af37]"}`}>
                            <Crown className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-serif text-sm font-black tracking-wide uppercase transition-colors ${isSel ? "text-[#f8e6be]" : "text-[#f3ecdf]/85 group-hover:text-[#f8e6be]"}`}>{o.name}</p>
                            <div className="mt-1 flex items-center gap-3 text-[9px] font-bold tracking-wider text-[#f3ecdf]/45 uppercase">
                              <span>{o.meta}</span>
                              <span className="flex items-center gap-1">{o.region}</span>
                              {o.speed !== "Standard" && <span className="flex items-center gap-1 text-[#d4af37]"><Timer className="h-3 w-3" /> {o.speed}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <div className="text-right">
                            <p className="text-[8px] font-bold tracking-[0.2em] text-[#f3ecdf]/40 uppercase">Reward</p>
                            <p className="mt-0.5 flex items-center gap-1.5 font-serif text-base font-black text-[#f8e6be]"><Coins className="h-3.5 w-3.5 text-[#d4af37]" /> {o.reward}</p>
                          </div>
                          <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] transition-all ${isSel ? "border-[#d4af37] bg-[#d4af37] text-black" : "border-[#d4af37]/40 text-[#d4af37] group-hover:bg-[#d4af37]/10"}`}>❖</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-md border border-[#d4af37]/25 bg-[#0a0712]/80 p-6 backdrop-blur-md">
              <div className="mb-5 flex items-center gap-2.5 border-b border-[#d4af37]/15 pb-4">
                <Shield className="h-4 w-4 text-[#d4af37]" />
                <h3 className="font-serif text-xs font-black tracking-[0.3em] text-[#f8e6be] uppercase">Sanctuary Rites</h3>
              </div>
              <ul className="space-y-3.5">
                {[
                  ["Siren's Land", "2 Daeva · In progress"],
                  ["Kromede's Trial", "Slots open"],
                  ["Dredgion Hijack", "4 Daeva · In progress"],
                ].map(([n, d], i) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${i === 1 ? "bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.9)]" : "bg-[#f3ecdf]/25"}`} />
                    <div>
                      <p className="text-[11px] font-bold tracking-widest text-[#f3ecdf]/85 uppercase">{n}</p>
                      <p className="text-[9px] text-[#f3ecdf]/40">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <a href="/aion2/create-offer" className="mt-6 flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#f8e6be] to-[#d4af37] px-5 py-3 text-[9px] font-black tracking-[0.22em] text-black uppercase shadow-[0_0_26px_rgba(212,175,55,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(240,195,106,0.6)]">
                <Star className="h-3.5 w-3.5" /> Offer a Rite
              </a>
              <div className="mt-5 flex items-center justify-center gap-2 text-center">
                <Swords className="h-3.5 w-3.5 text-[#d4af37]" />
                <p className="text-[8px] font-bold tracking-[0.2em] text-[#f3ecdf]/40 uppercase">In the grace of the Empyrean</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-20 border-t border-[#d4af37]/15 px-6 py-10 text-center">
        <div className="mx-auto mb-5 flex max-w-xs items-center gap-3">
          <span className="h-px flex-1 hairline-gold" />
          <span className="text-[#d4af37]">❖</span>
          <span className="h-px flex-1 hairline-gold" />
        </div>
        <p className="text-[9px] font-black tracking-[0.34em] text-[#f3ecdf]/35 uppercase">
          POWERED BY UPLINK <span className="text-[#d4af37]">❖</span> ELYOS COMMAND
        </p>
      </footer>
    </div>
  );
}