"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Swords, Shield, Coins, Bell, ChevronDown, Zap, Users, Search,
  Crown, Sparkles, Flame, Gem, Skull, Star, BookOpen,
  ArrowRight, Clipboard, Settings, Trophy, Eye, Timer,
} from "lucide-react";

/* ── NAV ── */
const NAV_ITEMS = [
  { label: "CLUB", icon: Crown, href: "#club", active: true },
  { label: "CLASSES", icon: BookOpen, href: "/aion2/classes" },
  { label: "MISSIONS", icon: Swords, href: "#offers" },
  { label: "MARKET", icon: Coins, href: "#offers" },
  { label: "SUPPORT", icon: Search, href: "#support" },
];

/* ── FILTER TABS ── */
const FILTER_TABS = [
  { label: "DUNGEONS", key: "Dungeons", icon: Swords },
  { label: "LEVELING", key: "Leveling", icon: Sparkles },
  { label: "BOOSTS", key: "Boosts", icon: Zap },
  { label: "PVP", key: "PVP", icon: Flame },
];

/* ── MINI SIDEBAR ICONS ── */
const MINI_DOCK = [
  { id: "home", icon: Crown, label: "HOME" },
  { id: "quests", icon: Clipboard, label: "QUESTS" },
  { id: "settings", icon: Settings, label: "CODE" },
  { id: "star", icon: Star, label: "RANK" },
];

/* ── SEED OFFERS ── */
interface OfferCard {
  id: string;
  serviceId: string;
  name: string;
  category: string;
  quantity: number;
  priceUsd: number;
  paymentMethod: "kinah" | "cash";
  speed: string;
  region: "US" | "EU" | "NA";
  owner: string;
  ownerClass: string;
  playersMeta: string;
  rewardLabel: string;
  bgPosition: string;
  createdAt: number;
}

const SEED_OFFERS: OfferCard[] = [
  {
    id: "seed-1",
    serviceId: "dungeon-boost",
    name: "DUNGEON BOOST",
    category: "Dungeons",
    quantity: 4,
    priceUsd: 25,
    paymentMethod: "kinah",
    speed: "Express",
    region: "US",
    owner: "Kael\u2019thas",
    ownerClass: "Gladiator",
    playersMeta: "4 \u00d7 +10",
    rewardLabel: "25K PER RUN",
    bgPosition: "center 38%",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "seed-2",
    serviceId: "powerleveling",
    name: "LEVELING 1\u201380",
    category: "Leveling",
    quantity: 4,
    priceUsd: 50,
    paymentMethod: "kinah",
    speed: "Super Express",
    region: "EU",
    owner: "Nerezza",
    ownerClass: "Spiritmaster",
    playersMeta: "4 \u00d7 +10",
    rewardLabel: "50K PER RUN",
    bgPosition: "52% 58%",
    createdAt: Date.now() - 7200000,
  },
];

