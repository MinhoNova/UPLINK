"use client";
import CharacterPortrait from "./CharacterPortrait";
import { classThumbUrl } from "@/lib/classThumb";

const SIZES = {
  sm: { box: "h-12 w-12", emblem: "h-7 w-7", thumb: "h-3.5 w-3.5", level: "text-[6px]" },
  md: { box: "h-16 w-16 sm:h-20 sm:w-20", emblem: "h-9 w-9", thumb: "h-5 w-5 sm:h-5.5 sm:w-5.5", level: "text-[7px] sm:text-[8px]" },
  lg: { box: "h-20 w-20 sm:h-24 sm:w-24", emblem: "h-10 w-10", thumb: "h-6 w-6", level: "text-[8px]" },
} as const;

/** NC-style character badge: circular in-game portrait with the class emblem
 *  riding on the bottom-right corner (smaller) and the level written on it. */
export default function CharacterPortraitBadge({
  src,
  aionClass = "",
  level = "",
  size = "md",
  fallback = "",
  className = "",
}: {
  src?: string | null;
  aionClass?: string;
  level?: string | number;
  size?: "sm" | "md" | "lg";
  fallback?: string;
  className?: string;
}) {
  const s = SIZES[size];
  const cls = aionClass || "dps";
  return (
    <div className={`relative ${s.box} shrink-0 rounded-full overflow-hidden border-2 border-cyan-400/40 bg-black shadow-[0_0_16px_rgba(0,255,255,0.22)] ${className}`}>
      {fallback ? (
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-cyan-400/30 uppercase">
          {String(fallback || "?").slice(0, 1)}
        </span>
      ) : null}
      <CharacterPortrait
        src={src}
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
        title={cls ? `Game character · ${cls}` : "Game character"}
      />
      <div
        className={`absolute bottom-1 right-1 flex flex-col items-center justify-center gap-px rounded-full border-[1.5px] border-white/35 bg-black/95 p-1 shadow-[0_2px_8px_rgba(0,0,0,0.65)] ${s.emblem}`}
      >
        <img src={classThumbUrl(cls)} alt="" title={cls} className={`${s.thumb} object-contain`} loading="lazy" />
        <span className={`${s.level} font-black leading-none text-cyan-300 tabular-nums`}>{level || "—"}</span>
      </div>
    </div>
  );
}