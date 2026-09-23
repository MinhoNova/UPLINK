"use client";
import CharacterPortrait from "./CharacterPortrait";
import { classThumbUrl } from "@/lib/classThumb";

const SIZES = {
  sm: { box: "h-10 w-10", thumb: "h-6 w-6" },
  md: { box: "h-12 w-12 sm:h-14 sm:w-14", thumb: "h-7 w-7 sm:h-8 sm:w-8" },
  lg: { box: "h-14 w-14 sm:h-16 sm:w-16", thumb: "h-8 w-8 sm:h-9 sm:w-9" },
} as const;

/** NC-style character badge: circular in-game portrait with the class image
 *  hanging off the right edge of the portrait (no disc, no level number). */
export default function CharacterPortraitBadge({
  src,
  aionClass = "",
  size = "md",
  fallback = "",
  className = "",
}: {
  src?: string | null;
  aionClass?: string;
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
      <div className={`absolute -right-2 bottom-0 flex items-end justify-center ${s.thumb}`}>
        <img
          src={classThumbUrl(cls)}
          alt=""
          title={cls}
          className={`h-full w-full object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
          loading="lazy"
        />
      </div>
    </div>
  );
}