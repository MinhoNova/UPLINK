"use client";

import Link from "next/link";
import Image from "next/image";
import { SPECS, getClassColor, CLASS_NAMES } from "@/lib/wowData";
import { Swords, HeartHandshake, Shield } from "lucide-react";
import ClassSidebar from "@/components/wow/ClassSidebar";

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
      <div className="relative z-10 lg:ml-[424px] pt-16 sm:pt-24 pb-16">

        {/* ─── Hero ─── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-14 mt-6">
          <div className="relative w-full h-[240px] sm:h-[280px] lg:h-[320px] rounded-3xl overflow-hidden bg-black/60">
            <Image
              src="/wow/banners/silvermoon.webp"
              alt="Midnight Season 1"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,5,10,0.7) 0%, rgba(5,5,10,0.3) 50%, rgba(5,5,10,0.7) 100%)" }} />
            <div className="absolute inset-0 flex flex-col justify-center max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/[0.06] w-fit mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40">Live Season</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-tight" style={{ textShadow: "0 4px 40px #000" }}>
                Midnight
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff007f] leading-none mt-1 tracking-tight">
                Season 1
              </h2>
              <p className="text-xs sm:text-sm text-white/40 max-w-xl mt-4 font-medium tracking-wide">
                13 classes · 40 specializations · Mythic+ meta
              </p>
              <Link
                href="/wow/s2"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 w-fit mt-4 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50 group-hover:text-white/80">Season 2 PTR Preview</span>
                <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Class Grid ─── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-14 mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLASS_ORDER.map((classId) => {
              const className = CLASS_NAMES[classId];
              const color = getClassColor(classId);
              const specs = SPECS.filter((s) => s.classId === classId);
              if (specs.length === 0) return null;

              const cardAspect = "aspect-[437/250]";

              return (
                <Link
                  key={classId}
                  href={`/wow/class/${classId}`}
                  className={`group relative block w-full rounded-xl overflow-hidden ${cardAspect}`}
                >
                  <Image
                    src={CLASS_BANNERS[classId]}
                    alt={className}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />

                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5">
                    {specs.map((spec) => (
                      <div
                        key={spec.id}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-white/[0.06] opacity-60 hover:opacity-100 transition-all duration-200 hover:scale-110 hover:border-white/[0.2] cursor-pointer"
                        style={{ backgroundColor: `${color}25` }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/wow/spec/${spec.id}`; }}
                        title={spec.name}
                      >
                        <Image src={spec.icon} alt={spec.name} width={32} height={32} className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
