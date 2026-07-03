"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Swords } from "lucide-react";
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

  return (
    <aside className="fixed left-0 top-16 lg:top-24 h-[calc(100vh-64px)] lg:h-[calc(100vh-96px)] w-[220px] z-30 hidden lg:flex flex-col bg-[#07070f]/95 backdrop-blur-xl border-r border-white/[0.04]">
      {/* Logo */}
      <div className="shrink-0 px-4 py-5 border-b border-white/[0.04]">
        <Link href="/wow/tier-list" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ffff] to-[#ff007f] flex items-center justify-center shadow-lg shadow-[#ff007f]/20">
            <span className="text-sm font-black text-white">W</span>
          </div>
          <span className="text-xs font-black text-white/80 tracking-widest uppercase">Classes</span>
        </Link>
      </div>

      {/* All classes */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {CLASS_ORDER.map((classId) => {
          const color = getClassColor(classId);
          const isOnClassPage = pathname === `/wow/class/${classId}`;
          const isOnSpecOfClass = pathname.startsWith(`/wow/spec/`) && CLASS_ORDER.some(c => pathname.includes(c));

          return (
            <Link
              key={classId}
              href={`/wow/class/${classId}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isOnClassPage
                  ? "bg-white/[0.06] border border-white/[0.06]"
                  : "hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Image
                src={CLASS_THUMB[classId]}
                alt={CLASS_NAMES[classId]}
                width={36}
                height={36}
                className="rounded-lg shrink-0"
              />
              <span
                className="text-xs font-bold leading-tight truncate flex-1"
                style={{ color: isOnClassPage ? color : "rgba(255,255,255,0.6)" }}
              >
                {CLASS_NAMES[classId]}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Meta button */}
      <div className="shrink-0 px-3 pb-4 pt-3 border-t border-white/[0.04]">
        <Link
          href="/wow/tier-list"
          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all w-full ${
            pathname === "/wow/tier-list" || pathname.startsWith("/wow/spec/") || pathname.startsWith("/wow/player/")
              ? "bg-gradient-to-r from-[#ff007f]/10 to-[#00ffff]/10 border border-[#ff007f]/20"
              : "hover:bg-white/[0.03] border border-transparent"
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ff007f] to-[#00ffff] flex items-center justify-center">
            <Swords className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-white/80 tracking-widest uppercase leading-tight">Meta</div>
            <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Tier List</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
