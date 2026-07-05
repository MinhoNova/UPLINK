"use client";

import Link from "next/link";
import Image from "next/image";
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
  return (
    <aside className="fixed left-56 top-16 lg:top-24 h-[calc(100vh-64px)] lg:h-[calc(100vh-96px)] w-[200px] z-30 hidden lg:flex flex-col">
      {/* Classes */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin">
        {CLASS_ORDER.map((classId) => {
          const color = getClassColor(classId);

          return (
            <Link
              key={classId}
              href={`/wow/class/${classId}`}
              className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200"
            >
              <Image
                src={CLASS_THUMB[classId]}
                alt={CLASS_NAMES[classId]}
                width={44}
                height={44}
                className="rounded-xl shrink-0"
              />
              <span
                className="text-[13px] font-extrabold leading-tight truncate flex-1 transition-colors"
                style={{ color }}
              >
                {CLASS_NAMES[classId]}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
