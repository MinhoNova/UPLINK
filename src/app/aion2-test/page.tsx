"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Headset,
  MessageSquare,
  Star,
  Settings,
  Ticket,
  Shield,
  Coins,
  Zap,
  Swords,
  Users,
  Bell,
  Globe,
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";

/* ─────────────────────────────────────────────
   AION 2 LUXE COLOR PALETTE
   ───────────────────────────────────────────── */
const AION = {
  deepBg: "#07060f",
  purpleGlow: "rgba(139, 92, 246, 0.15)",
  blueGlow: "rgba(59, 130, 246, 0.12)",
  cyan: "#22d3ee",
  pink: "#ec4899",
  gold: "#fbbf24",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  glassBorderHover: "rgba(255, 255, 255, 0.18)",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
};

/* ─────────────────────────────────────────────
   OFFER DATA — lobby offers (downloaded from Create Offer)
   ───────────────────────────────────────────── */
const OFFER_DATA = [
  {
    id: "offer-1",
    avatar: "https://i.pravatar.cc/80?img=11",
    largeNumber: "200K",
    rank: "BRONZE",
    boostDetail: "4X +10",
    region: "US",
    price: "25K PER RUN",
    bgImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f2c?w=600&q=80&fit=crop",
    sold: false,
    category: "DUNGEONS",
  },
  {
    id: "offer-2",
    avatar: "https://i.pravatar.cc/80?img=12",
    largeNumber: "100K",
    rank: "SILVER",
    boostDetail: "2X +10",
    region: "EU",
    price: "15K PER RUN",
    bgImage: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80&fit=crop",
    sold: false,
    category: "LEVELING",
  },
  {
    id: "offer-3",
    avatar: "https://i.pravatar.cc/80?img=13",
    largeNumber: "300K",
    rank: "GOLD",
    boostDetail: "6X +10",
    region: "US",
    price: "50K PER RUN",
    bgImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&fit=crop",
    sold: true,
    category: "BOOSTS",
  },
  {
    id: "offer-4",
    avatar: "https://i.pravatar.cc/80?img=14",
    largeNumber: "50K",
    rank: "BRONZE",
    boostDetail: "1X +10",
    region: "EU",
    price: "10K PER RUN",
    bgImage: "https://images.unsplash.com/photo-1480713725583-91b2f5f229cc?w=600&q=80&fit=crop",
    sold: false,
    category: "PVP",
  },
];

const RANK_COLORS: Record<string, string> = {
  BRONZE: "text-amber-600 bg-amber-900/30 border-amber-700/40",
  SILVER: "text-gray-300 bg-gray-800/40 border-gray-600/40",
  GOLD: "text-yellow-400 bg-yellow-900/30 border-yellow-600/40",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  DUNGEONS: Shield,
  LEVELING: Zap,
  BOOSTS: Swords,
  PVP: Users,
};

/* ─────────────────────────────────────────────
   FLOATING TOOLBAR ITEMS
   ───────────────────────────────────────────── */
const TOOLBAR_ITEMS = [
  { id: "chat", icon: MessageSquare, label: "CHAT", accent: "text-cyan-400" },
  { id: "support", icon: Ticket, label: "SUPPORT", accent: "text-purple-400" },
  { id: "favorites", icon: Star, label: "FAVORITES", accent: "text-amber-400" },
  { id: "settings", icon: Settings, label: "SETTINGS", accent: "text-slate-400" },
];

/* ─────────────────────────────────────────────
   BOTTOM TABS
   ───────────────────────────────────────────── */
const BOTTOM_TABS = [
  { id: "dungeons", label: "DUNGEONS", icon: Shield, active: true },
  { id: "leveling", label: "LEVELING", icon: Zap },
  { id: "boosts", label: "BOOSTS", icon: Swords },
  { id: "pvp", label: "PVP", icon: Users },
];

