"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Music } from "lucide-react";
import { AION_CLASSES_LIST } from "@/lib/aionClasses";

const SHORTS_CLASSES = AION_CLASSES_LIST.slice(0, 8);

export default function Aion2ClassesPage() {
  return (
    <div className="min-h-screen bg-[#04050d] text-white relative overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#060a1c] via-[#04050d] to-[#03040a]" />
      <div className="fixed inset-0 -z-10 opacity-40 pointer-events-none bg-[radial-gradient(60%_40%_at_20%_0%,rgba(56,189,248,0.15),transparent),radial-gradient(50%_40%_at_80%_10%,rgba(168,85,247,0.12),transparent)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-20">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/aion2" className="flex items-center gap-2 group cursor-pointer">
            <span className="text-2xl sm:text-3xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent font-serif">AION</span>
            <span className="text-2xl sm:text-3xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent font-serif">2</span>
          </Link>

          <Link href="/aion2" className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black tracking-[0.15em] text-gray-300 bg-white/[0.03] border border-white/10 hover:text-cyan-200 hover:border-cyan-400/40 transition-all">
            <ChevronRight className="w-3.5 h-3.5 rotate-180" /> BACK TO LOBBY
          </Link>
        </header>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border border-cyan-300/20 bg-black/30">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span className="text-[9px] font-black tracking-[0.3em] text-cyan-100/80 uppercase">Class Shorts — Choose Your Legend</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-[0.12em] font-serif">
            <span className="bg-gradient-to-b from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,189,248,0.5)]">THE CLASSES</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto">
            Watch each class cinematic, then tap to unlock talents and everything about it.
          </p>
        </div>

        {/* Shorts grid — 4 up / 4 down */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {SHORTS_CLASSES.map((cls, i) => {
            const Icon = cls.icon;
            const hasVideo = !!cls.video;
            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative"
              >
                <Link
                  href={`/aion2/classes/${cls.id}`}
                  className="group relative block aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 hover:border-cyan-400/60
                    bg-[#070a1a] shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_0_45px_rgba(56,189,248,0.25)]
                    transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Shorts video fills the full tall card */}
                  {hasVideo ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    >
                      <source src={cls.video} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: `radial-gradient(90% 70% at 50% 35%, ${cls.color}1f, transparent)` }}>
                      <Icon className="w-16 h-16" style={{ color: cls.color }} />
                    </div>
                  )}

                  {/* cinematic scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30 pointer-events-none" />

                  {/* bottom info (Shorts-like caption) */}
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center"
                        style={{ backgroundColor: `${cls.color}2a`, borderColor: `${cls.color}88` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: cls.color }} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black text-cyan-200">{cls.name}</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase font-serif leading-tight">{cls.tagline.split("—")[0]}</h3>
                    <p className="mt-1 text-[8px] sm:text-[9px] text-gray-300 font-bold flex items-center gap-1">
                      <Music className="w-3 h-3 text-gray-400" /> {cls.role}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">
            AION 2 COMMUNITY LOBBY <span className="text-cyan-500/70">&bull;</span> CLASS SHORTS
          </p>
        </div>
      </div>
    </div>
  );
}