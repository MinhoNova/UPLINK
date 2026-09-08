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

/* ── GLASSY IMAGE BACKGROUND (uploaded fantasy scene) ── */
function GlassyImageBg() {
  const motionOn = useFlag("uplink_bg_motion", true);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* MAIN IMAGE — full screen, blurred glassy */}
      <div className="absolute inset-0">
        <Image
          src="/aion2-bg.webp"
          alt="Aion 2 fantasy background"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover blur-[40px] brightness-[0.75] saturate-80"
          priority
        />
      </div>

      {/* Heavy glass overlay — frosted glass effect over the image */}
      <div className="absolute inset-0">
        {/* Dark gradient overlay for depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-950/30 to-black/50" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,4,10,0.55)_100%)]" />
      </div>

      {/* Large atmospheric glows — cyan + blue + purple — blurred and visible */}
      <div className="absolute inset-0">
        {/* Cyan glow — top right */}
        <div
          className={`absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full blur-3xl ${
            motionOn ? "animate-pulse" : ""
          }`}
          style={{
            background: "radial-gradient(circle, rgba(34, 211, 238, 0.20) 0%, transparent 70%)",
            animationDuration: "8s",
          }}
        />

        {/* Blue glow — bottom left */}
        <div
          className={`absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-3xl ${
            motionOn ? "animate-pulse" : ""
          }`}
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)",
            animationDuration: "10s",
          }}
        />

        {/* Purple glow — center */}
        <div
          className={`absolute top-[40%] left-[30%] w-[50%] h-[50%] rounded-full blur-3xl ${
            motionOn ? "animate-pulse" : ""
          }`}
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
            animationDuration: "12s",
          }}
        />
      </div>

      {/* Animated floating orbs — cyan/blue/purple — subtle movement */}
      <div className="absolute inset-0">
        {/* Orb 1 — cyan, top-left, slow drift */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(34, 211, 238, 0.25) 0%, transparent 70%)",
          }}
          animate={{
            x: motionOn ? [0, 50, 0, -30, 0] : [0],
            y: motionOn ? [0, -30, 0, 50, 0] : [0],
            scale: motionOn ? [1, 1.08, 1, 0.92, 1] : [1],
            opacity: motionOn ? [0.6, 1, 0.7, 0.85, 0.6] : [1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          initial={{ x: 0, y: 0 }}
        />

        {/* Orb 2 — blue, bottom-right, opposite drift */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: "350px",
            height: "350px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, transparent 70%)",
          }}
          animate={{
            x: motionOn ? [0, -40, 0, 30, 0] : [0],
            y: motionOn ? [0, 40, 0, -20, 0] : [0],
            scale: motionOn ? [1, 0.92, 1.05, 1, 1] : [1],
            opacity: motionOn ? [0.5, 0.9, 0.6, 0.8, 0.5] : [1],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "linear",
          }}
          initial={{ x: 0, y: 0 }}
        />

        {/* Orb 3 — purple, center-left */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: "250px",
            height: "250px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%)",
          }}
          animate={{
            x: motionOn ? [0, 25, 0, -15, 0] : [0],
            y: motionOn ? [0, 15, 0, -25, 0] : [0],
            scale: motionOn ? [1, 1.05, 0.95, 1.1, 1] : [1],
            opacity: motionOn ? [0.4, 0.8, 0.5, 0.75, 0.4] : [1],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear",
          }}
          initial={{ x: 0, y: 0 }}
        />
      </div>

      {/* Glass streaks — vertical cyan lines */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div
          className="absolute inset-y-0 left-[15%] w-[1px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(34, 211, 238, 0.8), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 left-[40%] w-[1px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.6), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 left-[65%] w-[1px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.5), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 left-[85%] w-[1px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(34, 211, 238, 0.4), transparent)",
          }}
        />
      </div>

      {/* Subtle glass grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: "120px 120px",
        }}
      />

      {/* Top-to-bottom gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
    </div>
  );
}

/* ── GLASSY BLUE SHARED STYLES ── */
const GLASS_BLUE = "bg-blue-950/40 backdrop-blur-2xl border border-cyan-500/15 shadow-[0_0_30px_rgba(34,211,238,0.08)]";
const GLASS_ACTIVE = "bg-blue-900/50 backdrop-blur-2xl border border-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.18)]";

/* ── ORIGINAL Aion2ClubPage logic — kept EXACTLY as is ── */

export default function Aion2TestClubPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("Dungeons");
  const [activeDock, setActiveDock] = useState("chat");

  const displayOffers = useMemo(() => {
    return SEED_OFFERS.filter((o) => o.category.toLowerCase() === activeTab.toLowerCase());
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-900/80 text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">

      {/* ═══ GLASSY BLUE PREMIUM BACKGROUND ═══ */}
      <GlassyImageBg />

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden pt-16">
        {/* Glassy blue hero backdrop */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 ${GLASS_BLUE} rounded-full blur-3xl opacity-60`} />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-transparent to-purple-500/5" />
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
              <div className="relative bg-blue-900/50 backdrop-blur-2xl px-16 py-4 rounded-full flex items-center justify-center gap-4 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
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
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>

      {/* ═══ FILTER TABS — glassy blue ═══ */}
      <section className="relative z-20 w-full flex justify-center -mt-8 mb-12">
        <div className={`flex items-center gap-2 sm:gap-4 p-2 ${GLASS_BLUE} rounded-full`}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-3 px-8 py-3 rounded-full text-[11px] font-bold tracking-[0.2em] transition-all duration-300 ${
                  isActive
                    ? `${GLASS_ACTIVE} text-cyan-200 border-cyan-400/30`
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
                      ? `${GLASS_ACTIVE} text-cyan-300 border-cyan-500/35`
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
            <div className={`flex items-center justify-between mb-6 pb-4 border-b ${GLASS_BLUE} border-cyan-500/15`}>
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
                  className={`relative w-full h-24 rounded-2xl ${GLASS_BLUE} overflow-hidden flex items-center pr-2 pl-4 cursor-pointer group transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]`}
                >

                  {/* Mockup placeholder background (Right side gradient/image) */}
                  <div
                    className={`absolute right-0 top-0 bottom-0 w-2/3 bg-gradient-to-l ${offer.bgTheme} pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity`}
                  />

                  <div className="relative z-10 flex items-center w-full gap-6">
                    {/* Rank/Class Icon — glassy */}
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:border-cyan-400/50 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all">
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
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent rounded-b-2xl" />
                </motion.div>
              ))}

              {displayOffers.length === 0 && (
                <div className={`text-center py-16 ${GLASS_BLUE} border border-cyan-500/15 rounded-[2rem]`}>
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
            <div className={`relative w-full rounded-3xl ${GLASS_BLUE} p-6 shadow-[0_10px_40px_rgba(34,211,238,0.1)]`}>

              {/* Widget Header */}
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-cyan-500/15">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-cyan-100 font-serif">
                  {t("missions_header")}
                </h3>
              </div>

              {/* Empty State */}
              <div className="flex flex-col items-center text-center py-10">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-cyan-500/25 rounded-full blur-xl" />
                  {/* Simplified geometric icon */}
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <path d="M50 10 L85 80 H15 Z" stroke="#22d3ee" strokeWidth="3" fill="rgba(34, 211, 238, 0.12)" />
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

      {/* ═══ Bottom Nav (glassy blue bar) ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-20">
        <div className={`absolute inset-0 ${GLASS_BLUE} border-t border-cyan-500/15 flex items-center justify-center`}>
          <div className="flex items-center gap-4">
            {["DUNGEONS", "LEVELING", "BOOSTS", "PVP"].map((tab) => (
              <span key={tab} className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 hover:text-cyan-300 transition-colors cursor-pointer">
                {tab}
              </span>
            ))}
            <span className="ml-4 text-[9px] text-slate-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
              ONLINE
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
