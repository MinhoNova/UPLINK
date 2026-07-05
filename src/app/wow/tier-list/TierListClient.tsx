"use client";

import Link from "next/link";
import Image from "next/image";
import { SPECS, getClassColor, CLASS_NAMES } from "@/lib/wowData";
import { Swords, HeartHandshake, Shield, ChevronRight } from "lucide-react";
import ClassSidebar from "@/components/wow/ClassSidebar";

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  dps: { label: "DPS", color: "#ff4444", bg: "rgba(255,68,68,0.15)" },
  healer: { label: "Healer", color: "#00cc66", bg: "rgba(0,204,102,0.15)" },
  tank: { label: "Tank", color: "#4488ff", bg: "rgba(68,136,255,0.15)" },
};

const ROLE_ICONS: Record<string, any> = {
  dps: Swords, healer: HeartHandshake, tank: Shield,
};

const CLASS_ORDER = [
  "death-knight", "demon-hunter", "druid", "evoker", "hunter",
  "mage", "monk", "paladin", "priest", "rogue",
  "shaman", "warlock", "warrior",
];

const CLASS_BANNERS: Record<string, string> = {
  "death-knight": "/wow/banners/death-knight.webp",
  "demon-hunter": "/wow/banners/demon-hunter.webp",
  druid: "/wow/banners/druid.webp",
  evoker: "/wow/banners/evoker.webp",
  hunter: "/wow/banners/hunter.webp",
  mage: "/wow/banners/mage.webp",
  monk: "/wow/banners/monk.webp",
  paladin: "/wow/banners/paladin.webp",
  priest: "/wow/banners/priest.webp",
  rogue: "/wow/banners/rogue.webp",
  shaman: "/wow/banners/shaman.webp",
  warlock: "/wow/banners/warlock.webp",
  warrior: "/wow/banners/warrior.webp",
};

export default function TierListClient() {
  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <ClassSidebar />
      <div className="relative z-10 lg:ml-[424px] max-w-5xl mx-auto px-4 pt-16 sm:pt-24 pb-16">

        {/* ─── Hero Banner Full-width ─── */}
        <div className="relative w-full aspect-[3/1] rounded-[2rem] overflow-hidden mb-12 bg-black/40">
          <Image
            src="/wow/banners/silvermoon.webp"
            alt="Midnight Season 1"
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,5,10,0.1) 0%, rgba(5,5,10,0.85) 100%)" }} />
          <div className="absolute inset-0 flex flex-col justify-center items-center p-6 sm:p-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/[0.06] mb-4">
              <span className="w-2 h-2 rounded-full bg-[#ff007f] animate-pulse shadow-lg shadow-[#ff007f]/50" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-white/50">Live Season</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white text-center drop-shadow-2xl tracking-tight" style={{ textShadow: "0 4px 40px #000" }}>
              Midnight <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff007f]">Season 1</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/50 max-w-xl text-center mt-3 drop-shadow-lg font-medium tracking-wide" style={{ textShadow: "0 2px 10px #000" }}>
              13 classes · 40 specializations · Mythic+ meta
            </p>
          </div>
        </div>

        {/* ─── Class Grid — 3-col banner cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CLASS_ORDER.map((classId) => {
            const specs = SPECS.filter((s) => s.classId === classId);
            const color = getClassColor(classId);
            const className = CLASS_NAMES[classId];
            if (specs.length === 0) return null;

            return (
              <Link
                key={classId}
                href={`/wow/class/${classId}`}
                className="group relative block w-full aspect-[3/1] rounded-2xl overflow-hidden bg-black/40 border border-white/[0.04] hover:border-white/[0.12] transition-all duration-300"
              >
                <Image
                  src={CLASS_BANNERS[classId]}
                  alt={className}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0" style={{
                  background: "linear-gradient(180deg, rgba(5,5,10,0.3) 0%, rgba(5,5,10,0.9) 100%)",
                }} />

                {/* Class name badge — top-left */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2.5">
                  <Image
                    src={specs[0].icon}
                    alt={className}
                    width={28}
                    height={28}
                    className="rounded-lg shrink-0 ring-2 ring-white/10"
                    style={{ backgroundColor: `${color}30` }}
                  />
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow-xl">{className}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {[...new Set(specs.map((s) => s.role))].map((role) => {
                        const rm = ROLE_META[role];
                        return (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[5px] font-black uppercase tracking-widest"
                            style={{ backgroundColor: rm.bg, color: rm.color }}
                          >
                            {rm.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Spec links — bottom row, sliding up on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    {specs.map((spec) => {
                      const roleMeta = ROLE_META[spec.role];
                      const RoleIcon = ROLE_ICONS[spec.role];
                      return (
                        <span
                          key={spec.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/wow/spec/${spec.id}`;
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                          style={{
                            background: `${color}18`,
                            border: `1px solid ${color}25`,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${color}30`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = `${color}18`; }}
                        >
                          <Image src={spec.icon} alt={spec.name} width={14} height={14} className="rounded shrink-0" />
                          <span className="text-[7px] font-bold text-white/80 truncate max-w-[60px] leading-tight">{spec.name}</span>
                          <RoleIcon className="w-2 h-2 shrink-0" style={{ color: roleMeta.color }} />
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Arrow indicator — right side */}
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md" style={{ background: `${color}25`, border: `1px solid ${color}30` }}>
                    <ChevronRight className="w-4 h-4" style={{ color }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
