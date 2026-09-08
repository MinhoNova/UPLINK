"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Swords, Sparkles, Zap, Users, Search,
  Star, MessageSquare, ClipboardList, Bell, Shield, Radio, ArrowRight
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
}

const SEED_OFFERS: OfferCard[] = [
  {
    id: "seed-1",
    name: "DUNGEON BOOST",
    category: "Dungeons",
    region: "US",
    playersMeta: "4 × +10",
    rewardLabel: "25K PER RUN",
  },
  {
    id: "seed-2",
    name: "LEVELING 1-80",
    category: "Leveling",
    region: "EU",
    playersMeta: "4 × +10",
    rewardLabel: "50K PER RUN",
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
    <div className="min-h-screen bg-[#020713] text-slate-100 font-sans overflow-x-hidden relative selection:bg-sky-500/30 selection:text-sky-100">

      {/* ══════════════════════════════════════════════════════════
          LIVING SKY-BLUE AURORA & AMBIENT GLOWS
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Base cosmic gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020713] via-[#040e24] to-[#01040b]" />

        {/* Ambient Celestial Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.4) 1px, transparent 1px)`,
            backgroundSize: "36px 36px"
          }}
        />

        {/* Floating Glowing Aura 1: Top Center Sky Light */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.18, 1],
            opacity: [0.35, 0.55, 0.35],
            y: [0, 25, 0],
          } : undefined}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] left-[20%] w-[60vw] h-[55vh] rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.32) 0%, rgba(2,132,199,0.18) 45%, transparent 75%)",
          }}
        />

        {/* Floating Glowing Aura 2: Right Cyan Nebula */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.25, 0.95, 1],
            opacity: [0.25, 0.45, 0.25],
            x: [0, -35, 0],
            y: [0, 40, 0],
          } : undefined}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[25%] -right-[10%] w-[50vw] h-[60vh] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(14,165,233,0.28) 0%, rgba(3,105,161,0.15) 50%, transparent 80%)",
          }}
        />

        {/* Floating Glowing Aura 3: Left Deep Indigo/Sapphire Glow */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
            y: [0, -30, 0],
          } : undefined}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[50%] -left-[15%] w-[55vw] h-[55vh] rounded-full blur-[150px]"
          style={{
            background: "radial-gradient(circle, rgba(2,132,199,0.22) 0%, rgba(30,58,138,0.2) 50%, transparent 80%)",
          }}
        />

        {/* Floating Glowing Aura 4: Bottom Center Horizon */}
        <motion.div
          animate={motionOn ? {
            opacity: [0.15, 0.3, 0.15],
            scale: [1, 1.1, 1],
          } : undefined}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[25%] w-[50vw] h-[35vh] rounded-full blur-[110px]"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.25) 0%, transparent 70%)",
          }}
        />

        {/* Subtle Light Rays / Aurora Beams */}
        <div className="absolute inset-0 opacity-[0.07]">
          {["15%", "35%", "65%", "85%"].map((left, i) => (
            <div
              key={i}
              className="absolute inset-y-0 w-[1px]"
              style={{
                left,
                background: "linear-gradient(to bottom, transparent, rgba(56,189,248,0.9), transparent)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TOP NAVIGATION BAR (PREMIUM SKY GLASS)
          ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-6 lg:px-12 bg-[#020713]/60 backdrop-blur-2xl border-b border-sky-400/15 shadow-[0_4px_30px_rgba(2,132,199,0.12),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-10">
          {/* BRAND LOGO WITH GLOW */}
          <a href="/aion2" className="group flex items-center gap-2">
            <span className="text-white font-black text-sm tracking-[0.35em] drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(56,189,248,0.8)] transition-all">
              AION <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 font-extrabold">2</span>
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-400/10 border border-sky-400/30 text-sky-300 font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(56,189,248,0.2)]">
              TEST
            </span>
          </a>

          {/* MENU ITEMS */}
          <div className="hidden md:flex items-center gap-7">
            {["CLUB", "MISSIONS", "MARKET", "SUPPORT"].map(item => {
              const isCurrent = item === "CLUB";
              return (
                <span
                  key={item}
                  className={`text-[10px] font-bold tracking-[0.22em] uppercase transition-all duration-300 cursor-pointer relative py-1 ${
                    isCurrent
                      ? "text-sky-100 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                      : "text-slate-400 hover:text-sky-300 hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  }`}
                >
                  {item}
                  {isCurrent && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,1)]" />
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* USER PROFILE & NOTIFICATIONS */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full bg-sky-500/10 border border-sky-400/20 text-slate-300 hover:text-sky-200 hover:border-sky-400/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,1)] animate-pulse" />
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-sky-400/15">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400/40 to-blue-600/30 border border-sky-300/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(56,189,248,0.3)]">
              <span className="text-white text-[10px] font-extrabold tracking-wider">OM</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                OMAR SALEH
              </span>
              <span className="text-[8px] text-sky-400/80 font-bold tracking-widest uppercase">
                PREMIUM ELITE
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION (CELESTIAL SKY-BLUE GLOW)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-16 min-h-[580px] flex items-center justify-center overflow-hidden px-6">
        {/* Luminous Center Aura Behind Hero */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-[600px] h-[350px] rounded-full blur-[100px] opacity-40 animate-pulse"
            style={{
              background: "radial-gradient(ellipse, rgba(56,189,248,0.35) 0%, rgba(2,132,199,0.15) 50%, transparent 80%)",
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Floating Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 backdrop-blur-xl shadow-[0_0_20px_rgba(56,189,248,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)] mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,1)] animate-ping" />
            <span className="text-[10px] font-black tracking-[0.35em] text-sky-300 uppercase">
              {t("hero_tagline") || "Aion 2 · Sky Test Realm"}
            </span>
          </motion.div>

          {/* Hero Title with Metallic Celestial Sky Gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.2em] uppercase font-serif drop-shadow-[0_2px_24px_rgba(0,0,0,0.8)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-100 to-sky-400 drop-shadow-[0_0_35px_rgba(56,189,248,0.45)]">
                FIND YOUR CREW
              </span>
            </h1>

            {/* Subtitle / Key Services */}
            <p className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-sky-200/80 flex items-center justify-center gap-3">
              <span>KEYS</span>
              <span className="w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,1)]" />
              <span>BOOSTS</span>
              <span className="w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,1)]" />
              <span>LEVELING</span>
            </p>

            <p className="text-xs sm:text-sm text-slate-300/80 max-w-lg mx-auto font-medium leading-relaxed">
              Experience ultra-low latency matchmaking & verified elite teams for your next conquest.
            </p>
          </motion.div>

          {/* CTA BUTTON: ULTRA-LUXE SKY GLASS SHIMMER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-10"
          >
            <a
              href="/aion2/create-offer"
              className="relative group inline-flex items-center justify-center rounded-full p-[1.5px] overflow-hidden shadow-[0_0_35px_rgba(56,189,248,0.35)] hover:shadow-[0_0_65px_rgba(56,189,248,0.65)] transition-all duration-500 hover:scale-105 active:scale-95"
            >
              {/* Rotating Gradient Shimmer Border */}
              <span className="absolute inset-0 bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-600 bg-[length:250%_auto] animate-[shimmer_3s_linear_infinite]" />

              {/* Glass Button Surface */}
              <div className="relative bg-[#040e24]/85 hover:bg-[#040e24]/75 backdrop-blur-2xl px-12 py-4 rounded-full flex items-center gap-3.5 border border-sky-300/30 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Sparkles className="w-4 h-4 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                <span className="text-xs font-black tracking-[0.28em] uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                  {t("hero_create") || "Create Your Offer"}
                </span>
                <ArrowRight className="w-4 h-4 text-sky-300 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          LUMINOUS SKY DIVIDER
          ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 mb-8">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT AREA & GLASS CONTAINER
          ══════════════════════════════════════════════════════════ */}
      <div className="relative z-20 max-w-[1600px] mx-auto px-6 pb-28">

        {/* ── FILTER TABS: FLOATING SKY CAPSULE ── */}
        <section className="flex justify-center mb-10">
          <div className="flex items-center gap-2 p-1.5 bg-[#030d1d]/50 backdrop-blur-3xl rounded-full border border-sky-400/20 shadow-[0_8px_32px_rgba(2,132,199,0.16),inset_0_1px_1px_0_rgba(255,255,255,0.12)]">
            {FILTER_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2.5 px-7 py-3 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500/25 to-cyan-500/20 text-white border border-sky-400/50 shadow-[0_0_25px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]"
                      : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/10"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBadge"
                      className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-sky-300 rounded-full shadow-[0_0_10px_rgba(56,189,248,1)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── MAIN GRID (SIDEBAR + OFFERS + RIGHT PANEL) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[56px_1fr_320px] gap-8 items-start">

          {/* ── LEFT FLOATING MINI SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col gap-3.5 mt-2">
            {MINI_DOCK.map(item => {
              const Icon = item.icon;
              const active = activeDock === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveDock(item.id)}
                  title={item.label}
                  className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-2xl ${
                    active
                      ? "bg-sky-500/20 text-sky-200 border border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]"
                      : "bg-[#030d1d]/50 text-slate-400 border border-sky-400/15 hover:text-sky-200 hover:border-sky-400/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? "drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" : ""}`} />
                  {active && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,1)]" />
                  )}
                </button>
              );
            })}
          </aside>

          {/* ── CENTER: AVAILABLE OFFERS (SKY GLASS CARDS) ── */}
          <section className="min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-sky-400/15">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                  <Sparkles className="w-4 h-4 text-sky-300" />
                </div>
                <h3 className="text-sm font-black tracking-[0.22em] text-white uppercase">
                  Available Offers
                </h3>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/25 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,1)]" />
                <span className="text-[9px] font-bold tracking-widest text-sky-200 uppercase">
                  Live Matchmaking
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
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ scale: 1.008 }}
                    transition={{ duration: 0.3 }}
                    className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-sky-900/[0.15] via-[#040e24]/40 to-blue-950/[0.25] backdrop-blur-2xl border border-sky-400/20 hover:border-sky-300/50 shadow-[0_8px_32px_rgba(2,132,199,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_12px_40px_rgba(56,189,248,0.3),inset_0_1px_2px_0_rgba(255,255,255,0.3)] p-5 transition-all duration-300 cursor-pointer"
                  >
                    {/* Animated Light Sweep Effect on Hover */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-sky-400/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000" />

                    <div className="relative z-10 flex items-center justify-between gap-5 flex-wrap sm:flex-nowrap">
                      {/* Left: Icon & Info */}
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400/25 to-blue-600/20 border border-sky-300/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:border-sky-300 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all">
                          <Star className="w-6 h-6 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                        </div>

                        <div>
                          <h4 className="text-sm font-black tracking-[0.16em] text-white uppercase group-hover:text-sky-200 transition-colors">
                            {offer.name}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {/* Players */}
                            <span className="flex items-center gap-1.5 text-xs font-bold text-sky-100/90 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-400/20">
                              <Users className="w-3.5 h-3.5 text-sky-300" />
                              {offer.playersMeta}
                            </span>

                            {/* Region */}
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-400/20 text-[10px] font-black text-sky-200">
                              <Image
                                src={offer.region === "EU" ? "/flags/eu.svg" : "/flags/us.svg"}
                                alt={offer.region}
                                width={13}
                                height={9}
                                className="rounded-sm"
                              />
                              {offer.region}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Reward Pill & Action */}
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-400/15 border border-sky-400/35 text-[11px] font-black text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                          <Zap className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                          {offer.rewardLabel}
                        </span>

                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-300 group-hover:bg-sky-400 group-hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Neon Accent Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(56,189,248,1)]" />
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayOffers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#030d1d]/40 backdrop-blur-2xl border border-sky-400/15 shadow-[0_8px_32px_rgba(2,132,199,0.1)]">
                  <Search className="w-8 h-8 text-sky-400/50 mb-3 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-200/60">
                    No active offers in this category
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT: ONGOING MISSIONS & STATUS (HOLO GLASS) ── */}
          <aside className="w-full">
            <div className="relative rounded-2xl bg-gradient-to-b from-sky-900/[0.15] via-[#030d1d]/50 to-blue-950/[0.25] backdrop-blur-2xl border border-sky-400/20 shadow-[0_8px_32px_rgba(2,132,199,0.15),inset_0_1px_1px_0_rgba(255,255,255,0.15)] p-5">
              {/* Header */}
              <div className="flex items-center gap-2.5 pb-3 mb-5 border-b border-sky-400/15">
                <Swords className="w-4 h-4 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                <h3 className="text-xs font-black tracking-[0.2em] text-white uppercase font-serif">
                  Ongoing Missions
                </h3>
              </div>

              {/* Hologram empty state with celestial orbital ring */}
              <div className="flex flex-col items-center text-center py-8">
                <div className="relative mb-5 flex items-center justify-center">
                  {/* Glowing core */}
                  <div className="absolute w-24 h-24 rounded-full bg-sky-400/20 blur-2xl animate-pulse" />

                  {/* Orbital rotating ring */}
                  <motion.div
                    animate={motionOn ? { rotate: 360 } : undefined}
                    transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full border border-dashed border-sky-400/40 flex items-center justify-center"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,1)] -translate-y-8" />
                  </motion.div>

                  <Radio className="w-6 h-6 text-sky-300 absolute drop-shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
                </div>

                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-200">
                  Radar Scanning
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium max-w-[200px]">
                  No active missions found. Join or create an offer to deploy.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM DOCKED GLASS BAR
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-sky-400/15 bg-[#020713]/70 backdrop-blur-2xl shadow-[0_-4px_30px_rgba(2,132,199,0.12),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
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
