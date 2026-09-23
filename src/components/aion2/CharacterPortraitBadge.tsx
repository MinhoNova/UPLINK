"use client";
import { useState } from "react";
import CharacterPortrait from "./CharacterPortrait";
import { classThumbUrl } from "@/lib/classThumb";
import { portraitProxyPath } from "@/lib/aion2ClassIds";

const SIZES = {
  sm: { box: "h-12 w-12", thumb: "h-5 w-5 sm:h-6 sm:w-6" },
  md: { box: "h-14 w-14 sm:h-16 sm:w-16", thumb: "h-6 w-6 sm:h-7 sm:w-7" },
  lg: { box: "h-16 w-16 sm:h-20 sm:w-20", thumb: "h-7 w-7 sm:h-8 sm:w-8" },
} as const;

function rawUrlOf(src: string): string {
  if (src.startsWith("/api/aion2/portrait?u=")) {
    try {
      const u = new URL(window.location.origin + src).searchParams.get("u") || "";
      return u ? decodeURIComponent(u) : src;
    } catch {
      return src;
    }
  }
  return src;
}

/** NC-style character badge: circular in-game portrait with the class image
 *  riding the right edge ON the portrait (smaller, no disc behind it, exactly
 *  like the official site — with the level written straight on the class
 *  image). NON-RENDERED optional props (fallback/level/className) are accepted
 *  for call-site convenience but intentionally unused. */
export default function CharacterPortraitBadge({
  src,
  aionClass = "dps",
  size = "md",
  level = "",
  fallback = "",
  className = "",
}: {
  src?: string | null;
  aionClass?: string;
  size?: "sm" | "md" | "lg";
  level?: string | number;
  fallback?: string;
  className?: string;
}) {
  const s = SIZES[size];
  const cls = aionClass || "dps";
  const [mode, setMode] = useState<"direct" | "proxy" | "hidden">("direct");
  const raw = src ? rawUrlOf(String(src)) : "";
  const show = !!raw && mode !== "hidden";
  return (
    <div className={`relative shrink-0 ${s.box} rounded-full overflow-hidden border-2 border-cyan-400/40 bg-black shadow-[0_0_16px_rgba(0,255,255,0.22)] ${className}`}>
      {fallback ? (
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-cyan-400/30 uppercase select-none pointer-events-none">
          {String(fallback || "?").slice(0, 1)}
        </span>
      ) : null}
      {show ? (
        <>
            <CharacterPortrait
              src={raw}
              className="absolute inset-0 w-full h-full object-cover"
              alt=""
              title={cls ? `Game character · ${cls}` : "Game character"}
            />
            <div className={`absolute -right-2 bottom-0 ${s.thumb}`}>
            <img
              src={classThumbUrl(cls)}
              alt=""
              title={cls}
              className="h-full w-full object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              loading="lazy"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
