"use client";

import { useState } from "react";
import { Sparkles, Star, Coins, Users, Swords, Shield, Zap, Search } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

// ── OFFER DATA ──
const OFFERS = [
  {
    id: "seed-1",
    title: "DUNGEON BOOST",
    players: "4 × +10",
    region: "US",
    reward: "25K PER RUN",
    gradient: "from-indigo-900/40 via-purple-900/20 to-black",
    accent: "#7c3aed",
  },
  {
    id: "seed-2",
    title: "LEVELING 1-80",
    players: "4 × +10",
    region: "EU",
    reward: "50K PER RUN",
    gradient: "from-slate-900/60 via-blue-900/30 to-black",
    accent: "#2563eb",
  },
  {
    id: "seed-3",
    title: "PVP MATCHMAKING",
    players: "2 × 1v1",
    region: "US",
    reward: "15K PER MATCH",
    gradient: "from-red-900/40 via-rose-900/20 to-black",
    accent: "#dc2626",
  },
  {
    id: "seed-4",
    title: "RAID PREP GUIDE",
    players: "Fixed Group",
    region: "EU",
    reward: "FREE GUIDE",
    gradient: "from-emerald-900/40 via-teal-900/20 to-black",
    accent: "#059669",
  },
];

export default function Aion2TestPage() {
  const { t } = useI18n();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#05050a] text-white font-sans selection:bg-[#7c3aed]/40 overflow-x-hidden">

      {/* ═══ STATIC BACKGROUND — Aion 2 atmosphere ═══ */}
      {/* Deep layered gradients: dark navy → purple mist at edges → pure black center */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a14] via-[#050814] to-[#020208]" />
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative z-10 w-full pt-28 pb-16 px-5 text-center">
        <div className="max-w-3xl mx-auto">

          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#7c3aed]/60" />
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-[#a78bfa]">
              {t("hero_crew")}
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#7c3aed]/60" />
          </div>

          {/* Main Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none mb-5">
            FIND YOUR
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] via-[#7c3aed] to-[#3b82f6]">
              CREW
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-[11px] font-bold tracking-[0.3em] text-slate-500 uppercase mb-2">
            {t("hero_tagline")}
          </p>
          <p className="text-xs text-slate-600 font-medium mb-12 max-w-md mx-auto">
            {t("hero_adventure")}
          </p>

          {/* Create Offer Button — kept, minimal brutal style */}
          <a
            href="/aion2/create-offer"
            className="inline-flex items-center gap-3 px-10 py-4 bg-[#0a0a14] border border-[#7c3aed]/50 rounded-none text-[10px] font-black tracking-[0.3em] uppercase hover:bg-[#7c3aed]/10 hover:border-[#7c3aed]/80 transition-all duration-200 group relative overflow-hidden"
          >
            {/* Subtle scan-line hover glow */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#7c3aed]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative text-white">{t("hero_create")}</span>
            <span className="relative text-[#a78bfa] group-hover:translate-x-1 transition-transform text-lg leading-none">›</span>
          </a>

        </div>
      </section>

      {/* ═══ DIVIDER ═══ */}
      <div className="relative z-10 max-w-3xl mx-auto px-5 mb-12">
        <div className="h-px bg-gradient-to-r from-transparent via-[#7c3aed]/30 to-transparent" />
      </div>

      {/* ═══ OFFERS SECTION — brutal brutal list ═══ */}
      <section className="relative z-10 w-full px-5 pb-32">
        <div className="max-w-3xl mx-auto">

          {/* Section header */}
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-4 h-4 text-[#a78bfa]" />
            <h2 className="text-[11px] font-black tracking-[0.3em] uppercase text-[#a78bfa]">
              {t("offers_header")}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#7c3aed]/20 to-transparent ml-3" />
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#7c3aed]/5 border border-[#7c3aed]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">
                {t("offers_online")}
              </span>
            </div>
          </div>

          {/* Offers list — brutal individual rows, no cards, no tabs */}
          <div className="space-y-2">
            {OFFERS.map((offer, idx) => (
              <div
                key={offer.id}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >

                {/* Row background — brutal dark with subtle left accent bar */}
                <div
                  className={`relative flex items-center gap-5 px-5 py-4 bg-[#0a0a14]/60 border border-white/[0.04] rounded-none transition-all duration-200 ${
                    hoverIdx === idx
                      ? "border-[#7c3aed]/30 bg-[#0a0a14] shadow-[0_0_30px_rgba(124,58,237,0.08)]"
                      : "hover:border-white/[0.08]"
                  }`}
                >

                  {/* LEFT — Icon */}
                  <div
                    className="w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                    style={{ background: `linear-gradient(135deg, ${offer.accent}22, transparent)` }}
                  >
                    <Star
                      className="w-5 h-5"
                      style={{ color: hoverIdx === idx ? offer.accent : "#4b5563" }}
                    />
                  </div>

                  {/* MIDDLE — Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black tracking-[0.2em] uppercase text-white mb-2">
                      {offer.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-[#4b5563]" />
                        {offer.players}
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] text-slate-300">
                        {offer.region}
                      </span>
                      <span className="flex items-center gap-1.5 text-[#f59e0b]">
                        <Coins className="w-3 h-3" />
                        {offer.reward}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT — Accent indicator */}
                  <div
                    className="w-1 h-full bg-[#7c3aed]/40 transition-all duration-200 flex-shrink-0"
                    style={{
                      background: hoverIdx === idx
                        ? `linear-gradient(180deg, ${offer.accent}88, ${offer.accent}44)`
                        : `linear-gradient(180deg, ${offer.accent}33, ${offer.accent}11)`,
                      height: hoverIdx === idx ? "100%" : "60%",
                      alignSelf: hoverIdx === idx ? "stretch" : "center",
                    }}
                  />

                </div>

                {/* Bottom edge — thin accent line on hover */}
                {hoverIdx === idx && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[${offer.accent}] to-transparent"
                    style={{ background: `linear-gradient(90deg, transparent, ${offer.accent}88, transparent)` }}
                  />
                )}

              </div>
            ))}
          </div>

          {/* Empty state (hidden for now, but kept for completeness) */}
          {OFFERS.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                {t("offers_empty")}
              </p>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
