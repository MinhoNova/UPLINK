"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Swords, Shield, Coins, Zap, Users, Search,
  Sparkles, Star, MessageSquare, ClipboardList
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

/* ── MINI SIDEBAR ICONS ── */
const MINI_DOCK = [
  { id: "chat", icon: MessageSquare, label: "CHAT" },
  { id: "quests", icon: ClipboardList, label: "QUESTS" },
  { id: "star", icon: Star, label: "FAVORITES" },
];

/* ── SEED OFFERS ── */
interface OfferCard {
  id: string;
  name: string;
  category: string;
  region: "US" | "EU";
  playersMeta: string;
  rewardLabel: string;
  bgTheme: string;
}

const SEED_OFFERS: OfferCard[] = [
  {
    id: "seed-1",
    name: "DUNGEON BOOST",
    category: "Dungeons",
    region: "US",
    playersMeta: "4 × +10",
    rewardLabel: "25K PER RUN",
    bgTheme: "from-[#1a1f3c]/90 via-[#1a1f3c]/60 to-[#2c3b6b]/40",
  },
  {
    id: "seed-2",
    name: "LEVELING 1-80",
    category: "Leveling",
    region: "EU",
    playersMeta: "4 × +10",
    rewardLabel: "50K PER RUN",
    bgTheme: "from-[#1a1f3c]/90 via-[#1a1f3c]/60 to-[#3b2c6b]/40",
  },
];

