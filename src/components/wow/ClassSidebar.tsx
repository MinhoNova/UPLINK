"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SPECS, getClassColor, CLASS_NAMES } from "@/lib/wowData";

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
    <aside className="fixed left-56 top-16 lg:top-24 h-[calc(100vh-64px)] lg:h-[calc(100vh-96px)] w-[200px] z-30 hidden lg:flex flex-col">
      {/* Classes */}
      <nav className="px-3 py-3 space-y-0.5">
        {CLASS_ORDER.map((classId) => {
          const color = getClassColor(classId);
          const active = currentClassId === classId || currentSpecId.startsWith(classId);

          return (
            <Link
              key={classId}
              href={`/wow/class/${classId}`}
              className="group relative flex items-center gap-3 px-3 py-1 rounded-xl transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.97]"
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              )}
              <Image
                src={CLASS_THUMB[classId]}
                alt={CLASS_NAMES[classId]}
                width={32}
                height={32}
                className="rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
              />
              <span
                className="text-[10px] font-extrabold leading-tight truncate flex-1 transition-colors"
                style={{ color: active ? color : "rgba(255,255,255,0.6)" }}
              >
                {CLASS_NAMES[classId]}
              </span>

              {/* ── Spec popup on hover ── */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                <div className="bg-[#0c0c18]/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-2.5 min-w-[160px] shadow-2xl">
                  <div className="text-[7px] font-black uppercase tracking-[0.15em] text-white/30 mb-1.5 px-1">{CLASS_NAMES[classId]} Specs</div>
                  <div className="space-y-0.5">
                    {SPECS.filter((s) => s.classId === classId).map((spec) => {
                      const roleColors = { dps: "#ff4444", healer: "#00cc66", tank: "#4488ff" };
                      return (
                        <Link
                          key={spec.id}
                          href={`/wow/spec/${spec.id}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                        >
                          <Image src={spec.icon} alt={spec.name} width={22} height={22} className="rounded-md shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-white/80 leading-tight truncate">{spec.name}</div>
                            <span className="text-[6px] font-black uppercase tracking-widest" style={{ color: roleColors[spec.role] }}>{spec.role === "dps" ? "DPS" : spec.role === "healer" ? "Healer" : "Tank"}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
