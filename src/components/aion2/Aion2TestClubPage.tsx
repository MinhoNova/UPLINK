"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Swords, Sparkles, Zap, Users, Search,
  Star, MessageSquare, ClipboardList, Shield,
  Coins, ArrowRight
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useFlag } from "@/lib/siteFlags";

/* ── FILTER TABS ── */
const FILTER_TABS = [
  { label: "DUNGEONS", key: "Dungeons", icon: Shield },
  { label: "LEVELING", key: "Leveling", icon: Sparkles },
  { label: "BOOSTS", key: "Boosts", icon: Zap },
  { label: "PVP", key: "PVP", icon: Swords },
];

/* ── MINI DOCK ── */
const MINI_DOCK = [
  { id: "chat",   icon: MessageSquare, label: "CHAT" },
  { id: "quests", icon: ClipboardList, label: "QUESTS" },
  { id: "star",   icon: Star,          label: "FAVORITES" },
];

/* ── SEED OFFERS ── */
interface OfferCard {
  id: string;
  name: string;
  category: string;
  region: "US" | "EU";
  playersMeta: string;
  rewardLabel: string;
  scenicImage: string;
}

const SEED_OFFERS: OfferCard[] = [
  {
    id: "seed-1",
    name: "DUNGEON BOOST",
    category: "Dungeons",
    region: "US",
    playersMeta: "4 × +10",
    rewardLabel: "25K PER RUN",
    scenicImage: "/aion2-card-citadel.webp",
  },
  {
    id: "seed-2",
    name: "LEVELING 1-80",
    category: "Leveling",
    region: "EU",
    playersMeta: "4 × +10",
    rewardLabel: "50K PER RUN",
    scenicImage: "/aion2-card-dragon.webp",
  },
];

