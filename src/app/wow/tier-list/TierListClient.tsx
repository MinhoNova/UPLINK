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

        {/* ─── Hero Banner (Murlok-style) ─── */}
        <div className="relative w-full h-[200px] sm:h-[280px] rounded-[2rem] overflow-hidden mb-10 bg-black/40">
          <Image
            src="/wow/banners/silvermoon.webp"
            alt="World of Warcraft Meta Classes"
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,5,10,0.2) 0%, rgba(5,5,10,0.8) 100%)" }} />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-2xl" style={{ textShadow: "0 4px 30px #000" }}>
              Meta Classes
            </h1>
            <p className="text-xs sm:text-base text-white/80 max-w-2xl mt-1 drop-shadow-lg" style={{ textShadow: "0 2px 10px #000" }}>
              Browse all 13 classes and 40 specializations — BIS gear, enchants, gems, stat priorities, and talent builds for Mythic+.
            </p>
          </div>
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
                {/* Class Banner — landscape, full image visible */}
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
                </Link>

                {/* Content: icon + name + specs */}
                <div className="p-3 sm:p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Image
                      src={specs[0].icon}
                      alt={className}
                      width={32}
                      height={32}
                      className="rounded-lg shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    />
                    <div>
                      <Link href={`/wow/class/${classId}`}>
                        <h2 className="text-sm font-black text-white leading-tight hover:text-[#00ffff] transition-colors">{className}</h2>
                      </Link>
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
                  </div>

                  {/* Specs */}
                  <div className="flex flex-col gap-1">
                    {specs.map((spec) => {
                      const roleMeta = ROLE_META[spec.role];
                      const RoleIcon = ROLE_ICONS[spec.role];
                      return (
                        <Link
                          key={spec.id}
                          href={`/wow/spec/${spec.id}`}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200 border border-transparent hover:border-white/10"
                          style={{ background: `${color}06` }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${color}12`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = `${color}06`; }}
                        >
                          <Image
                            src={spec.icon}
                            alt={spec.name}
                            width={24}
                            height={24}
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
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
