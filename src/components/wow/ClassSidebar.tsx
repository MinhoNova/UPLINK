"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import { getClassColor, CLASS_NAMES } from "@/lib/wowData";

const CLASS_ORDER = [
  "death-knight", "demon-hunter", "druid", "evoker", "hunter",
  "mage", "monk", "paladin", "priest", "rogue",
  "shaman", "warlock", "warrior",
];

const CLASS_THUMB: Record<string, string> = {};
for (const [id, name] of Object.entries(CLASS_NAMES)) {
  CLASS_THUMB[id] = `/classes-thumb/${name.toUpperCase()}.webp`;
}

export default function ClassSidebar() {
  const pathname = usePathname();
  const currentClassId = pathname?.match(/\/wow\/class\/([^/]+)/)?.[1] || "";
  const currentSpecId = pathname?.match(/\/wow\/spec\/([^/]+)/)?.[1] || "";

  return (
    <aside className="fixed left-0 top-16 lg:top-24 h-[calc(100vh-64px)] lg:h-[calc(100vh-96px)] w-[200px] z-30 hidden lg:flex flex-col bg-[#07070f]/95 backdrop-blur-xl border-r border-white/[0.04]">
      {/* Logo */}
      <div className="shrink-0 px-4 py-5 border-b border-white/[0.04]">
        <Link href="/wow/tier-list" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00ffff] to-[#ff007f] flex items-center justify-center shadow-lg shadow-[#ff007f]/15">
            <span className="text-xs font-black text-white">W</span>
          </div>
          <div>
            <div className="text-[10px] font-black text-white/70 tracking-[0.15em] uppercase leading-tight">Classes</div>
            <div className="text-[6px] font-bold text-gray-600 uppercase tracking-wider">All 13 specs</div>
          </div>
        </Link>
      </div>

      {/* Classes */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin">
        {CLASS_ORDER.map((classId) => {
          const color = getClassColor(classId);
          const active = currentClassId === classId || currentSpecId.startsWith(classId);

          return (
            <Link
              key={classId}
              href={`/wow/class/${classId}`}
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{
                background: active ? `linear-gradient(90deg, ${color}08 0%, transparent 100%)` : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 rounded-full transition-all duration-200" style={{
                background: active ? color : "transparent",
                boxShadow: active ? `0 0 8px ${color}` : "none",
                height: active ? "20px" : "0",
              }} />
              <Image
                src={CLASS_THUMB[classId]}
                alt={CLASS_NAMES[classId]}
                width={32}
                height={32}
                className="rounded-lg shrink-0"
              />
              <span
                className="text-[11px] font-bold leading-tight truncate flex-1 transition-colors"
                style={{ color: active ? color : "rgba(255,255,255,0.45)" }}
              >
                {CLASS_NAMES[classId]}
              </span>
              {active && (
                <span className="text-[8px]" style={{ color }}>◆</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Meta */}
      <div className="shrink-0 px-3 pb-4 pt-3 border-t border-white/[0.04]">
        <Link
          href="/wow/tier-list"
          className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden"
          style={{
            background: pathname === "/wow/tier-list" || pathname.startsWith("/wow/spec/") || pathname.startsWith("/wow/player/")
              ? "linear-gradient(90deg, rgba(255,0,127,0.08) 0%, rgba(0,255,255,0.05) 100%)"
              : "transparent",
            border: pathname === "/wow/tier-list" || pathname.startsWith("/wow/spec/") || pathname.startsWith("/wow/player/")
              ? "1px solid rgba(255,0,127,0.15)"
              : "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (pathname !== "/wow/tier-list") {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== "/wow/tier-list") {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff007f] to-[#00ffff] flex items-center justify-center shadow-sm">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-white/60 tracking-[0.1em] uppercase leading-tight">Meta</div>
            <div className="text-[7px] font-bold text-gray-500 uppercase tracking-wider">Tier List</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