/* ── FULL GLASSY BLUE ATMOSPHERE BACKGROUND ── */
function BlueGlassyAtmosphere() {
  const motionOn = useFlag("uplink_bg_motion", true);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Fully transparent base — no dark overlay */}
      <div className="absolute inset-0 bg-transparent" />

      {/* 3 large animated glassy orbs — cyan / blue / purple — floating */}
      <div className="absolute inset-0">
        {/* Orb 1 — cyan, top-left, slow drift */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%)",
          }}
          animate={{
            x: motionOn ? [0, 60, 0, -40, 0] : [0],
            y: motionOn ? [0, -40, 0, 60, 0] : [0],
            scale: motionOn ? [1, 1.1, 1, 0.9, 1] : [1],
            opacity: motionOn ? [0.6, 1, 0.7, 0.9, 0.6] : [1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
          initial={{ x: 0, y: 0 }}
        />

        {/* Orb 2 — blue, bottom-right, opposite drift */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.10) 0%, transparent 70%)",
          }}
          animate={{
            x: motionOn ? [0, -50, 0, 40, 0] : [0],
            y: motionOn ? [0, 50, 0, -30, 0] : [0],
            scale: motionOn ? [1, 0.9, 1.05, 1, 1] : [1],
            opacity: motionOn ? [0.5, 0.8, 0.6, 0.9, 0.5] : [1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear",
          }}
          initial={{ x: 0, y: 0 }}
        />

        {/* Orb 3 — purple, center-left, slower */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
          }}
          animate={{
            x: motionOn ? [0, 30, 0, -20, 0] : [0],
            y: motionOn ? [0, 20, 0, -30, 0] : [0],
            scale: motionOn ? [1, 1.05, 0.95, 1.1, 1] : [1],
            opacity: motionOn ? [0.4, 0.7, 0.5, 0.8, 0.4] : [1],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "linear",
          }}
          initial={{ x: 0, y: 0 }}
        />
      </div>

      {/* Thin glass streaks — cyan/blue vertical lines */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div
          className="absolute inset-y-0 left-1/4 w-[1px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(34, 211, 238, 0.6), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 left-2/4 w-[1px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.4), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 left-3/4 w-[1px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.3), transparent)",
          }}
        />
      </div>

      {/* Subtle glass grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Top-to-bottom glass gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 via-transparent to-transparent" />
    </div>
  );
}

/* ── GLASSY SHARED STYLES ── */
const GLASS_BLUE = "bg-blue-500/5 backdrop-blur-2xl border border-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.06)]";
const GLASS_ACTIVE = "bg-blue-500/10 backdrop-blur-2xl border border-cyan-500/25 shadow-[0_0_40px_rgba(34,211,238,0.15)]";

/* ── ORIGINAL Aion2ClubPage logic — kept EXACTLY as is, only background changed ── */

export default function Aion2TestClubPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("Dungeons");
  const [activeDock, setActiveDock] = useState("chat");

  const displayOffers = useMemo(() => {
    return SEED_OFFERS.filter((o) => o.category.toLowerCase() === activeTab.toLowerCase());
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-transparent text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">

      {/* ═══ FULL GLASSY BLUE ATMOSPHERE BACKGROUND ═══ */}
      <BlueGlassyAtmosphere />

      {/* ═══ NAVBAR CONTAINER (glassy blue) ═══ */}
      {/* Note: actual Navbar component is in layout.tsx — this is just visual wrapper for test page */}
      <div className="fixed top-0 left-0 right-0 z-50 h-24">
        <div className={`absolute inset-0 ${GLASS_BLUE} border-b border-cyan-500/20`} />
      </div>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden pt-16">
        {/* Glassy blue hero background */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 ${GLASS_BLUE}`} />
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        </div>

        {/* Hero Content — kept EXACTLY as original */}
        <div className="relative z-10 flex flex-col items-center text-center mt-12">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >

            <div className="flex items-center gap-6 mt-4">
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400/50" />
              <h2 className="text-sm sm:text-base font-bold tracking-[0.4em] text-cyan-200 uppercase">
                {t("hero_crew")}
              </h2>
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400/50" />
            </div>

            <p className="mt-4 text-[11px] font-bold tracking-[0.3em] text-slate-400 uppercase">
              {t("hero_tagline").split("·").map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-2 text-purple-500/50">✦</span>}
                  {part}
                </span>
              ))}
            </p>
            <p className="mt-2 text-xs text-slate-500 font-medium">
              {t("hero_adventure")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-12"
          >
            <motion.a
              href="/aion2/create-offer"
              className="relative group overflow-hidden rounded-full p-[1px] shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] transition-all duration-500"
            >
              {/* Animated border gradient */}
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />

              {/* Button inner — glassy blue */}
              <div className="relative bg-cyan-500/10 backdrop-blur-2xl px-16 py-4 rounded-full flex items-center justify-center gap-4 border border-cyan-500/20">
                <span className="text-xs font-black tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">
                  {t("hero_create")}
                </span>
                <span className="text-cyan-300 group-hover:translate-x-1 transition-transform">›</span>
              </div>
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* ═══ DIVIDER ═══ */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 mt-12">
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </div>

      {/* ═══ FILTER TABS — glassy blue ═══ */}
      <section className="relative z-20 w-full flex justify-center -mt-8 mb-12">
        <div className={`flex items-center gap-2 sm:gap-4 p-2 ${GLASS_BLUE} rounded-full border-cyan-500/10`}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-3 px-8 py-3 rounded-full text-[11px] font-bold tracking-[0.2em] transition-all duration-300 ${
                  isActive
                    ? `${GLASS_ACTIVE} text-cyan-200 border-cyan-500/30`
                    : "text-slate-400 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{t("tab_" + tab.key.toLowerCase())}</span>
                {isActive && (
                  <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ MAIN CONTENT GRID ═══ */}
      <main className="max-w-[1600px] mx-auto px-6 pb-24 relative z-20">
        <div className="grid grid-cols-[auto_1fr_340px] gap-8">

          {/* 1. Left Mini Sidebar (Floating Tools) — glassy blue */}
          <aside className="hidden lg:flex flex-col gap-4 mt-12">
            {MINI_DOCK.map((item) => {
              const active = activeDock === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveDock(item.id)}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    active
                      ? `${GLASS_ACTIVE} text-cyan-300 border-cyan-500/30`
                      : `${GLASS_BLUE} text-slate-500 border-cyan-500/5 hover:text-cyan-300 hover:border-cyan-500/20`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {active && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  )}
                </button>
              );
            })}
          </aside>

          {/* 2. Center Column: Offers — glassy blue cards */}
          <section className="min-w-0">
            {/* Header */}
            <div className={`flex items-center justify-between mb-6 pb-4 border-b ${GLASS_BLUE} border-cyan-500/10`}>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black tracking-[0.25em] text-cyan-100 uppercase font-serif">
                  {t("offers_header")}
                </h3>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${GLASS_BLUE} border-cyan-500/10`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-[9px] font-bold tracking-widest text-emerald-300 uppercase">
                  {t("offers_online")}
                </span>
              </div>
            </div>

            {/* Offer List — glassy blue cards */}
            <div className="space-y-4">
              {displayOffers.map((offer) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className={`relative w-full h-24 rounded-2xl ${GLASS_BLUE} overflow-hidden flex items-center pr-2 pl-4 cursor-pointer group transition-all`}
                >

                  {/* Mockup placeholder background (Right side gradient/image) */}
                  <div
                    className={`absolute right-0 top-0 bottom-0 w-2/3 bg-gradient-to-l ${offer.bgTheme} pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity`}
                  />

                  <div className="relative z-10 flex items-center w-full gap-6">
                    {/* Rank/Class Icon — glassy */}
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.15)] group-hover:border-cyan-400/50 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
                      <Star className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </div>

                    {/* Offer Details */}
                    <div className="flex-1">
                      <h4 className="text-sm font-black tracking-widest text-white uppercase group-hover:text-cyan-200 transition-colors">
                        {t(offer.id === "seed-1" ? "offer_dungeonboost" : "offer_leveling")}
                      </h4>
                      <div className="flex items-center gap-5 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-200/80">
                          <span>{offer.playersMeta}</span>
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${GLASS_BLUE} border-cyan-500/5 text-[10px] font-black text-gray-300`}>
                          <Image
                            src={offer.region === "EU" ? "/flags/eu.svg" : "/flags/us.svg"}
                            alt={offer.region}
                            width={14}
                            height={10}
                            className="rounded-sm"
                          />
                          <span>{offer.region}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${GLASS_BLUE} border-cyan-500/5 text-[10px] font-black text-cyan-300`}>
                          <Coins className="w-3 h-3" />
                          <span>{t(offer.id === "seed-1" ? "reward_25k" : "reward_50k")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover glow edge */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent rounded-b-2xl" />
                </motion.div>
              ))}

              {displayOffers.length === 0 && (
                <div className={`text-center py-16 ${GLASS_BLUE} border border-cyan-500/10 rounded-[2rem]`}>
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    {t("offers_empty")}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 3. Right Sidebar: Ongoing Missions — glassy blue */}
          <aside className="w-full">
            <div className={`relative w-full rounded-3xl ${GLASS_BLUE} p-6 shadow-[0_10px_40px_rgba(34,211,238,0.08)]`}>

              {/* Widget Header */}
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-cyan-500/10">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-cyan-100 font-serif">
                  {t("missions_header")}
                </h3>
              </div>

              {/* Empty State */}
              <div className="flex flex-col items-center text-center py-10">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
                  {/* Simplified geometric icon */}
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <path d="M50 10 L85 80 H15 Z" stroke="#22d3ee" strokeWidth="3" fill="rgba(34, 211, 238, 0.1)" />
                    <circle cx="50" cy="55" r="15" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="50" cy="55" r="4" fill="#93c5fd" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {t("missions_empty")}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ═══ BOTTOM SPACER ═══ */}
      <div className="h-20" />

      {/* ═══ Bottom Nav Hint (glassy blue bar) ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-20">
        <div className={`absolute inset-0 ${GLASS_BLUE} border-t border-cyan-500/10 flex items-center justify-center`}>
          <div className="flex items-center gap-4">
            {["DUNGEONS", "LEVELING", "BOOSTS", "PVP"].map((tab) => (
              <span key={tab} className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 hover:text-cyan-300 transition-colors cursor-pointer">
                {tab}
              </span>
            ))}
            <span className="ml-4 text-[9px] text-slate-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
