"use client";
import CharacterPortrait from "./CharacterPortrait";
import { classThumbUrl } from "@/lib/classThumb";

const SIZES = {
  sm: { box: "h-12 w-12", thumb: "h-7 w-7", level: "text-[8px]" },
  md: { box: "h-16 w-16 sm:h-20 sm:w-20", thumb: "h-9 w-9 sm:h-11 sm:w-11", level: "text-[9px] sm:text-[11px]" },
  lg: { box: "h-20 w-20 sm:h-24 sm:w-24", thumb: "h-11 w-11 sm:h-14 sm:w-14", level: "text-[10px] sm:text-[13px]" },
} as const;

/** NC-style character badge: circular in-game portrait with the class image
 *  hanging off the right edge of the portrait and the level written on the
 *  class image itself in white (no disc behind it, like the official site). */
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
    <div className={`relative ${s.box} shrink-0 rounded-full border-2 border-cyan-400/40 bg-black shadow-[0_0_16px_rgba(0,255,255,0.22)] ${className}`}>
      {fallback ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-full text-lg font-black text-cyan-400/30 uppercase">
          {String(fallback || "?").slice(0, 1)}
        </span>
      ) : null}
      <CharacterPortrait
        src={src}
        className="absolute inset-0 w-full h-full rounded-full object-cover"
        alt=""
        title={cls ? `Game character · ${cls}` : "Game character"}
      />
      <div className={`absolute -right-1.5 bottom-0 flex items-end justify-center ${s.thumb}`}>
        <img
          src={classThumbUrl(cls)}
          alt=""
          title={cls}
          className={`h-full w-full object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
          loading="lazy"
        />
        <span
          className={`absolute inset-x-0 bottom-0.5 text-center ${s.level} font-black leading-none text-white tabular-nums [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_3px_rgba(0,0,0,0.5)] select-none pointer-events-none`}
        >
          {level || "—"}
        </span>
      </div>
    </div>
  );
}