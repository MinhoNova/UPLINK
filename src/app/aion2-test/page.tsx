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
  ChevronUp,
  Play
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";

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
    bgImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f2c?w=600&q=80&fit=crop", // cityscape-like
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
  { id: "chat", icon: MessageSquare, label: "CHAT", color: "text-yellow-400" },
  { id: "support", icon: Ticket, label: "SUPPORT", color: "text-purple-400" },
  { id: "favorites", icon: Star, label: "FAVORITES", color: "text-orange-400" },
  { id: "settings", icon: Settings, label: "SETTINGS", color: "text-slate-400" },
];

export default function Aion2TestPage() {
  const { t } = useI18n();
  const [soundsOn, setSoundsOn] = useState(true);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [hoveredOffer, setHoveredOffer] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#020208] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden relative">

      {/* ═══════════════════════════════════════════
         STATIC BACKGROUND — Aion 2 atmosphere (replaces video)
         ═══════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Deep navy base */}
        <div className="absolute inset-0 bg-[#05050a]" />
        {/* Nebula glow — top-right (purple) */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-[120px] translate-y-[-100px] translate-x-[100px]" />
        {/* Nebula glow — bottom-left (cyan/blue) */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[100px] translate-y-[100px] translate-x-[-100px]" />
        {/* Subtle center vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,2,8,0.95)_100%)]" />
        {/* Faint grid-line pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════
         TOP NAVBAR (matching original screenshot)
         ═══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#020208]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4">
        <div className="flex items-center gap-8 w-full max-w-[1600px] mx-auto">

          {/* LOGO */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-0 h-0 border-b-[12px] border-l-[8px] border-r-[8px] border-b-purple-400 border-l-transparent border-r-transparent" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-widest text-yellow-400 uppercase">
                BETA
              </span>
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              UPLINK
            </span>
          </div>

          {/* Center nav */}
          <div className="flex items-center gap-1">
            <button className="text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 transition-colors">
              CLUB
            </button>
            <button className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded bg-white/5 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20 transition-all">
              <MessageSquare className="w-3.5 h-3.5" /> DM
            </button>
            <button className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded bg-white/5 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20 transition-all">
              <Zap className="w-3.5 h-3.5" /> AUTO OFF
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded border border-pink-500/50 text-pink-400 hover:bg-pink-500/10 transition-colors">
              DARK
            </button>
          </div>

          {/* Right — user profile */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-slate-500 hover:text-slate-300 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                <Image
                  src="https://i.pravatar.cc/80?img=11"
                  alt="User"
                  width={28}
                  height={28}
                  className="object-cover"
                />
              </div>
              <span className="text-[11px] font-bold tracking-wide text-cyan-400">
                OMAR SELLH
              </span>
              <span className="text-[8px] font-bold tracking-widest text-pink-400 border border-pink-500/30 px-1.5 py-0.5 rounded-full uppercase">
                CLUB
              </span>
            </div>
          </div>

        </div>
      </nav>

      {/* ═══════════════════════════════════════════
         HERO SECTION — kept EXACTLY as original
         ═══════════════════════════════════════════ */}
      <section className="relative z-10 w-full h-[600px] flex items-center justify-center overflow-hidden pt-16">
        <div className="text-center">

          {/* Large graphic box */}
          <div className="relative inline-block mb-6">
            {/* Glow behind the box */}
            <div className="absolute inset-0 bg-cyan-400/10 blur-[40px] rounded-[2rem]" />
            {/* Main box */}
            <div className="relative bg-[#020208]/60 backdrop-blur-sm border border-cyan-400/10 rounded-[2rem] px-12 py-10 inline-flex flex-col items-center gap-2">
              {/* "YOUR" in cyan */}
              <span className="text-[14px] font-black tracking-[0.3em] text-cyan-400 uppercase">
                YOUR
              </span>
              {/* "H" pink + "ME" pink with door replacing O */}
              <div className="flex items-center gap-1">
                <span className="text-5xl font-black text-pink-500">H</span>
                <span className="text-5xl font-black text-pink-500">M</span>
                {/* Door icon replacing O */}
                <div className="w-10 h-10 flex items-center justify-center bg-purple-500/10 border border-purple-500/20 rounded-md mx-1">
                  <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[10px] border-r-[10px] border-t-transparent border-b-transparent border-l-purple-400 border-r-transparent mx-0.5" />
                  <div className="w-3 h-4 bg-purple-400/30 absolute bottom-1 rounded-sm" />
                </div>
                <span className="text-5xl font-black text-pink-500">E</span>
              </div>
              {/* "OPEN PROFILE" small text */}
              <span className="text-[9px] font-bold tracking-[0.3em] text-slate-500 uppercase">
                OPEN PROFILE
              </span>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-white text-sm font-medium max-w-lg mx-auto leading-relaxed">
            FIND YOUR CREW FOR KEYS, BOOSTS &amp; LEVELING — FAST, CLEAR, NO CLUTTER.
          </p>

          {/* CTA Button — kept exactly as original */}
          <div className="mt-8">
            <a
              href="/aion2/create-offer"
              className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-cyan-400 to-pink-500 text-white text-[10px] font-black tracking-[0.3em] uppercase rounded-full shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,0,127,0.5)] transition-all duration-300 relative overflow-hidden group"
            >
              {/* Animated shimmer */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] group-hover:opacity-100" />
              <Sparkles className="w-4 h-4 relative z-10" />
              <span className="relative z-10">CREATE YOUR OFFER</span>
              <span className="relative z-10 text-lg leading-none group-hover:translate-x-1 transition-transform">+</span>
            </a>
          </div>

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
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 pb-28">
        <div className="grid grid-cols-[1fr_340px] gap-8">

          {/* ═══ LEFT: OFFERS SECTION ═══ */}
          <section>

            {/* OFFERS HEADER — pink bar + toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Pink bar */}
                <div className="h-10 px-5 rounded-l-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,127,0.3)]">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-[11px] font-black tracking-[0.3em] uppercase text-white">
                    OFFERS
                  </span>
                </div>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => setSoundsOn(!soundsOn)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-bold tracking-widest uppercase transition-all duration-200 ${
                  soundsOn
                    ? "bg-pink-500/10 border-pink-500/30 text-pink-300"
                    : "bg-white/5 border-white/[0.08] text-slate-500"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    soundsOn ? "bg-pink-400 animate-pulse" : "bg-slate-600"
                  }`}
                />
                {t("offers_online") || "NEW OFFER ALERT SOUNDS ON"}
              </button>
            </div>

            {/* OFFER CARDS */}
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
                    {/* Card container */}
                    <div
                      className={`relative w-full h-32 rounded-2xl overflow-hidden flex items-stretch transition-all duration-300 ${
                        isHovered
                          ? "shadow-[0_0_40px_rgba(124,58,237,0.2)] border-purple-500/30"
                          : "border-white/[0.08] hover:border-white/20"
                      }`}
                      style={{
                        background: isHovered
                          ? `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.1))`
                          : "linear-gradient(135deg, #0a0a14, #050814)",
                      }}
                    >

                      {/* ── LEFT SIDE: Profile + Info ── */}
                      <div className="flex items-stretch w-2/3 p-4 gap-4 relative z-10">

                        {/* Avatar */}
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:border-purple-400/50 transition-colors">
                          <Image
                            src={offer.avatar}
                            alt="Player"
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                          {/* Rank badge on avatar */}
                          <div
                            className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${rankColor} border`}
                          >
                            {offer.rank}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          {/* Category icon + name */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="w-3 h-3 text-purple-400" />
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-500">
                              {offer.category}
                            </span>
                          </div>

                          {/* Large number */}
                          <span className="text-3xl font-black text-white/90 tracking-tight">
                            {offer.largeNumber}
                          </span>

                          {/* Boost details + price row */}
                          <div className="flex items-center gap-4 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-purple-400/60" />
                              {offer.boostDetail}
                            </span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] text-slate-300">
                              {offer.region}
                            </span>
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <Coins className="w-3 h-3" />
                              {offer.price}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* ── RIGHT SIDE: Background image + screenshots ── */}
                      <div className="w-1/3 relative overflow-hidden">
                        {/* Blurry background image */}
                        <div className="absolute inset-0">
                          <Image
                            src={offer.bgImage}
                            alt="Background"
                            width={200}
                            height={128}
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity blur-[2px]"
                          />
                          {/* Dark overlay */}
                          <div className="absolute inset-0 bg-gradient-to-l from-[#020208]/80 to-transparent" />
                        </div>

                        {/* 5 screenshot placeholders in a row */}
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded bg-black/60 border border-white/[0.06] flex items-center justify-center overflow-hidden"
                            >
                              <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[4px] border-r-[4px] border-t-transparent border-b-transparent border-l-white/20 border-r-white/20 opacity-40" />
                            </div>
                          ))}
                        </div>

                        {/* "SOLD" indicator on edge (if sold) */}
                        {offer.sold && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-pink-500/20 border border-pink-500/30 text-[8px] font-black tracking-widest text-pink-300 uppercase">
                            SOLD
                          </div>
                        )}

                        {/* Category tag at bottom-left of image side */}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/50 border border-white/[0.06] text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                          {offer.category}
                        </div>
                      </div>

                      {/* Hover glow edge */}
                      {isHovered && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/30 pointer-events-none" />
                      )}

                    </div>

                    {/* Bottom accent line on hover */}
                    {isHovered && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-b-2xl" />
                    )}

                  </div>
                );
              })}
            </div>

          </section>

          {/* ═══ RIGHT: SIDEBAR — ONGOING MISSIONS ═══ */}
          <aside className="flex flex-col gap-4">
            <div className="relative w-full h-full rounded-2xl bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.06] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">

              {/* Header */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/[0.06]">
                <Headset className="w-4 h-4 text-pink-400" />
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-white">
                  ONGOING MISSIONS
                </h3>
              </div>

              {/* Content */}
              <div className="flex flex-col items-center text-center py-6">
                {/* Headset icon */}
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-pink-500/10 rounded-full blur-xl" />
                  <Headset className="w-8 h-8 text-pink-400/60" />
                </div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">
                  NO ACTIVE MISSIONS
                </p>
                <p className="text-[8px] text-slate-600 mt-1">
                  Start a mission from the lobby
                </p>
              </div>

              {/* Bottom mini-cta */}
              <div className="mt-auto pt-3 border-t border-white/[0.04]">
                <button className="w-full text-center text-[9px] font-bold tracking-widest uppercase text-pink-400/60 hover:text-pink-400 py-2 rounded border border-pink-500/10 hover:border-pink-500/30 transition-all">
                  VIEW MISSIONS
                </button>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* ═══════════════════════════════════════════
         FLOATING TOOLBAR — left edge
         ═══════════════════════════════════════════ */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
        {TOOLBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTool(activeTool === item.id ? null : item.id)}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              activeTool === item.id
                ? "bg-[#151c3d] text-blue-300 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                : "bg-[#0a0f26]/80 text-slate-500 border border-blue-900/40 hover:text-blue-300 hover:border-blue-500/30"
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            {activeTool === item.id && (
              <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
            {/* Tooltip on hover */}
            {item.id !== activeTool && (
              <div className="absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[#0a0f26] border border-white/[0.06] text-[9px] font-bold tracking-widest text-slate-400 uppercase whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {item.label}
              </div>
            )}
          </button>
        ))}
        {/* Bottom spacer */}
        <div className="w-0 h-4" />
      </div>

      {/* ═══════════════════════════════════════════
         BOTTOM SPACER
         ═══════════════════════════════════════════ */}
      <div className="h-12" />

    </div>
  );
}
