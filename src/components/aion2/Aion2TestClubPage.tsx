"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Shield, Sparkles, Zap, Swords, Users, Search,
  Star, MessageSquare, ClipboardList, Coins
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useFlag } from "@/lib/siteFlags";

/* ── FILTER TABS ── */
const FILTER_TABS = [
  { label: "DUNGEONS", key: "Dungeons", icon: Shield },
  { label: "LEVELING", key: "Leveling", icon: Sparkles },
  { label: "BOOSTS",   key: "Boosts",   icon: Zap },
  { label: "PVP",      key: "PVP",      icon: Swords },
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

export default function Aion2TestClubPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("Dungeons");
  const [activeDock, setActiveDock] = useState("chat");
  const motionOn = useFlag("uplink_bg_motion", true);

  const displayOffers = useMemo(
    () => SEED_OFFERS.filter((o) => o.category.toLowerCase() === activeTab.toLowerCase()),
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">

      {/* Scenic Background Artwork — full page, behind all content, never cut */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-contain bg-top bg-no-repeat" style={{ backgroundImage: `url('/AION2.png')` }} />
        <div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/12 via-transparent to-[#050814]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,20,0.8)_100%)]" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════ */}
      <section className="tn-hero relative w-full min-h-[620px] flex items-center justify-center py-12 px-4">

        {/* Center glow — subtle, doesn't wash out the image */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.12, 1],
            opacity: [0.15, 0.28, 0.15],
          } : undefined}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] rounded-full blur-[110px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(168,85,247,0.10) 50%, transparent 75%)",
          }}
        />

        {/* Left / Right aurora glows — very subtle */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.12, 1],
            opacity: [0.08, 0.18, 0.08],
          } : undefined}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vh] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.15, 1],
            opacity: [0.06, 0.15, 0.06],
          } : undefined}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vh] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Hero Content — no glass wrapper, transparent background */}
        <div className="relative z-10 flex flex-col items-center text-center mt-6 px-8 sm:px-14 py-10 max-w-2xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            {/* FIND YOUR CREW with side lines */}
            <div className="flex items-center gap-6 mt-1">
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/60" />
              <h2 className="text-sm sm:text-base font-bold tracking-[0.4em] text-blue-100 uppercase drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]">
                {t("hero_crew") || "FIND YOUR CREW"}
              </h2>
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/60" />
            </div>

            {/* DUNGEONS · RAIDS · LEVELING */}
            <p className="mt-4 text-[11px] font-bold tracking-[0.3em] text-slate-300 uppercase">
              {((t("hero_tagline") || "DUNGEONS · RAIDS · LEVELING").split("·").map((part: string, i: number) => (
                <span key={i}>
                  {i > 0 && <span className="mx-2 text-purple-400/80 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]">✦</span>}
                  {part.trim()}
                </span>
              )))}
            </p>

            {/* Subtext */}
            <p className="mt-2 text-xs text-slate-400 font-medium max-w-md">
              {t("hero_adventure") || "Find trusted players for your next adventure."}
            </p>

            {/* Vertical Accent Line */}
            <div className="w-[1px] h-8 bg-gradient-to-b from-purple-500/60 to-transparent my-4" />
          </motion.div>

          {/* CREATE YOUR OFFER Button — transparent, no glass */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.a
              href="/create-offer"
              className="relative group overflow-hidden rounded-full p-[1px] shadow-[0_0_35px_rgba(59,130,246,0.25)] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)] transition-all duration-500 block hover:scale-105 active:scale-95"
            >
              {/* Animated border gradient */}
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />

              {/* Button inner: transparent, no backdrop-blur */}
              <div className="relative bg-transparent px-16 py-4 rounded-full flex items-center justify-center gap-4 border border-white/12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all">
                <span className="text-xs font-black tracking-[0.3em] uppercase text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]">
                  {t("hero_create") || "CREATE YOUR OFFER"}
                </span>
                <span className="text-blue-300 group-hover:translate-x-1 transition-transform font-bold">›</span>
              </div>
            </motion.a>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FILTER TABS (MATCHING MAIN PAGE EXACTLY)
          ══════════════════════════════════════════════════════════ */}
      <section className="relative z-20 w-full flex justify-center -mt-8 mb-12">
        <div className="flex items-center gap-2 sm:gap-4 p-2 bg-[#050814]/60 backdrop-blur-md rounded-full border border-blue-900/30">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-3 px-8 py-3 rounded-full text-[11px] font-bold tracking-[0.2em] transition-all duration-300 ${
                  isActive
                    ? 'bg-[#151c3d] text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/40'
                    : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-[2px] bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT GRID
          ══════════════════════════════════════════════════════════ */}
      <main className="max-w-[1600px] mx-auto px-6 pb-24 relative z-20">
        <div className="grid grid-cols-[auto_1fr_340px] gap-8">

          {/* 1. Left Mini Sidebar (Floating Tools) */}
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
                      ? 'bg-[#151c3d] text-blue-300 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'bg-[#0a0f26]/80 text-slate-500 border border-blue-900/40 hover:text-blue-300 hover:border-blue-500/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {active && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}
                </button>
              );
            })}
          </aside>

          {/* 2. Center Column: Offers */}
          <section className="min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-blue-900/30">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black tracking-[0.25em] text-blue-100 uppercase font-serif">
                  {t("offers_header") || "AVAILABLE OFFERS"}
                </h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold tracking-widest text-emerald-300 uppercase">
                  {t("offers_online") || "NEW OFFERS ONLINE"}
                </span>
              </div>
            </div>

            {/* Offer List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {displayOffers.map((offer) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="tn-light relative w-full h-24 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-cyan-500/20 overflow-hidden flex items-center pr-2 pl-4 cursor-pointer group shadow-[0_4px_24px_rgba(34,211,238,0.08)] hover:shadow-[0_0_32px_rgba(34,211,238,0.15)] hover:bg-white/[0.06] transition-all"
                  >
                    {/* Scenic Artwork thumbnail / gradient on right */}
                    <div className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none overflow-hidden opacity-60 group-hover:opacity-85 transition-opacity">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-800/50 via-violet-800/30 to-cyan-700/20" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f26] via-[#0a0f26]/60 to-transparent" />
                    </div>

                    <div className="relative z-10 flex items-center w-full gap-6">
                      {/* Rank / Crest Icon */}
                      <div className="w-16 h-16 rounded-full bg-[#050814]/80 border border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:border-blue-400/60 transition-colors overflow-hidden">
                        <Shield className="w-7 h-7 text-blue-400/80" />
                      </div>

                      {/* Offer Details */}
                      <div className="flex-1">
                        <h4 className="text-sm font-black tracking-widest text-white uppercase group-hover:text-blue-200 transition-colors">
                          {offer.name}
                        </h4>
                        <div className="flex items-center gap-5 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200/80">
                            <span>{offer.playersMeta}</span>
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-black text-gray-300">
                            <Image
                              src={offer.region === "EU" ? "/flags/eu.svg" : "/flags/us.svg"}
                              alt={offer.region}
                              width={14}
                              height={10}
                              className="rounded-sm"
                            />
                            <span>{offer.region}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400">
                            <Coins className="w-3 h-3" />
                            <span>{offer.rewardLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayOffers.length === 0 && (
                <div className="tn-light text-center py-16 bg-[#0a0f26]/40 border border-blue-900/30 rounded-[2rem]">
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    {t("offers_empty") || "No offers in this category"}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 3. Right Sidebar: Ongoing Missions */}
          <aside className="w-full">
            <div className="tn-light relative w-full rounded-3xl bg-white/[0.06] backdrop-blur-3xl border border-cyan-500/25 p-6 shadow-[0_8px_32px_rgba(34,211,238,0.06)] hover:shadow-[0_12px_40px_rgba(34,211,238,0.10)] hover:bg-white/[0.08] transition-all">
              {/* Widget Header */}
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-blue-900/30">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100 font-serif">
                  {t("missions_header") || "ONGOING MISSIONS"}
                </h3>
              </div>

              {/* Center Sigil Empty State */}
              <div className="flex flex-col items-center text-center py-10">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                  <Shield className="w-8 h-8 text-blue-400/70 drop-shadow-[0_0_10px_rgba(59,130,246,0.9)] animate-pulse" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {t("missions_empty") || "NO ACTIVE MISSIONS"}
                </p>
              </div>
            </div>
          </aside>

        </div>
      </main>

    </div>
  );
}
