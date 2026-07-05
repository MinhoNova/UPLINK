"use client";

import Link from "next/link";
import Image from "next/image";
import { SPECS, CLASS_NAMES } from "@/lib/wowData";
import ClassSidebar from "@/components/wow/ClassSidebar";

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
      <div className="relative z-10 lg:ml-[424px] pt-16 sm:pt-24 pb-16">

        {/* ─── Hero Banner ─── */}
        <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[460px] mt-8 bg-black/40">
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
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl tracking-tight text-center" style={{ textShadow: "0 4px 40px #000" }}>
              Midnight <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff007f]">Season 1</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/50 max-w-xl text-center mt-3 drop-shadow-lg font-medium tracking-wide" style={{ textShadow: "0 2px 10px #000" }}>
              13 classes · 40 specializations · Mythic+ meta
            </p>
          </div>
        </div>

        {/* ─── Class Grid — 3-col, banner cards with painted names ─── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLASS_ORDER.map((classId) => {
              const className = CLASS_NAMES[classId];
              const specs = SPECS.filter((s) => s.classId === classId);
              if (specs.length === 0) return null;

              return (
                <Link
                  key={classId}
                  href={`/wow/class/${classId}`}
                  className="group relative block w-full aspect-[5/2] rounded-2xl overflow-hidden bg-black/40 border border-white/[0.04] hover:border-white/[0.12] transition-all duration-300"
                >
                  <Image
                    src={CLASS_BANNERS[classId]}
                    alt={className}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
