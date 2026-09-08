"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Swords, Sparkles, Zap, Users, Search,
  Star, MessageSquare, ClipboardList, Bell, Notifications
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useFlag } from "@/lib/siteFlags";

/* ── FILTER TABS ── */
const FILTER_TABS = [
  { label: "DUNGEONS", key: "Dungeons", icon: Swords },
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

/* ── THEME COLORS ── */
const NAV_BG      = "bg-slate-900/90 backdrop-blur-2xl border-b border-white/[0.06]";
const NAV_ITEM    = "text-slate-400 hover:text-white transition-colors cursor-pointer";
const NAV_ACTIVE  = "text-white font-semibold tracking-wider";
const USER_NAME   = "text-white text-[10px] font-bold tracking-[0.2em] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]";

/* ── HERO ── */
const HERO_TAGLINE = "FIND YOUR CREW";
const HERO_SUB     = "KEYS · BOOSTS · LEVELING";
const HERO_DESC    = "Find trusted players for your next adventure.";

/* ── GLASS CARD ── */
const GLASS = "bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]";
const GLASS_ACTIVE = "bg-white/[0.08] border-white/[0.14] shadow-[0_4px_24px_rgba(0,0,0,0.5)]";

export default function Aion2TestClubPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab]  = useState("Dungeons");
  const [activeDock, setActiveDock] = useState("chat");
  const motionOn = useFlag("uplink_bg_motion", true);

  const displayOffers = useMemo(
    () => SEED_OFFERS.filter(o => o.category.toLowerCase() === activeTab.toLowerCase()),
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-[#06060f] text-slate-200 font-sans overflow-x-hidden relative selection:bg-cyan-500/20">

      {/* ══════════════════════════════════════════════════════════
          TOP NAVIGATION BAR
          ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-8">
          {/* LOGO */}
          <span className="text-white font-black text-sm tracking-[0.35em]">
            AION <span className="text-cyan-300">2</span>
          </span>

          {/* MENU ITEMS */}
          {["CLUB", "MISSIONS", "MARKET", "SUPPORT"].map(item => (
            <span
              key={item}
              className={`text-[10px] font-semibold tracking-[0.22em] uppercase transition-colors cursor-pointer ${
                item === "CLUB" ? NAV_ACTIVE : NAV_ITEM
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        {/* USER PROFILE */}
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-500/30 border border-white/[0.12] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
            <span className="text-white text-[10px] font-bold">OM</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className={USER_NAME}>OMAR SALEH</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 font-bold tracking-[0.1em]">
              CLUB
            </span>
          </div>
          <Bell className="w-4 h-4 text-slate-400 hover:text-white transition-colors cursor-pointer" />
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          SIMPLE ATMOSPHERIC BACKGROUND
          ══════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06060f] via-[#08081a] to-[#020208]" />

        {/* Far glows — subtle and large */}
        <div className="absolute top-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-30%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)" }} />
        <div className="absolute top-[30%] left-[40%] w-[60%] h-[60%] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)" }} />

        {/* Subtle vertical light streaks */}
        <div className="absolute inset-0 opacity-[0.04]">
          {["20%", "45%", "70%", "85%"].map((left, i) => (
            <div key={i}
              className="absolute inset-y-0 w-[1px]"
              style={{ left, background: "linear-gradient(to bottom, transparent, rgba(148,163,184,0.5), transparent)" }} />
          ))}
        </div>

        {/* Top-to-bottom gradient for readability at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020208]/90 via-transparent to-transparent" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-16 min-h-[620px] flex items-center justify-center overflow-hidden px-6">
        {/* Hero backdrop glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[35%] left-[50%] -translate-x-1/2 w-[70%] h-[70%] rounded-full blur-[120px] opacity-40"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
          <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-30"
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-20"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)" }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">

          {/* Eyebrow line */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-6 mt-4 mb-3"
          >
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400/40" />
            <span className="text-[10px] font-bold tracking-[0.4em] text-slate-500 uppercase">
              {t("hero_tagline") || "Aion 2 · Test Server"}
            </span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400/40" />
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.2em] text-white font-serif drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {HERO_TAGLINE}
            </h1>

            {/* Subtitle / services line */}
            <p className="mt-3 text-[11px] font-bold tracking-[0.3em] text-slate-400 uppercase">
              {HERO_SUB.split("·").map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-3 text-cyan-400/40">·</span>}
                  {part.trim()}
                </span>
              ))}
            </p>

            <p className="mt-2 text-xs text-slate-500 font-medium max-w-md mx-auto">
              {HERO_DESC}
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12"
          >
            <a
              href="/aion2/create-offer"
              className="relative group overflow-hidden rounded-full p-[1px] shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_70px_rgba(139,92,246,0.5)] transition-all duration-500"
            >
              {/* Animated border fill */}
              <span className="absolute inset-0 bg-gradient-to-r from-[#6d28d9] via-[#4f46e5] to-[#7c3aed] bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />
              {/* Button body */}
              <div className="relative bg-[#0a0a1a]/80 backdrop-blur-xl px-18 py-4 rounded-full flex items-center justify-center gap-4 border border-white/[0.1] shadow-[0_0_24px_rgba(139,92,246,0.15)]">
                <span className="text-xs font-black tracking-[0.3em] uppercase text-white">
                  {t("hero_create") || "Create Your Offer"}
                </span>
                <span className="text-purple-300 group-hover:translate-x-1 transition-transform">›</span>
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          DIVIDER
          ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 mt-4">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          TABS + MAIN LAYOUT
          ══════════════════════════════════════════════════════════ */}
      <div className="relative z-20 max-w-[1600px] mx-auto px-6 pb-28">

        {/* Filter Tabs — horizontal, centered */}
        <section className="flex justify-center -mb-2 mb-10">
          <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] backdrop-blur-2xl rounded-full border border-white/[0.07] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            {FILTER_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2.5 px-7 py-3 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase transition-all duration-300 ${
                    isActive
                      ? "bg-white/[0.10] text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,1)] rounded-full" />
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-300" : "text-slate-600"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Grid: Sidebar (left) + Main (center) + Missions (right) */}
        <div className="grid grid-cols-[60px_1fr_320px] gap-8 items-start">

          {/* ── LEFT MINI SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col gap-3 mt-2">
            {MINI_DOCK.map(item => {
              const Icon = item.icon;
              const active = activeDock === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveDock(item.id)}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    active
                      ? "bg-white/[0.12] text-cyan-300 border border-white/[0.18] shadow-[0_0_16px_rgba(34,211,238,0.2)]"
                      : "bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:text-cyan-300 hover:border-white/[0.12]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {active && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  )}
                </button>
              );
            })}
          </aside>

          {/* ── CENTER: OFFERS ── */}
          <section className="min-w-0">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black tracking-[0.22em] text-white uppercase">
                  Available Offers
                </h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-[9px] font-bold tracking-widest text-emerald-300 uppercase">
                  New Offers Online
                </span>
              </div>
            </div>

            {/* Offer list */}
            <div className="space-y-3">
              {displayOffers.map(offer => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.005 }}
                  className="relative group overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.11] hover:shadow-[0_8px_40px_rgba(0,0,0,0.45)] cursor-pointer"
                >
                  {/* Right gradient panel */}
                  <div className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"
                    style={{ background: offer.id === "seed-1"
                      ? "linear-gradient(90deg, transparent, rgba(30,27,75,0.6), rgba(44,59,107,0.4))"
                      : "linear-gradient(90deg, transparent, rgba(44,30,75,0.6), rgba(75,44,107,0.4))" }} />

                  <div className="relative z-10 flex items-center gap-5">
                    {/* Icon circle */}
                    <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.1)] group-hover:border-cyan-400/30 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.2)] transition-all">
                      <Star className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black tracking-[0.15em] text-white uppercase group-hover:text-cyan-200 transition-colors">
                        {offer.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                        {/* Players */}
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                          {offer.playersMeta}
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                        </span>
                        {/* Region */}
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[10px] font-black text-slate-300">
                          <Image
                            src={offer.region === "EU" ? "/flags/eu.svg" : "/flags/us.svg"}
                            alt={offer.region}
                            width={13}
                            height={9}
                            className="rounded-sm"
                          />
                          {offer.region}
                        </span>
                        {/* Price */}
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[10px] font-black text-cyan-300">
                          <Zap className="w-3 h-3" />
                          {offer.rewardLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom hover line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}

              {displayOffers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 rounded-3xl bg-white/[0.04] border border-white/[0.07]">
                  <Search className="w-7 h-7 text-slate-600 mb-3" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    No offers in this category
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT: ONGOING MISSIONS ── */}
          <aside className="w-full">
            <div className="relative rounded-2xl bg-white/[0.04] border border-white/[0.07] shadow-[0_8px_28px_rgba(0,0,0,0.35)] p-5">
              {/* Header */}
              <div className="flex items-center gap-2.5 pb-3 mb-5 border-b border-white/[0.06]">
                <Swords className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black tracking-[0.2em] text-white uppercase font-serif">
                  Ongoing Missions
                </h3>
              </div>

              {/* Empty state */}
              <div className="flex flex-col items-center text-center py-8">
                {/* Geometric icon */}
                <div className="relative mb-3">
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-cyan-400/10 blur-xl" />
                  <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
                    <path d="M50 12 L86 82 H14 Z" stroke="#818cf8" strokeWidth="2.5" fill="rgba(129,140,248,0.07)" />
                    <circle cx="50" cy="56" r="14" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 4" />
                    <circle cx="50" cy="56" r="3.5" fill="#c4b5fd" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  No Active Missions
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM SPACER
          ══════════════════════════════════════════════════════════ */}
      <div className="h-24" />

      {/* ══════════════════════════════════════════════════════════
          BOTTOM NAV
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/[0.06] bg-slate-900/90 backdrop-blur-2xl">
        <div className="flex items-center justify-around h-full px-4">
          {["DUNGEONS", "LEVELING", "BOOSTS", "PVP"].map(tab => (
            <span
              key={tab}
              className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              {tab}
            </span>
          ))}
          <span className="ml-4 flex items-center gap-1.5 text-[9px] text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
            ONLINE
          </span>
        </div>
      </div>

    </div>
  );
}
