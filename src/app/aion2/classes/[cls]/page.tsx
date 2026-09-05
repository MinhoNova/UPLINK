"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, X, Sparkles, Users, BookOpen, Swords, Zap, Flame, Shield } from "lucide-react";
import { AION_CLASSES_LIST, AionClass } from "@/lib/aionClasses";

export default function Aion2ClassDetailPage({ params }: { params: { cls: string } }) {
  const cls = AION_CLASSES_LIST.find((c) => c.id === params.cls);
  const [showTalents, setShowTalents] = useState(false);

  if (!cls) {
    return (
      <div className="min-h-screen bg-[#04050d] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Class not found</p>
          <Link href="/aion2/classes" className="mt-4 inline-flex px-5 py-2.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-[11px] font-black tracking-widest">
            BACK TO CLASSES
          </Link>
        </div>
      </div>
    );
  }

  const Icon = cls.icon;

  const TALENTS = [
    { name: "Core Talent", desc: cls.talent, icon: Swords },
    { name: "Mastery", desc: "Unlocks at level 40 — enhances all core abilities.", icon: Sparkles },
    { name: "Signature", desc: "Unique class ultimate with a long cooldown.", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-[#04050d] text-white relative overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans">
      {/* Background tints */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#060a1c] via-[#04050d] to-[#03040a]" />
      <div className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: `radial-gradient(60% 45% at 50% 0%, ${cls.glow}22, transparent)` }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-20">

        {/* Top bar */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/aion2/classes" className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black tracking-[0.15em] text-gray-300 bg-white/[0.03] border border-white/10 hover:text-cyan-200 hover:border-cyan-400/40 transition-all">
            <ChevronRight className="w-3.5 h-3.5 rotate-180" /> ALL CLASSES
          </Link>
          <Link href="/aion2" className="text-[11px] font-black tracking-[0.15em] text-gray-500 hover:text-cyan-200 transition-colors">
            AION 2 LOBBY
          </Link>
        </header>

        {/* Hero — Shorts-style vertical video with info beside it */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10">

          {/* Vertical video card (like a real Short) */}
          <div className="relative shrink-0 w-full max-w-[280px] sm:max-w-[360px] rounded-3xl overflow-hidden border border-white/10 bg-[#070a1a]/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
            {cls.video ? (
              <video
                className="w-full aspect-[9/16] object-cover"
                controls
                autoPlay
                muted
                loop
                playsInline
              >
                <source src={cls.video} type="video/mp4" />
              </video>
            ) : (
              <div className="w-full aspect-[9/16] flex items-center justify-center"
                style={{ background: `radial-gradient(70% 70% at 50% 40%, ${cls.color}18, transparent)` }}>
                <Icon className="w-28 h-28" style={{ color: cls.color }} />
              </div>
            )}

            {/* Bottom caption overlay inside video */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-black/50 backdrop-blur-md"
                  style={{ borderColor: `${cls.color}66`, boxShadow: `0 0 16px ${cls.glow}` }}>
                  <Icon className="w-5 h-5" style={{ color: cls.color }} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-[0.12em] uppercase font-serif text-white">{cls.name}</h1>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase border"
                    style={{ color: cls.color, borderColor: `${cls.color}55`, backgroundColor: `${cls.color}14` }}>
                    {cls.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info column */}
          <div className="flex-1 w-full flex flex-col gap-6">
            {/* Tagline header */}
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-[0.1em] uppercase text-white font-serif">{cls.name}</h2>
              <p className="mt-2 text-sm sm:text-base text-gray-300 font-medium leading-relaxed">{cls.tagline}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users, label: "Party Role", value: cls.role.split(" / ")[0] },
                { icon: Shield, label: "Defense", value: cls.role.includes("Tank") ? "High" : "Medium" },
                { icon: Flame, label: "Damage", value: cls.role.includes("DPS") ? "High" : "Medium" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-[#070a1a]/70 border border-white/10 p-4 text-center backdrop-blur-xl">
                  <s.icon className="w-4 h-4 mx-auto mb-2" style={{ color: cls.color }} />
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-[12px] font-black text-white mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* About */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#070a1a]/70 backdrop-blur-xl p-6">
              <h3 className="text-xs font-black tracking-[0.25em] uppercase text-cyan-200 flex items-center gap-2 mb-4 font-serif">
                <BookOpen className="w-4 h-4 text-cyan-300" /> ABOUT
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                The <span className="text-white font-black">{cls.name}</span> is a {cls.role.toLowerCase()} in Aion 2.
                Masters of their craft, they bring a unique playstyle to any party —
                whether leading the charge in the Abyss or supporting the squad through the toughest dungeons.
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setShowTalents(true)}
              className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-white
                bg-gradient-to-r from-cyan-500/25 via-purple-600/25 to-cyan-500/25 border border-cyan-300/40
                hover:border-cyan-300/70 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all
                flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords className="w-4 h-4" /> VIEW TALENTS
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">
            AION 2 COMMUNITY LOBBY <span className="text-cyan-500/70">&bull;</span> {cls.name.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Talents modal */}
      <AnimatePresence>
        {showTalents && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setShowTalents(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#070a1e]/95 border-2 border-cyan-400/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,255,255,0.2)]"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5" style={{ color: cls.color }} />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white font-serif">{cls.name} TALENTS</h3>
                </div>
                <button type="button" onClick={() => setShowTalents(false)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {TALENTS.map((t) => (
                  <div key={t.name} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <t.icon className="w-4 h-4" style={{ color: cls.color }} />
                      <span className="text-[10px] font-black tracking-widest uppercase text-cyan-100">{t.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}