export default function Aion2TestClubPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("Dungeons");
  const [activeDock, setActiveDock] = useState("chat");
  const motionOn = useFlag("uplink_bg_motion", true);

  const displayOffers = useMemo(
    () => SEED_OFFERS.filter(o => o.category.toLowerCase() === activeTab.toLowerCase()),
    [activeTab]
  );

  return (
    <div className="min-h-screen text-slate-100 font-sans overflow-x-hidden relative selection:bg-cyan-500/30 selection:text-cyan-100">

      {/* ══════════════════════════════════════════════════════════
          COPYRIGHT-FREE LIVING AION 2 BACKGROUND
          (Custom AI-Generated Celestial Citadel: Sanctum & Pandemonium)
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        {/* Full Scenic Background Artwork — clearly visible behind glass */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
          style={{ backgroundImage: `url('/aion2-bg-citadel.webp')` }}
        />

        {/* Soft Vignette Overlay for Crisp Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030612]/65 via-[#030612]/30 to-[#02040b]/85" />

        {/* Dual-Faction Living Aurora Glows:
            Left: Elyos Celestial Cyan / Right: Asmodian Void Purple */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.18, 1],
            opacity: [0.3, 0.5, 0.3],
            y: [0, 20, 0],
          } : undefined}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[55vw] h-[60vh] rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(2,132,199,0.12) 50%, transparent 80%)",
          }}
        />

        <motion.div
          animate={motionOn ? {
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.45, 0.25],
            y: [0, -25, 0],
          } : undefined}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -top-[10%] -right-[10%] w-[55vw] h-[60vh] rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.28) 0%, rgba(107,33,168,0.12) 50%, transparent 80%)",
          }}
        />

        {/* Subtle Celestial Star Grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(rgba(147, 197, 253, 0.5) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION (CLEAN, SEAMLESS, TRANSPARENT)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-8 sm:pt-28 sm:pb-12 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Center Glow Beacon */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-[500px] h-[260px] rounded-full blur-[100px] opacity-35"
            style={{
              background: "radial-gradient(ellipse, rgba(56,189,248,0.3) 0%, rgba(168,85,247,0.2) 50%, transparent 80%)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
          {/* Eyebrow Accent Line */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-3"
          >
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-cyan-400/60" />
            <span className="text-[11px] font-black tracking-[0.35em] text-cyan-300 uppercase drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]">
              AION 2 · CLUB REALM
            </span>
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-purple-400/60" />
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-3"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.2em] uppercase font-serif drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-100 to-sky-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.45)]">
                FIND YOUR CREW
              </span>
            </h1>

            {/* Subtitle / Services */}
            <p className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-slate-300 flex items-center justify-center gap-3">
              <span>DUNGEONS</span>
              <span className="text-cyan-400 text-xs drop-shadow-[0_0_6px_rgba(56,189,248,1)]">✦</span>
              <span>RAIDS</span>
              <span className="text-purple-400 text-xs drop-shadow-[0_0_6px_rgba(168,85,247,1)]">✦</span>
              <span>LEVELING</span>
            </p>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-medium leading-relaxed">
              Find trusted players and elite squads for your next adventure.
            </p>
          </motion.div>

          {/* Glowing CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-8"
          >
            <a
              href="/aion2/create-offer"
              className="relative group inline-flex items-center justify-center rounded-full p-[1.5px] overflow-hidden shadow-[0_0_35px_rgba(56,189,248,0.35)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] transition-all duration-500 hover:scale-105 active:scale-95"
            >
              {/* Animated Gradient Border */}
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-sky-400 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />

              {/* Glass Button Body */}
              <div className="relative bg-[#060b1e]/75 hover:bg-[#060b1e]/60 backdrop-blur-2xl px-12 py-3.5 sm:px-14 sm:py-4 rounded-full flex items-center gap-3 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all">
                <span className="text-xs font-black tracking-[0.28em] uppercase text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                  {t("hero_create") || "Create Your Offer"}
                </span>
                <span className="text-cyan-300 group-hover:translate-x-1 transition-transform font-bold">›</span>
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FILTER TABS (ULTRA-GLASS CAPSULES)
          (Dungeons · Leveling · Boosts · PvP)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative z-20 max-w-[1600px] mx-auto px-6 mb-10 flex justify-center">
        <div className="flex items-center gap-2 p-1.5 bg-[#070d24]/35 backdrop-blur-2xl rounded-full border border-cyan-400/20 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]">
          {FILTER_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-full text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/25 via-blue-600/20 to-purple-600/25 text-white border border-cyan-300/50 shadow-[0_0_25px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]"
                    : "text-slate-400 hover:text-cyan-200 hover:bg-white/[0.05]"
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" : "text-slate-500"}`} />
                <span>{tab.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-cyan-300 rounded-full shadow-[0_0_10px_rgba(56,189,248,1)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT GRID (ULTRA-TRANSPARENT GLASS PANELS)
          ══════════════════════════════════════════════════════════ */}
      <main className="relative z-20 max-w-[1600px] mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[56px_1fr_320px] gap-8 items-start">

          {/* ── 1. LEFT MINI DOCK (TRANSPARENT GLASS BUTTONS) ── */}
          <aside className="hidden lg:flex flex-col gap-3.5 mt-1">
            {MINI_DOCK.map(item => {
              const Icon = item.icon;
              const active = activeDock === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveDock(item.id)}
                  title={item.label}
                  className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-2xl ${
                    active
                      ? "bg-gradient-to-br from-cyan-500/30 to-purple-600/30 text-cyan-200 border border-cyan-300/50 shadow-[0_0_20px_rgba(56,189,248,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)]"
                      : "bg-[#070d24]/35 text-slate-400 border border-cyan-400/20 hover:text-cyan-200 hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? "drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" : ""}`} />
                  {active && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,1)]" />
                  )}
                </button>
              );
            })}
          </aside>

          {/* ── 2. CENTER: AVAILABLE OFFERS (TRANSPARENT GLASS CARDS) ── */}
          <section className="min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-cyan-400/15">
              <div className="flex items-center gap-2.5">
                <span className="text-cyan-400 text-sm drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]">✦</span>
                <h3 className="text-sm font-black tracking-[0.25em] text-white uppercase font-serif">
                  AVAILABLE OFFERS
                </h3>
                <span className="text-cyan-400 text-sm drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]">✦</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                <span className="text-[9px] font-black tracking-widest text-emerald-300 uppercase">
                  NEW OFFERS ONLINE
                </span>
              </div>
            </div>

            {/* Offer List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {displayOffers.map(offer => (
                  <motion.div
                    key={offer.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    whileHover={{ scale: 1.006 }}
                    transition={{ duration: 0.3 }}
                    className="relative group overflow-hidden rounded-2xl bg-[#060c22]/35 hover:bg-[#060c22]/50 backdrop-blur-2xl border border-cyan-400/20 hover:border-cyan-300/50 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)] hover:shadow-[0_12px_40px_rgba(56,189,248,0.25),inset_0_1px_2px_rgba(255,255,255,0.25)] p-4 sm:p-5 transition-all duration-300 cursor-pointer"
                  >
                    {/* Scenic Artwork Vignette on the right (fades into glass card) */}
                    <div className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/2 pointer-events-none overflow-hidden">
                      <Image
                        src={offer.scenicImage}
                        alt={offer.name}
                        fill
                        className="object-cover object-center opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700"
                      />
                      {/* Gradient mask blending image smoothly into glass */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#060c22] via-[#060c22]/60 to-transparent" />
                    </div>

                    {/* Card Content (Foreground) */}
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      {/* Left: Crest + Info */}
                      <div className="flex items-center gap-4 sm:gap-5">
                        {/* Aion Rank Crest */}
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-cyan-950/40 border border-cyan-400/35 flex items-center justify-center flex-shrink-0 shadow-[0_0_18px_rgba(56,189,248,0.25)] group-hover:border-cyan-300 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all">
                          <Image
                            src="/aion2-rank-crest.webp"
                            alt="Crest"
                            width={48}
                            height={48}
                            className="object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                          />
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-black tracking-[0.16em] text-white uppercase group-hover:text-cyan-200 transition-colors">
                            {offer.name}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                            {/* Players */}
                            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-100/90">
                              {offer.playersMeta}
                              <Users className="w-3.5 h-3.5 text-cyan-400" />
                            </span>

                            {/* Region */}
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20 text-[10px] font-black text-cyan-200">
                              <Image
                                src={offer.region === "EU" ? "/flags/eu.svg" : "/flags/us.svg"}
                                alt={offer.region}
                                width={13}
                                height={9}
                                className="rounded-sm"
                              />
                              {offer.region}
                            </span>

                            {/* Reward Gold Pill */}
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-[10px] font-black text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                              <Coins className="w-3 h-3 text-amber-400" />
                              {offer.rewardLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Arrow */}
                      <div className="relative z-10 hidden sm:flex items-center">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Neon Accent Highlight on Hover */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(56,189,248,1)]" />
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayOffers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#060c22]/30 backdrop-blur-2xl border border-cyan-400/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <Search className="w-8 h-8 text-cyan-400/50 mb-3 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-200/60">
                    No active offers in this category
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── 3. RIGHT ASIDE: ONGOING MISSIONS (TRANSPARENT GLASS PANEL) ── */}
          <aside className="w-full">
            <div className="relative rounded-2xl bg-[#060c22]/35 backdrop-blur-2xl border border-cyan-400/20 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)] p-6">
              {/* Header */}
              <div className="flex items-center gap-2.5 pb-3 mb-6 border-b border-cyan-400/15">
                <Shield className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                <h3 className="text-xs font-black tracking-[0.2em] text-white uppercase font-serif">
                  ONGOING MISSIONS
                </h3>
              </div>

              {/* Glowing Hologram Sigil & Radar Rings */}
              <div className="flex flex-col items-center text-center py-8">
                <div className="relative mb-5 flex items-center justify-center">
                  {/* Cyan / Violet Core Glow */}
                  <div className="absolute w-24 h-24 rounded-full bg-cyan-400/20 blur-2xl animate-pulse" />

                  {/* Rotating Hologram Radar Rings */}
                  <motion.div
                    animate={motionOn ? { rotate: 360 } : undefined}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(56,189,248,1)] -translate-y-10" />
                  </motion.div>

                  {/* Mission Sigil Image */}
                  <div className="absolute w-12 h-12 flex items-center justify-center">
                    <Image
                      src="/aion2-mission-sigil.webp"
                      alt="Mission Sigil"
                      width={48}
                      height={48}
                      className="object-contain drop-shadow-[0_0_10px_rgba(56,189,248,1)] animate-pulse"
                    />
                  </div>
                </div>

                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-200">
                  NO ACTIVE MISSIONS
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium max-w-[200px]">
                  Join an offer or create your crew to start an adventure.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </main>

    </div>
  );
}
