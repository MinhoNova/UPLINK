"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Play, Sparkles } from "lucide-react";
import { AION_CLASSES_LIST } from "@/lib/aionClasses";

export default function Aion2ClassesPage() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#04050d] text-white relative overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#060a1c] via-[#04050d] to-[#03040a]" />
      <div className="fixed inset-0 -z-10 opacity-40 pointer-events-none bg-[radial-gradient(60%_40%_at_20%_0%,rgba(56,189,248,0.15),transparent),radial-gradient(50%_40%_at_80%_10%,rgba(168,85,247,0.12),transparent)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-20">

        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <Link href="/aion2" className="flex items-center gap-2 group cursor-pointer">
            <span className="text-2xl sm:text-3xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent font-serif">AION</span>
            <span className="text-2xl sm:text-3xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent font-serif">2</span>
          </Link>

          <Link href="/aion2" className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black tracking-[0.15em] text-gray-300 bg-white/[0.03] border border-white/10 hover:text-cyan-200 hover:border-cyan-400/40 transition-all">
            <ChevronRight className="w-3.5 h-3.5 rotate-180" /> BACK TO LOBBY
          </Link>
        </header>

        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-cyan-300/20 bg-black/30">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span className="text-[9px] font-black tracking-[0.3em] text-cyan-100/80 uppercase">Choose Your Legend</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-[0.12em] font-serif">
            <span className="bg-gradient-to-b from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,189,248,0.5)]">THE CLASSES</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto">
            Preview every Aion 2 class. Tap a class to watch its cinematic and unlock its talents.
          </p>
        </div>

        {/* Class grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AION_CLASSES_LIST.map((cls, i) => {
            const Icon = cls.icon;
            const hasVideo = !!cls.video;
            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHovered(cls.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <Link
                  href={`/aion2/classes/${cls.id}`}
                  className="group relative block rounded-3xl overflow-hidden border border-white/10 hover:border-cyan-400/50 bg-[#070a1a]/80 backdrop-blur-xl
                    shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(56,189,248,0.2)]
                    transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Preview video (Ranger and future classes) */}
                  {hasVideo && (
                    <div className="relative h-44 w-full overflow-hidden">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070a1a] to-transparent" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-cyan-400/30 border-2 border-cyan-300/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(0,255,255,0.5)]">
                          <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Non-video placeholder */}
                  {!hasVideo && (
                    <div className="relative h-44 w-full flex items-center justify-center"
                      style={{ background: `radial-gradient(80% 80% at 50% 30%, ${cls.color}14, transparent)` }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full opacity-40 blur-2xl" style={{ backgroundColor: cls.color }} />
                        <Icon className="w-16 h-16 relative" style={{ color: cls.color }} />
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="px-4 py-2 rounded-full bg-white/10 border border-white/30 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-black tracking-widest">
                          <Play className="w-3 h-3" /> COMING SOON
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="relative p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center border"
                          style={{ borderColor: `${cls.color}66`, backgroundColor: `${cls.color}1a` }}>
                          <Icon className="w-4 h-4" style={{ color: cls.color }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black tracking-widest text-white uppercase font-serif">{cls.name}</h3>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{cls.role}</p>
                        </div>
                      </div>
                      <span className="text-gray-500 group-hover:text-cyan-300 transition-colors"><ChevronRight className="w-4 h-4" /></span>
                    </div>
                    <div className="mt-3 text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-2">{cls.talent}</div>
                  </div>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(to right, transparent, ${cls.color}, transparent)` }} />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">
            AION 2 COMMUNITY LOBBY <span className="text-cyan-500/70">&bull;</span> CLASS GALLERY
          </p>
        </div>
      </div>
    </div>
  );
}