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

        {/* ─── Hero Banner — full image, no text ─── */}
        <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[520px] mb-12 bg-black/40">
          <Image
            src="/wow/banners/silvermoon.webp"
            alt="World of Warcraft"
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
        </div>

        {/* ─── Class Grid — 3-col, image-only banners ─── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLASS_ORDER.map((classId) => {
              const className = CLASS_NAMES[classId];
              const specs = SPECS.filter((s) => s.classId === classId);
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
                    className="object-contain transition-all duration-700 group-hover:scale-105"
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
