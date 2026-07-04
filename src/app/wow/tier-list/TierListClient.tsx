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

        {/* ─── Class Grid 3-col ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CLASS_ORDER.map((classId) => {
            const specs = SPECS.filter((s) => s.classId === classId);
            const color = getClassColor(classId);
            const className = CLASS_NAMES[classId];
            if (specs.length === 0) return null;

            return (
              <section
                key={classId}
                className="rounded-xl overflow-hidden border border-white/[0.04] bg-[#0a0a14]/80 backdrop-blur-sm"
              >
                {/* Class Banner */}
                <Link
                  href={`/wow/class/${classId}`}
                  className="group relative block w-full h-[90px] sm:h-[110px] overflow-hidden bg-black/40"
                >
                  <Image
                    src={CLASS_BANNERS[classId]}
                    alt={className}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-transparent to-transparent" />
                  <div className="absolute bottom-2 sm:bottom-3 left-3 sm:left-4">
                    <h2 className="text-sm sm:text-base font-black text-white drop-shadow-2xl" style={{ textShadow: `0 2px 15px ${color}80, 0 0 10px #000` }}>
                      {className}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {[...new Set(specs.map((s) => s.role))].map((role) => {
                        const rm = ROLE_META[role];
                        return (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest"
                            style={{ backgroundColor: rm.bg, color: rm.color }}
                          >
                            {rm.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </Link>

                {/* Specs Column */}
                <div className="grid grid-cols-1 gap-1 p-2">
                  {specs.map((spec) => {
                    const roleMeta = ROLE_META[spec.role];
                    const RoleIcon = ROLE_ICONS[spec.role];
                    return (
                      <Link
                        key={spec.id}
                        href={`/wow/spec/${spec.id}`}
                        className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200 border border-transparent hover:border-white/10"
                        style={{ background: `${color}06` }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${color}12`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = `${color}06`; }}
                      >
                        <Image
                          src={spec.icon}
                          alt={spec.name}
                          width={28}
                          height={28}
                          className="rounded-md shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-white group-hover:text-[#00ffff] transition-colors truncate leading-tight">
                            {spec.name}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <RoleIcon className="w-2 h-2" style={{ color: roleMeta.color }} />
                            <span className="text-[6px] font-black uppercase tracking-widest" style={{ color: roleMeta.color }}>{roleMeta.label}</span>
                          </div>
                        </div>
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
