"use client";

import { ArrowDown } from "lucide-react";
import { getMemberKeystoneInfo } from "@/lib/dungeonAssets";

type Props = {
  member: any;
  className?: string;
};

/** Compact keystone pill shown under squad / party cards. */
export default function MemberKeyBadge({ member, className = "" }: Props) {
  const info = getMemberKeystoneInfo(member);
  if (!info) return null;

  const { dungeon, keyLvl, dropLvl } = info;
  const short =
    dungeon?.short ||
    (dungeon?.name ? dungeon.name.slice(0, 3).toUpperCase() : null);
  if (!short && !keyLvl) return null;

  const level = keyLvl ? String(keyLvl).replace(/^\+/, "") : "";

  return (
    <div
      className={`flex items-center justify-center gap-1 rounded-lg border border-[#00ffff]/30 bg-[#0a0a16]/95 px-1.5 py-0.5 shadow-[0_0_10px_rgba(0,255,255,0.12)] ${className}`}
      title={
        dungeon?.name
          ? `${dungeon.name}${level ? ` +${level}` : ""}${dropLvl ? ` ↓${dropLvl}` : ""}`
          : level
            ? `+${level}`
            : undefined
      }
    >
      {dungeon?.img ? (
        <img
          src={dungeon.img}
          alt=""
          className="w-4 h-4 rounded object-cover border border-white/15 shrink-0"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      {short ? (
        <span className="text-[8px] font-black uppercase text-[#00ffff] leading-none tracking-wide">
          {short}
        </span>
      ) : null}
      {level ? (
        <span className="text-[8px] font-black text-yellow-300 tabular-nums leading-none">
          +{level}
        </span>
      ) : null}
      {dropLvl ? (
        <span className="inline-flex items-center text-[8px] font-black text-[#00eaff] tabular-nums leading-none">
          <ArrowDown className="w-2.5 h-2.5 stroke-[3] shrink-0" />
          {dropLvl}
        </span>
      ) : null}
    </div>
  );
}