export default function Aion2TestPage() {
  const { t } = useI18n();
  const [soundsOn, setSoundsOn] = useState(true);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [hoveredOffer, setHoveredOffer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dungeons");
  const [lang, setLang] = useState("EN");

  return (
    <div className="min-h-screen bg-[#07060f] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden relative">

      {/* ═══════════════════════════════════════════
         STATIC ATMOSPHERIC BACKGROUND — Aion 2 Luxe
         (Blurred purple/blue fantasy scene + subtle overlays)
         ═══════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">

        {/* Main blurred background image — Aion 2 / fantasy theme */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80&fit=crop"
            alt="Aion 2 atmosphere"
            width={1600}
            height={900}
            className="w-full h-full object-cover blur-[60px] opacity-70"
          />
        </div>

        {/* Deep purple/blue gradient layer over the image */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/15" />

        {/* Right-side purple glow */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]" />

        {/* Bottom-left blue glow */}
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-blue-600/8 blur-[80px]" />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,6,15,0.7)_100%)]" />

        {/* Faint sparkle dust */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="sparkles" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="30" r="1" fill="white" />
                <circle cx="70" cy="60" r="0.8" fill="white" />
                <circle cx="40" cy="80" r="1.2" fill="white" />
                <circle cx="90" cy="20" r="0.6" fill="white" />
                <circle cx="10" cy="70" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sparkles)" />
          </svg>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
         TOP NAVBAR — GLASSY PREMIUM
         ═══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#07060f]/60 backdrop-blur-2xl border-b border-white/[0.06] flex items-center px-5">
        <div className="flex items-center gap-8 w-full max-w-[1600px] mx-auto">

          {/* LOGO — pink-to-purple gradient like the screenshot */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white text-sm font-black">U</span>
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-transparent bg-clip-text">
              UPLINK
            </span>
          </div>

          {/* Center nav — pill-shaped buttons */}
          <div className="flex items-center gap-2">
            <button className="text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full border border-yellow-400/40 text-yellow-400 bg-yellow-400/5 hover:bg-yellow-400/10 transition-all">
              CLUB
            </button>
            <button className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all">
              <MessageSquare className="w-3.5 h-3.5" /> DM
            </button>
            <button className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all">
              <Zap className="w-3.5 h-3.5" /> AUTO OFF
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full border border-pink-500/50 text-pink-400 hover:bg-pink-500/10 transition-all">
              DARK
            </button>
            <button className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-all">
              <Globe className="w-3 h-3" /> PAUSE BG
            </button>
            {/* Language selector */}
            <button
              onClick={() => setLang(lang === "EN" ? "AR" : "EN")}
              className="text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/30 transition-all"
            >
              {lang}
            </button>
          </div>

          {/* Right — user profile with gradient name */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-slate-500 hover:text-slate-300 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shadow-lg shadow-purple-500/10 flex-shrink-0">
                <Image
                  src="https://i.pravatar.cc/80?img=11"
                  alt="User"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <span className="text-[11px] font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                OMAR SALEH
              </span>
              <span className="text-[8px] font-bold tracking-widest text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded-full uppercase shadow-sm shadow-yellow-400/20">
                CLUB
              </span>
            </div>
          </div>

        </div>
      </nav>

      {/* ═══════════════════════════════════════════
         HERO SECTION — Premium glassy style
         ═══════════════════════════════════════════ */}
      <section className="relative z-10 w-full h-[600px] flex items-center justify-center overflow-hidden pt-16">
        <div className="text-center px-5">

          {/* Hero background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

          {/* Tagline top */}
          <p className="text-[11px] font-bold tracking-[0.3em] text-cyan-400 uppercase mb-6">
            FIND YOUR CREW
          </p>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-4 leading-none">
            FIND YOUR
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400">
              CREW
            </span>
          </h1>

          {/* Sub-header */}
          <p className="text-[11px] font-bold tracking-[0.4em] text-slate-400 uppercase mb-3">
            DUNGEONS&nbsp;&nbsp;+&nbsp;&nbsp;RAIDS&nbsp;&nbsp;+&nbsp;&nbsp;LEVELING
          </p>

          {/* Description */}
          <p className="text-sm text-slate-400 font-medium max-w-md mx-auto mb-10 leading-relaxed">
            Find trusted players for your next adventure.
          </p>

          {/* CTA Button — dark pill with inner glow, matching screenshot */}
          <a
            href="/aion2/create-offer"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#0a0a14] border border-white/[0.1] rounded-full text-[10px] font-black tracking-[0.3em] uppercase text-white shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:shadow-[0_0_50px_rgba(139,92,246,0.3)] hover:border-white/20 transition-all duration-300 relative overflow-hidden group"
          >
            {/* Inner glow */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Sparkles className="w-4 h-4 relative z-10 text-purple-400" />
            <span className="relative z-10">CREATE YOUR OFFER</span>
            <span className="relative z-10 text-lg leading-none group-hover:translate-x-1 transition-transform">&gt;</span>
          </a>

        </div>
      </section>

      {/* ═══════════════════════════════════════════
         DIVIDER
         ═══════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 mt-12">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════════
         MAIN CONTENT: Offers + Sidebar
         ═══════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 pb-32">
        <div className="grid grid-cols-[1fr_340px] gap-8">

          {/* ═══ LEFT: OFFERS SECTION ═══ */}
          <section>

            {/* OFFERS HEADER — pink bar + toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Pink bar with glassy finish */}
                <div className="h-11 px-5 rounded-l-2xl bg-gradient-to-r from-pink-500/80 via-purple-500 to-cyan-500 flex items-center gap-2 shadow-[0_0_25px_rgba(236,72,153,0.25)]">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-[11px] font-black tracking-[0.3em] uppercase text-white">
                    OFFERS
                  </span>
                </div>
              </div>
              {/* Toggle switch — glassy style */}
              <button
                onClick={() => setSoundsOn(!soundsOn)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-bold tracking-widest uppercase transition-all duration-200 backdrop-blur-md ${
                  soundsOn
                    ? "bg-pink-500/10 border-pink-500/30 text-pink-300"
                    : "bg-white/[0.04] border-white/[0.08] text-slate-500"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    soundsOn ? "bg-pink-400 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.5)]" : "bg-slate-600"
                  }`}
                />
                {t("offers_online") || "NEW OFFER ALERT SOUNDS ON"}
              </button>
            </div>

            {/* OFFER CARDS — Glass cards */}
            <div className="space-y-4">
              {OFFER_DATA.map((offer) => {
                const Icon = CATEGORY_ICONS[offer.category] || Shield;
                const isHovered = hoveredOffer === offer.id;
                const rankColor = RANK_COLORS[offer.rank] || "text-slate-400 bg-gray-800/30 border-gray-600/30";

                return (
                  <div
                    key={offer.id}
                    className="relative group cursor-pointer"
                    onMouseEnter={() => setHoveredOffer(offer.id)}
                    onMouseLeave={() => setHoveredOffer(null)}
                  >

                    {/* Glass card container */}
                    <div
                      className={`relative w-full h-36 rounded-2xl overflow-hidden flex items-stretch transition-all duration-300 backdrop-blur-md ${
                        isHovered
                          ? "shadow-[0_0_50px_rgba(139,92,246,0.25)] border-purple-400/30 scale-[1.01]"
                          : "border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                      style={{
                        background: isHovered
                          ? `linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))`
                          : "linear-gradient(135deg, rgba(10,10,20,0.8), rgba(7,6,15,0.9))",
                        boxShadow: isHovered
                          ? "0 20px 60px -10px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
                          : "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                      }}
                    >

                      {/* ── LEFT SIDE: Profile + Info ── */}
                      <div className="flex items-stretch w-2/3 p-5 gap-5 relative z-10">

                        {/* Avatar — glass ring */}
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 flex-shrink-0" style={{
                          borderColor: isHovered ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)",
                          boxShadow: isHovered ? "0 0 20px rgba(139,92,246,0.3)" : "0 0 10px rgba(0,0,0,0.4)",
                        }}>
                          <Image
                            src={offer.avatar}
                            alt="Player"
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                          {/* Rank badge on avatar — glassy */}
                          <div
                            className={`absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${rankColor} border backdrop-blur-sm`}
                            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                          >
                            {offer.rank}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          {/* Category icon + name — glassy tag */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center backdrop-blur-sm">
                              <Icon className="w-3 h-3 text-purple-400" />
                            </div>
                            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-slate-400">
                              {offer.category}
                            </span>
                          </div>

                          {/* Large number — premium typography */}
                          <span className="text-3xl font-black text-white/90 tracking-tight leading-none">
                            {offer.largeNumber}
                          </span>

                          {/* Boost details + price row */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                              <Users className="w-3 h-3 text-purple-400/60" />
                              {offer.boostDetail}
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-slate-300 backdrop-blur-sm">
                              {offer.region}
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 backdrop-blur-sm">
                              <Coins className="w-3 h-3" />
                              {offer.price}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* ── RIGHT SIDE: Background image + screenshots ── */}
                      <div className="w-1/3 relative overflow-hidden">
                        {/* Blurred background image — glassy overlay */}
                        <div className="absolute inset-0">
                          <Image
                            src={offer.bgImage}
                            alt="Background"
                            width={200}
                            height={128}
                            className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity blur-[3px]"
                          />
                          {/* Dark gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-l from-[#07060f]/70 to-transparent" />
                        </div>

                        {/* 5 screenshot placeholders — glassy */}
                        <div className="absolute bottom-3 right-3 flex gap-1.5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="w-9 h-9 rounded-md bg-black/60 border border-white/[0.06] backdrop-blur-sm flex items-center justify-center overflow-hidden transition-all group-hover:border-purple-400/30 group-hover:scale-105"
                            >
                              <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[4px] border-r-[4px] border-t-transparent border-b-transparent border-l-white/20 border-r-white/20 opacity-50" />
                            </div>
                          ))}
                        </div>

                        {/* "SOLD" indicator */}
                        {offer.sold && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-[8px] font-black tracking-widest text-pink-300 uppercase backdrop-blur-sm">
                            SOLD
                          </div>
                        )}

                        {/* Category tag at bottom-left */}
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 border border-white/[0.06] text-[8px] font-bold tracking-widest text-slate-400 uppercase backdrop-blur-sm">
                          {offer.category}
                        </div>
                      </div>

                      {/* Hover glow edge */}
                      {isHovered && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-purple-400/20 pointer-events-none" />
                      )}

                    </div>

                    {/* Bottom accent line on hover */}
                    {isHovered && (
                      <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-b-2xl" />
                    )}

                  </div>
                );
              })}
            </div>

          </section>

          {/* ═══ RIGHT: SIDEBAR — GLASSY PANEL ═══ */}
          <aside className="flex flex-col gap-4">
            <div className="relative w-full h-full rounded-2xl bg-[#0a0a14]/60 backdrop-blur-2xl border border-white/[0.06] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)]">

              {/* Header */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/[0.06]">
                <div className="w-6 h-6 rounded-md bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Headset className="w-3 h-3 text-pink-400" />
                </div>
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-white">
                  ONGOING MISSIONS
                </h3>
              </div>

              {/* Content — glassy empty state */}
              <div className="flex flex-col items-center text-center py-8">
                {/* Headset icon — glassy circle */}
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full bg-pink-500/10 blur-xl" />
                  <div className="absolute inset-0 rounded-full border border-pink-500/10 backdrop-blur-sm flex items-center justify-center">
                    <Headset className="w-7 h-7 text-pink-400/60" />
                  </div>
                </div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
                  NO ACTIVE MISSIONS
                </p>
                <p className="text-[8px] text-slate-600 mt-1.5">
                  Start a mission from the lobby
                </p>
              </div>

              {/* Bottom mini-cta — glassy button */}
              <div className="mt-auto pt-3 border-t border-white/[0.04]">
                <button className="w-full text-center text-[9px] font-bold tracking-widest uppercase text-pink-400/60 hover:text-pink-400 py-2.5 rounded-xl bg-white/[0.03] border border-pink-500/10 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all backdrop-blur-sm">
                  VIEW MISSIONS
                </button>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* ═══════════════════════════════════════════
         FLOATING TOOLBAR — GLASSY ICONS
         ═══════════════════════════════════════════ */}
      <div className="fixed left-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
        {TOOLBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTool(activeTool === item.id ? null : item.id)}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md ${
              activeTool === item.id
                ? "bg-[#151c3d]/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
                : "bg-[#0a0f26]/60 text-slate-500 border border-white/[0.06] hover:text-purple-300 hover:border-purple-500/30 hover:bg-purple-500/10"
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            {activeTool === item.id && (
              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
            )}
            {/* Glass tooltip */}
            <div className={`absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0a0f26]/80 border border-white/[0.06] text-[9px] font-bold tracking-widest text-slate-400 uppercase whitespace-nowrap backdrop-blur-md transition-all duration-200 ${
              activeTool === item.id ? "opacity-100 visible" : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
            }`}>
              {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
         BOTTOM NAVIGATION — GLASSY TABS
         ═══════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-[#07060f]/60 backdrop-blur-2xl border-t border-white/[0.06] flex items-center px-5">
        <div className="flex items-center justify-center gap-2 w-full max-w-[1600px] mx-auto">
          {BOTTOM_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-200 ${
                tab.active
                  ? "bg-gradient-to-r from-purple-500/20 via-cyan-500/10 to-purple-500/20 border border-purple-500/30 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                  : "bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/10"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${tab.active ? "text-purple-400" : "text-slate-500"}`} />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                {tab.label}
              </span>
            </button>
          ))}
          {/* Spacer */}
          <div className="flex-1" />
          {/* Bottom right — subtle status */}
          <div className="flex items-center gap-2 text-[9px] text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
            <span>ONLINE</span>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
         BOTTOM SPACER (for fixed bottom nav)
         ═══════════════════════════════════════════ */}
      <div className="h-20" />

    </div>
  );
}
