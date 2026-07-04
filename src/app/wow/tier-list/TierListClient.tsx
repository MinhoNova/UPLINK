"use client";

import Link from "next/link";
import Image from "next/image";
import { SPECS, getClassColor, CLASS_NAMES } from "@/lib/wowData";
import { Swords, HeartHandshake, Shield } from "lucide-react";
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
      <div className="relative z-10 lg:ml-[220px] max-w-5xl mx-auto px-4 pt-16 sm:pt-24 pb-16">

        {/* ─── Hero Banner ─── */}
        <div className="relative w-full h-[220px] sm:h-[340px] rounded-[2rem] overflow-hidden mb-12">
          <Image
            src="/wow/banners/silvermoon.webp"
            alt="World of Warcraft Meta Classes"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/20 to-transparent" />
          <div className="absolute bottom-5 sm:bottom-8 left-5 sm:left-8 right-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] text-white/70 mb-3">
              Midnight Season 1
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-2xl" style={{ textShadow: "0 4px 30px #000" }}>
              Meta Classes
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl mt-2 drop-shadow-lg" style={{ textShadow: "0 2px 10px #000" }}>
              Browse all 13 classes and 40 specializations. BIS gear, enchants, gems, stat priorities, and talent builds for Mythic+.
            </p>
          </div>
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#00ffff]/5 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-[#ff007f]/5 to-transparent blur-3xl pointer-events-none" />
        </div>

        {/* ─── Class Grid ─── */}
        <div className="grid gap-6 sm:gap-8">
          {CLASS_ORDER.map((classId) => {
            const specs = SPECS.filter((s) => s.classId === classId);
            const color = getClassColor(classId);
            const className = CLASS_NAMES[classId];
            if (specs.length === 0) return null;

            return (
              <section
                key={classId}
                className="rounded-[1.5rem] overflow-hidden border border-white/[0.04] bg-[#0a0a14]/80 backdrop-blur-sm"
              >
                {/* Class Banner */}
                <Link
                  href={`/wow/class/${classId}`}
                  className="group relative block w-full h-[120px] sm:h-[160px] overflow-hidden"
                >
                  <Image
                    src={CLASS_BANNERS[classId]}
                    alt={className}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 800px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/10 to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-5">
                    <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-2xl" style={{ textShadow: `0 2px 15px ${color}60` }}>
                      {className}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {[...new Set(specs.map((s) => s.role))].map((role) => {
                        const rm = ROLE_META[role];
                        return (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest"
                            style={{ backgroundColor: rm.bg, color: rm.color }}
                          >
                            {rm.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {/* Arrow indicator */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <span className="text-white text-xs font-black">→</span>
                  </div>
                </Link>

                {/* Specs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 sm:p-4">
                  {specs.map((spec) => {
                    const roleMeta = ROLE_META[spec.role];
                    const RoleIcon = ROLE_ICONS[spec.role];
                    return (
                      <Link
                        key={spec.id}
                        href={`/wow/spec/${spec.id}`}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 border border-transparent hover:border-white/10"
                        style={{ background: `${color}06`, hover: { background: `${color}10` } }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${color}12`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = `${color}06`; }}
                      >
                        <Image
                          src={spec.icon}
                          alt={spec.name}
                          width={36}
                          height={36}
                          className="rounded-lg shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold text-white group-hover:text-[#00ffff] transition-colors truncate leading-tight">
                            {spec.name}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <RoleIcon className="w-2.5 h-2.5" style={{ color: roleMeta.color }} />
                            <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: roleMeta.color }}>{roleMeta.label}</span>
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-600 group-hover:text-gray-400 transition-colors shrink-0">→</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
