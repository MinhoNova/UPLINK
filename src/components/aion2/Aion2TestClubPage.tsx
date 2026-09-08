"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Swords, Sparkles, Zap, Users, Search,
  Star, MessageSquare, ClipboardList, Bell, Shield,
  Crown, ShoppingBag, Headphones, ArrowRight, Coins
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
  { id: "chat",   icon: MessageSquare,     label: "CHAT" },
  { id: "quests", icon: ClipboardList,     label: "QUESTS" },
  { id: "star",   icon: Star,              label: "FAVORITES" },
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
    <div className="min-h-screen bg-[#030612] text-slate-100 font-sans overflow-x-hidden relative selection:bg-sky-500/30 selection:text-sky-100">

      {/* ══════════════════════════════════════════════════════════
          COPYRIGHT-FREE ORIGINAL ATMOSPHERIC BACKGROUND
          (Custom AI-Generated Celestial Citadel: Sanctum & Pandemonium)
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        {/* Scenic Background Artwork */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('/aion2-bg-citadel.webp')` }}
        />

        {/* Ambient Vignette & Cosmic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030612]/80 via-[#030612]/60 to-[#02040c]" />

        {/* Dual-Faction Living Aurora Glows:
            Left: Elyos Celestial Cyan / Right: Asmodian Void Purple */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.45, 0.25],
          } : undefined}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vh] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(2,132,199,0.12) 50%, transparent 80%)",
          }}
        />

        <motion.div
          animate={motionOn ? {
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          } : undefined}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -top-[10%] -right-[10%] w-[55vw] h-[55vh] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(107,33,168,0.12) 50%, transparent 80%)",
          }}
        />

        {/* Subtle Celestial Stardust Grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(rgba(147, 197, 253, 0.5) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          TOP NAVIGATION BAR (AION 2 CRYSTAL HEADER)
          ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-10 bg-[#030612]/75 backdrop-blur-2xl border-b border-sky-400/15 shadow-[0_4px_30px_rgba(2,132,199,0.15),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        {/* BRAND LOGO WITH WINGED CREST */}
        <div className="flex items-center gap-8">
          <a href="/aion2" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02]">
            <Image
              src="/aion2-nav-logo.webp"
              alt="AION 2"
              width={205}
              height={32}
              priority
              className="h-8 w-auto drop-shadow-[0_0_14px_rgba(56,189,248,0.6)] group-hover:drop-shadow-[0_0_22px_rgba(56,189,248,0.9)] transition-all"
            />
          </a>

          {/* MENU ITEMS (CLUB, MISSIONS, MARKET, SUPPORT) */}
          <div className="hidden lg:flex items-center gap-6">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-200 text-[11px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(56,189,248,0.3)] cursor-pointer">
              <Crown className="w-3.5 h-3.5 text-sky-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
              CLUB
            </span>

            <span className="flex items-center gap-2 text-slate-400 hover:text-sky-300 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors cursor-pointer">
              <Swords className="w-3.5 h-3.5" />
              MISSIONS
            </span>

            <span className="flex items-center gap-2 text-slate-400 hover:text-sky-300 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors cursor-pointer">
              <ShoppingBag className="w-3.5 h-3.5" />
              MARKET
            </span>

            <span className="flex items-center gap-2 text-slate-400 hover:text-sky-300 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors cursor-pointer">
              <Headphones className="w-3.5 h-3.5" />
              SUPPORT
            </span>
          </div>
        </div>

        {/* USER PROFILE & NOTIFICATIONS */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full bg-sky-500/10 border border-sky-400/20 text-slate-300 hover:text-sky-200 hover:border-sky-400/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,1)] animate-pulse" />
          </button>

          {/* User badge with avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-sky-400/20">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.4)]">
              <Image
                src="/aion2-avatar.webp"
                alt="Omar Saleh"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white text-[11px] font-bold tracking-[0.18em] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                OMAR SALEH
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-purple-500/20 border border-sky-400/30 text-sky-300 font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                CLUB
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION (THE MASTERPIECE AION 2 PANORAMA BANNER)
          (Light Elyos Angel on Left · Dark Asmodian on Right)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-6 px-4 md:px-8 max-w-[1500px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden border border-sky-400/25 shadow-[0_10px_50px_rgba(2,132,199,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] group"
        >
          {/* Panoramic Hero Banner Artwork */}
          <div className="relative w-full aspect-[1774/490] min-h-[300px]">
            <Image
              src="/aion2-hero-banner.webp"
              alt="AION 2 - Find Your Crew"
              fill
              priority
              className="object-cover object-center"
            />

            {/* Seamless gradient fade at edges */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#030612]/60" />

            {/* Interactive Clickable Area matching "CREATE YOUR OFFER" in the banner */}
            <div className="absolute inset-x-0 bottom-[12%] sm:bottom-[14%] md:bottom-[15%] flex items-center justify-center">
              <a
                href="/aion2/create-offer"
                className="relative group/btn inline-flex items-center justify-center px-10 py-3 sm:px-14 sm:py-3.5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_rgba(56,189,248,0.8)]"
              >
                {/* Dynamic animated glow sweep over button */}
                <span className="absolute inset-0 bg-gradient-to-r from-sky-400/30 via-purple-500/40 to-cyan-400/30 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-full" />
                <span className="sr-only">Create Your Offer</span>
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FILTER TABS (CRYSTAL FROST CAPSULES)
          (Dungeons · Leveling · Boosts · PvP)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative z-20 max-w-[1500px] mx-auto px-4 md:px-8 mt-4 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {FILTER_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center justify-center gap-3 px-8 py-3.5 rounded-full text-xs font-black tracking-[0.22em] uppercase transition-all duration-300 backdrop-blur-2xl ${
                  isActive
                    ? "bg-gradient-to-r from-sky-500/25 via-blue-600/20 to-purple-600/25 text-white border border-sky-300/60 shadow-[0_0_30px_rgba(56,189,248,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] scale-[1.02]"
                    : "bg-[#040a1c]/60 text-slate-400 border border-sky-400/20 hover:text-sky-200 hover:border-sky-400/40 hover:bg-sky-500/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                }`}
              >
                <Icon className={`w-4 h-4 transition-all ${isActive ? "text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,1)]" : "text-slate-500"}`} />
                <span>{tab.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeFilterTab"
                    className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-12 h-[2px] bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,1)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MAIN LAYOUT: (MINI DOCK + AVAILABLE OFFERS + ONGOING MISSIONS)
          ══════════════════════════════════════════════════════════ */}
      <div className="relative z-20 max-w-[1500px] mx-auto px-4 md:px-8 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[56px_1fr_320px] gap-6 items-start">

          {/* ── LEFT FLOATING MINI SIDEBAR (MINI DOCK) ── */}
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
                      ? "bg-gradient-to-br from-sky-500/30 to-purple-600/30 text-sky-200 border border-sky-300/60 shadow-[0_0_20px_rgba(56,189,248,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                      : "bg-[#040a1c]/60 text-slate-400 border border-sky-400/20 hover:text-sky-200 hover:border-sky-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? "drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" : ""}`} />
                  {active && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,1)]" />
                  )}
                </button>
              );
            })}
          </aside>

          {/* ── CENTER: AVAILABLE OFFERS (MATCHING MOCKUP 1:1) ── */}
          <section className="min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-sky-400/15">
              <div className="flex items-center gap-2.5">
                <span className="text-sky-400 text-base drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]">✦</span>
                <h3 className="text-sm font-black tracking-[0.25em] text-white uppercase font-serif">
                  AVAILABLE OFFERS
                </h3>
                <span className="text-sky-400 text-base drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]">✦</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                <span className="text-[9px] font-black tracking-widest text-emerald-300 uppercase">
                  NEW OFFERS ONLINE
                </span>
              </div>
            </div>

            {/* Offers Cards with Scenic Artworks */}
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
                    className="relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#050c20]/80 via-[#07122e]/65 to-[#040a1b]/80 backdrop-blur-2xl border border-sky-400/25 hover:border-sky-300/60 shadow-[0_8px_32px_rgba(2,132,199,0.15),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_45px_rgba(56,189,248,0.35),inset_0_1px_2px_rgba(255,255,255,0.3)] p-4 sm:p-5 transition-all duration-300 cursor-pointer"
                  >
                    {/* Scenic Artwork Vignette on the right with smooth blend */}
                    <div className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/2 pointer-events-none overflow-hidden">
                      <Image
                        src={offer.scenicImage}
                        alt={offer.name}
                        fill
                        className="object-cover object-center opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                      />
                      {/* Smooth gradient mask to blend into card background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#050c20] via-[#050c20]/70 to-transparent" />
                    </div>

                    {/* Card Content (Foreground) */}
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      {/* Left: Crest + Info */}
                      <div className="flex items-center gap-4 sm:gap-5">
                        {/* Aion Rank Crest */}
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-sky-950/60 border border-sky-400/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:border-sky-300 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] transition-all">
                          <Image
                            src="/aion2-rank-crest.webp"
                            alt="Crest"
                            width={50}
                            height={50}
                            className="object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                          />
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-black tracking-[0.16em] text-white uppercase group-hover:text-sky-200 transition-colors">
                            {offer.name}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                            {/* Players */}
                            <span className="flex items-center gap-1.5 text-xs font-bold text-sky-100/90">
                              {offer.playersMeta}
                              <Users className="w-3.5 h-3.5 text-sky-400" />
                            </span>

                            {/* Region */}
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-400/20 text-[10px] font-black text-sky-200">
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

                      {/* Right: Quick action arrow */}
                      <div className="relative z-10 hidden sm:flex items-center">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-300 group-hover:bg-sky-400 group-hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Neon Accent Highlight on Hover */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(56,189,248,1)]" />
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayOffers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#040a1c]/60 backdrop-blur-2xl border border-sky-400/20 shadow-[0_8px_32px_rgba(2,132,199,0.1)]">
                  <Search className="w-8 h-8 text-sky-400/50 mb-3 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-200/60">
                    No active offers in this category
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT ASIDE: ONGOING MISSIONS (MATCHING MOCKUP 1:1) ── */}
          <aside className="w-full">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#050c20]/80 via-[#07122e]/60 to-[#030715]/80 backdrop-blur-2xl border border-sky-400/25 shadow-[0_8px_32px_rgba(2,132,199,0.15),inset_0_1px_1px_rgba(255,255,255,0.15)] p-5">
              {/* Header */}
              <div className="flex items-center gap-2.5 pb-3 mb-5 border-b border-sky-400/15">
                <Shield className="w-4 h-4 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                <h3 className="text-xs font-black tracking-[0.2em] text-white uppercase font-serif">
                  ONGOING MISSIONS
                </h3>
              </div>

              {/* Glowing Hologram Sigil & Radar Rings */}
              <div className="flex flex-col items-center text-center py-8">
                <div className="relative mb-5 flex items-center justify-center">
                  {/* Cyan / Violet Core Glow */}
                  <div className="absolute w-24 h-24 rounded-full bg-sky-400/20 blur-2xl animate-pulse" />

                  {/* Rotating Hologram Radar Rings */}
                  <motion.div
                    animate={motionOn ? { rotate: 360 } : undefined}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border border-dashed border-sky-400/30 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,1)] -translate-y-10" />
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

                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-200">
                  NO ACTIVE MISSIONS
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium max-w-[200px]">
                  Join an offer or create your crew to start an adventure.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM FIXED STATUS BAR
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-sky-400/15 bg-[#030612]/75 backdrop-blur-2xl shadow-[0_-4px_30px_rgba(2,132,199,0.12),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-around h-full px-6 max-w-5xl mx-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer ${
                activeTab === tab.key
                  ? "text-sky-200 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                  : "text-slate-400 hover:text-sky-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex items-center gap-2 pl-4 border-l border-sky-400/20 text-[9px] font-bold text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shadow-[0_0_8px_rgba(56,189,248,1)]" />
            LIVE LINKED
          </div>
        </div>
      </div>

    </div>
  );
}