/* ── SMALL DECORATIVE HELPERS ── */
function Rule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-cyan-300/70 ${className}`}>
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-300/60" />
      <span className="text-[8px] leading-none">&#10022;</span>
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-300/60" />
    </div>
  );
}

function CornerFrame() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-cyan-300/50" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-cyan-300/50" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-cyan-300/50" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-cyan-300/50" />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export default function Aion2ClubPage() {
  const [activeTab, setActiveTab] = useState("Dungeons");
  const [activeDock, setActiveDock] = useState("home");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* Hide the global UPLINK navbar so only our custom header shows */
  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  const filteredOffers = useMemo(() => {
    if (activeTab === "all") return SEED_OFFERS;
    return SEED_OFFERS.filter((o) => o.category.toLowerCase() === activeTab.toLowerCase());
  }, [activeTab]);

  /* Show all offers when category filter returns empty */
  const displayOffers = filteredOffers.length > 0 ? filteredOffers : SEED_OFFERS;

  return (
    <div className="min-h-screen bg-[#030410] text-white relative selection:bg-cyan-500 selection:text-black font-sans overflow-x-hidden">

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes scrollLine { 0% { transform: scaleY(0); transform-origin: top; } 45% { transform: scaleY(1); transform-origin: top; } 55% { transform: scaleY(1); transform-origin: bottom; } 100% { transform: scaleY(0); transform-origin: bottom; } }
        @keyframes pulseGlow { 0%,100% { opacity:.35; } 50% { opacity:.8; } }
        .hero-title { text-shadow: 0 0 18px rgba(120,220,255,.55), 0 0 60px rgba(120,90,255,.35); }
        .shimmer-line { background: linear-gradient(100deg, transparent 20%, rgba(165,243,252,.9) 50%, transparent 80%); background-size: 200% 100%; animation: shimmer 3.2s linear infinite; }
        .card-haa { border:1px solid transparent; background: linear-gradient(#070a1c,#070a1c) padding-box, linear-gradient(135deg, rgba(34,211,238,.35), rgba(168,85,247,.12) 45%, rgba(34,211,238,.05)) border-box; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-[#04050f]/80 border-b border-cyan-200/[0.12] shadow-[0_8px_42px_rgba(0,0,0,0.7)]">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <a href="#club" className="flex items-center gap-2 group cursor-pointer select-none">
            <span className="relative">
              <span className="absolute -inset-1.5 rounded-full bg-cyan-400/20 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <Swords className="relative h-6 w-6 text-cyan-200" />
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent font-serif">AION</span>
            <span className="text-2xl sm:text-3xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent font-serif">2</span>
          </a>

          {/* Center nav pills */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = !!item.active;
              return (
                <a key={item.label} href={item.href} className={active ? "relative flex items-center gap-2 px-5 py-2 text-[11px] font-black tracking-[0.18em] text-cyan-100" : "flex items-center gap-2 px-5 py-2 text-[11px] font-black tracking-[0.18em] text-gray-400 hover:text-white transition-colors"}>
                  <Icon className={active ? "w-3.5 h-3.5 text-cyan-300" : "w-3.5 h-3.5 text-gray-500"} />
                  <span>{item.label}</span>
                  {active && (
                    <>
                      <span className="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_10px_rgba(34,211,238,.9)]" />
                      <span className="absolute inset-0 bg-cyan-400/[0.06]" />
                    </>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right: bell + user */}
          <div className="flex items-center gap-3">
            <button type="button" className="relative w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-gray-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-all cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,1)]" />
            </button>

            {/* User capsule */}
            <div className="relative">
              <button type="button" onClick={() => setUserMenuOpen((p) => !p)} className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-[#0b0e22]/80 border border-purple-400/25 hover:border-cyan-400/50 transition-all group cursor-pointer">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-cyan-300/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500/40 via-sky-600/30 to-purple-600/40 flex items-center justify-center text-[10px] font-black text-cyan-100">OS</div>
                </div>
                <div className="text-left flex items-center gap-2">
                  <span className="text-[11px] font-black tracking-wider text-white uppercase">OMAR SALEH</span>
                  <span className="px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">CLUB</span>
                </div>
                <ChevronDown className={userMenuOpen ? "w-3.5 h-3.5 text-gray-400 rotate-180 transition-transform" : "w-3.5 h-3.5 text-gray-400 transition-transform"} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-full mt-2 w-48 bg-[#090c1e]/98 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-1.5">
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</div>
                      <div className="text-xs font-black text-cyan-300 truncate">Omar Saleh</div>
                    </div>
                    {["Profile", "My Missions", "Kinah Wallet", "Settings"].map((item) => (
                      <button key={item} type="button" onClick={() => setUserMenuOpen(false)} className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-gray-300 hover:text-cyan-200 hover:bg-cyan-500/10 transition-all flex items-center justify-between cursor-pointer">
                        <span>{item}</span>
                        <ArrowRight className="w-3 h-3 opacity-40" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section id="club" className="relative min-h-[640px] sm:min-h-[700px] lg:min-h-[760px] flex items-center justify-center overflow-hidden pt-16">

        {/* Full-width animated video background */}
        <video className="absolute inset-0 w-full h-full object-cover pointer-events-none" autoPlay muted loop playsInline preload="metadata">
          <source src="/aion%202%20bg%20small.mp4" type="video/mp4" />
        </video>

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030410] via-[#030410]/15 to-[#030410]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,10,30,0.10)_0%,rgba(3,4,12,0.35)_55%,rgba(3,4,12,0.94)_100%)] pointer-events-none" />
        <div className="absolute left-[-8%] top-[10%] h-[80%] w-[36%] bg-[radial-gradient(ellipse_at_left,rgba(84,209,255,0.25),transparent_66%)] blur-2xl pointer-events-none" style={{ animation: "pulseGlow 5s ease-in-out infinite" }} />
        <div className="absolute right-[-8%] top-[10%] h-[80%] w-[36%] bg-[radial-gradient(ellipse_at_right,rgba(154,80,255,0.25),transparent_66%)] blur-2xl pointer-events-none" style={{ animation: "pulseGlow 6s ease-in-out infinite" }} />

        {/* Floating runes */}
        {[
          { l: "8%", t: "26%", s: 18, d: "0s" },
          { l: "88%", t: "30%", s: 22, d: "1.2s" },
          { l: "16%", t: "72%", s: 14, d: "2s" },
          { l: "80%", t: "70%", s: 16, d: "0.6s" },
          { l: "50%", t: "18%", s: 12, d: "2.6s" },
        ].map((r, i) => (
          <span key={i} className="pointer-events-none absolute text-cyan-200/40 font-serif italic select-none" style={{ left: r.l, top: r.t, fontSize: r.s, animation: `floaty ${7 + i}s ease-in-out infinite`, animationDelay: r.d }}>&#10022;</span>
        ))}

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-5 pt-12 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="mb-5 flex items-center gap-3 text-[9px] font-black tracking-[0.42em] text-cyan-100/90 sm:text-[10px]">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-200/80" />
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              AION 2 COMMUNITY LOBBY
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-200/80" />
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="hero-title font-serif text-6xl font-black leading-[0.86] tracking-[0.08em] text-white sm:text-8xl lg:text-9xl">
            FIND YOUR
            <span className="mt-4 block bg-gradient-to-r from-cyan-100 via-white to-violet-300 bg-clip-text text-transparent">CREW</span>
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.8 }} className="mt-7 flex items-center gap-3 text-[10px] font-black tracking-[0.28em] text-cyan-100/90 sm:text-[11px]">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-200/70" />
            KEYS <span className="text-violet-300">&#10022;</span> BOOSTS <span className="text-violet-300">&#10022;</span> LEVELING
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-cyan-200/70" />
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-5 max-w-lg text-sm font-medium leading-relaxed text-slate-200/90 sm:text-base">
            Find trusted Daevas for your next dungeon, leveling route, or ranked push.
          </motion.p>

          {/* CTA — jewel-like double border */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="relative mt-9">
            <a href="/aion2/create-offer" className="group relative inline-flex min-w-[300px] items-center justify-center overflow-hidden border border-cyan-100/80 bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-9 py-4 text-xs font-black tracking-[0.22em] text-white shadow-[0_0_0_1px_rgba(197,241,255,0.35),0_0_34px_rgba(90,120,255,0.65)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.8),0_0_52px_rgba(122,94,255,0.95)] cursor-pointer">
              <span className="absolute inset-[3px] border border-white/25 opacity-80" />
              <span className="absolute left-0 top-0 h-full w-full shimmer-line opacity-40" />
              <Sparkles className="mr-3 h-4 w-4 text-cyan-100 transition-transform group-hover:rotate-12" /> CREATE YOUR OFFER <ArrowRight className="ml-3 h-4 w-4" />
            </a>
            <p className="mt-4 text-[9px] font-black tracking-[0.28em] text-slate-300/80">FAST <span className="text-cyan-300">&#10022;</span> CLEAR <span className="text-cyan-300">&#10022;</span> NO CLUTTER</p>
          </motion.div>

          {/* Live ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.8 }} className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Users, label: "DAEVAS ONLINE", value: "1,424" },
              { icon: Swords, label: "OFFERS LIVE", value: "87" },
              { icon: Trophy, label: "MISSIONS DONE", value: "12,430" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 rounded-md border border-cyan-300/20 bg-black/30 px-4 py-2 backdrop-blur-md">
                <s.icon className="h-3.5 w-3.5 text-cyan-300" />
                <span className="text-sm font-black text-white">{s.value}</span>
                <span className="text-[8px] font-black tracking-[0.2em] text-slate-300 uppercase">{s.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-black/30 px-4 py-2 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[8px] font-black tracking-[0.2em] text-emerald-300 uppercase">LIVE</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[8px] font-black tracking-[0.3em] text-cyan-200/80 uppercase">Scroll</span>
          <div className="h-10 w-px overflow-hidden">
            <span className="block h-full w-full bg-cyan-300/80" style={{ animation: "scrollLine 1.8s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* ═══ FILTER TABS ═══ */}
      <section className="px-4 sm:px-6 relative z-20 -mt-9 mb-10">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={isActive ? "relative flex min-w-[148px] items-center justify-center gap-2.5 rounded-sm px-6 sm:px-8 py-3.5 text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer bg-gradient-to-r from-cyan-600/40 via-blue-700/50 to-purple-700/40 text-white shadow-[0_0_28px_rgba(0,229,255,0.45)] scale-105 border border-cyan-200/70" : "relative flex min-w-[148px] items-center justify-center gap-2.5 rounded-sm px-6 sm:px-8 py-3.5 text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer bg-[#070b1e]/85 text-gray-300 hover:text-white hover:border-cyan-400/60 border border-white/[0.14]"}>
                {isActive && <span className="absolute inset-[2px] border border-white/20 pointer-events-none" />}
                <Icon className={isActive ? "w-4 h-4 text-cyan-300" : "w-4 h-4 text-gray-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="max-w-[1700px] mx-auto px-4 sm:px-8 pb-20 relative z-20">
        <div className="flex gap-6 items-start">

          {/* ── Mini floating sidebar ── */}
          <aside className="hidden xl:flex flex-col items-center gap-2 pt-2 w-14 shrink-0 sticky top-24">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#060818]/90 p-2">
              {MINI_DOCK.map((item) => {
                const Icon = item.icon;
                const active = activeDock === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => setActiveDock(item.id)} title={item.label} className={active ? "relative w-10 h-10 rounded-xl bg-gradient-to-b from-cyan-500/25 to-purple-600/25 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_14px_rgba(0,255,255,0.35)] transition-all cursor-pointer" : "w-10 h-10 rounded-xl bg-transparent border border-white/[0.06] flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all cursor-pointer"}>
                    <Icon className="w-4 h-4" />
                    {active && <span className="absolute -left-[7px] h-5 w-[3px] rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,.9)]" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Content grid: offers + ongoing missions ── */}
          <div id="offers" className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

            {/* Left: Available Offers */}
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400">&#10022;</span>
                  <h3 className="text-base sm:text-lg font-black tracking-[0.25em] uppercase text-white font-serif">AVAILABLE OFFERS</h3>
                  <span className="text-cyan-400">&#10022;</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                  <span className="text-[9px] font-black tracking-widest text-cyan-200 uppercase">NEW OFFERS ONLINE</span>
                </div>
              </div>

              <div className="space-y-4">
                {displayOffers.map((offer, idx) => {
                  const isEU = offer.region === "EU";
                  return (
                    <motion.div key={offer.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} whileHover={{ y: -3 }} className="card-haa group relative overflow-hidden shadow-[0_6px_28px_rgba(0,0,0,0.55)] hover:shadow-[0_0_38px_rgba(0,229,255,0.22)] transition-all duration-300 rounded-xl">
                      <CornerFrame />

                      {/* Right ambient glow */}
                      <div className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none opacity-40 group-hover:opacity-70 transition-all duration-500" style={{ background: "radial-gradient(ellipse at right center, rgba(56,189,248,0.28), transparent 70%)" }} />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#070a1c] via-[#070a1c]/70 to-transparent pointer-events-none" />

                      {/* Card content */}
                      <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Rank diamond */}
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-gradient-to-b from-[#141b3f] to-[#0c1027] border border-cyan-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(0,255,255,0.2)] group-hover:shadow-[0_0_22px_rgba(0,255,255,0.45)] transition-all">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="url(#rkG)" />
                              <circle cx="12" cy="12" r="2" fill="#ffffff" />
                              <defs>
                                <linearGradient id="rkG" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#67e8f9" />
                                  <stop offset="1" stopColor="#a855f7" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm sm:text-base font-black tracking-wider text-white uppercase group-hover:text-cyan-200 transition-colors">{offer.name}</h4>
                              {offer.speed !== "Standard" && (
                                <span className="hidden sm:inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest border border-[#ff007f]/40 bg-[#ff007f]/10 text-[#ff9fd0]">
                                  <Timer className="w-2.5 h-2.5" /> {offer.speed}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-300">
                                <span>{offer.playersMeta}</span>
                                <Users className="w-3.5 h-3.5 text-cyan-400" />
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-black text-gray-200">
                                <Image src={isEU ? "/flags/eu.svg" : "/flags/us.svg"} alt={offer.region} width={14} height={10} className="rounded-xs" />
                                <span>{offer.region}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span>{offer.rewardLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Join button */}
                        <a href="/aion2/create-offer" className="relative shrink-0 rounded px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] border border-cyan-400/40 text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-300 transition-all cursor-pointer">
                          JOIN MISSION
                        </a>
                      </div>
                    </motion.div>
                  );
                })}

                {displayOffers.length === 0 && (
                  <div className="text-center py-16 bg-[#070919]/60 border border-white/[0.08] rounded-2xl">
                    <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">No active offers</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Ongoing Missions */}
            <aside className="w-full">
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#060818]/85 backdrop-blur-2xl p-6 shadow-[0_0_34px_rgba(0,0,0,0.6)]">
                <CornerFrame />
                <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-white/[0.08]">
                  <Shield className="w-4 h-4 text-cyan-300" />
                  <h3 className="text-xs font-black tracking-[0.25em] uppercase text-cyan-100 font-serif">ONGOING MISSIONS</h3>
                </div>

                <div className="flex flex-col items-center justify-center py-8 text-center">
                  {/* Aion triangle glyph */}
                  <div className="relative w-20 h-20 mb-4 flex items-center justify-center" style={{ animation: "floaty 6s ease-in-out infinite" }}>
                    <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                    <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
                      <path d="M50 8L92 82H8L50 8Z" stroke="url(#gG)" strokeWidth="2.5" fill="rgba(6,182,212,0.04)" />
                      <circle cx="50" cy="54" r="20" stroke="url(#gG)" strokeWidth="1.5" strokeDasharray="4 3" />
                      <circle cx="50" cy="54" r="5" fill="#38bdf8" />
                      <circle cx="50" cy="54" r="9" stroke="#38bdf8" strokeWidth="1" opacity="0.5" />
                      <line x1="50" y1="34" x2="50" y2="22" stroke="#a5f3fc" strokeWidth="1.5" />
                      <line x1="33" y1="63" x2="22" y2="69" stroke="#a5f3fc" strokeWidth="1.5" />
                      <line x1="67" y1="63" x2="78" y2="69" stroke="#a5f3fc" strokeWidth="1.5" />
                      <defs>
                        <linearGradient id="gG" x1="50" y1="8" x2="50" y2="82" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#a5f3fc" />
                          <stop offset="0.5" stopColor="#38bdf8" />
                          <stop offset="1" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">NO ACTIVE MISSIONS</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-1.5 max-w-[200px] leading-relaxed">Create or accept an offer to embark on your Daeva journey.</p>

                  <a href="/aion2/create-offer" className="group relative mt-5 inline-flex items-center gap-2 overflow-hidden rounded-md border border-cyan-400/40 bg-cyan-500/10 px-5 py-2.5 text-[9px] font-black tracking-[0.2em] uppercase text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-300 transition-all cursor-pointer">
                    <Sparkles className="w-3 h-3" /> START AN OPERATION
                  </a>
                </div>
              </div>

              <div id="support" className="card-haa mt-4 rounded-xl p-5">
                <div className="flex items-center gap-2 text-[9px] font-black text-cyan-300 uppercase tracking-widest mb-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> AION 2 EGYPTIAN COMMUNITY
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Join hundreds of Egyptian Daevas on Discord for daily Abyss runs, trading &amp; voice rooms.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 py-9 text-center border-t border-white/[0.06] relative z-20">
        <Rule className="mb-4 justify-center" />
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">
          POWERED BY UPLINK <span className="text-cyan-400 mx-2">&#10022;</span> AION 2 COMMUNITY LOBBY
        </p>
      </footer>

      </div>
  );
}