"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SPECS, getClassColor, CLASS_NAMES, getSpecsByClass } from "@/lib/wowData";

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
  const currentSpecId = pathname?.match(/\/wow\/spec\/([^/]+)/)?.[1] || "";
  const currentSpec = SPECS.find((s) => s.id === currentSpecId);
  const [expandedClass, setExpandedClass] = useState<string | null>(
    currentSpec?.classId || null
  );

  return (
    <aside className="fixed left-0 top-16 lg:top-24 h-[calc(100vh-64px)] lg:h-[calc(100vh-96px)] w-[200px] z-30 hidden lg:flex flex-col bg-[#07070f]/95 backdrop-blur-xl border-r border-white/[0.04]">
      {/* Header */}
      <div className="shrink-0 px-3 py-4 border-b border-white/[0.04]">
        <Link href="/wow/tier-list" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00ffff] to-[#ff007f] flex items-center justify-center">
            <span className="text-[8px] font-black text-white">W</span>
          </div>
          <span className="text-[10px] font-black text-white/80 tracking-wide">SPECS</span>
        </Link>
      </div>

      {/* Class list */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">
        {CLASS_ORDER.map((classId) => {
          const color = getClassColor(classId);
          const specs = getSpecsByClass(classId);
          const isExpanded = expandedClass === classId;
          const hasActive = currentSpec?.classId === classId;

          return (
            <div key={classId}>
              <button
                onClick={() => setExpandedClass(isExpanded ? null : classId)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-left ${
                  hasActive
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <Image
                  src={CLASS_THUMB[classId]}
                  alt={CLASS_NAMES[classId]}
                  width={28}
                  height={28}
                  className="rounded-md shrink-0"
                />
                <span
                  className="text-[10px] font-bold leading-tight truncate flex-1"
                  style={{ color: hasActive ? color : "rgba(255,255,255,0.6)" }}
                >
                  {CLASS_NAMES[classId]}
                </span>
                <span
                  className="text-[6px] font-black opacity-40 transition-transform"
                  style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", color }}
                >
                  ▸
                </span>
              </button>

              {/* Specs dropdown */}
              {isExpanded && (
                <div className="ml-1 pl-5 border-l border-white/[0.04] space-y-0.5 mt-0.5 mb-1">
                  {specs.map((spec) => {
                    const isActive = spec.id === currentSpecId;
                    return (
                      <Link
                        key={spec.id}
                        href={`/wow/spec/${spec.id}`}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${
                          isActive
                            ? "bg-white/[0.08]"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <Image
                          src={spec.icon}
                          alt={spec.name}
                          width={20}
                          height={20}
                          className="rounded shrink-0"
                        />
                        <span
                          className={`text-[9px] font-bold truncate leading-tight ${
                            isActive ? "text-white" : "text-gray-500"
                          }`}
                        >
                          {spec.name}
                        </span>
                      </Link>
                    );
                  })}
                  <Link
                    href={`/wow/class/${classId}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
                  >
                    All {CLASS_NAMES[classId]} Specs →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
