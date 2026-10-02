"use client";
import CharacterPortrait from "./CharacterPortrait";
import { classThumbUrl } from "@/lib/classThumb";

/** Portrait disc size / class emblem size per badge size. The emblem always sits
 *  UNDER the portrait and is deliberately smaller — the official layout. */
const SIZES = {
  sm: { disc: "h-12 w-12", thumb: "h-5 w-5", base: "p-1.5" },
  md: { disc: "h-14 w-14 sm:h-16 sm:w-16", thumb: "h-6 w-6 sm:h-7 sm:w-7", base: "p-2" },
  lg: { disc: "h-16 w-16 sm:h-20 sm:w-20", thumb: "h-7 w-7 sm:h-8 sm:w-8", base: "p-2.5" },
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

/** NC-style character badge: circular in-game portrait with the class emblem
 *  centred directly beneath it at a smaller size, the way the official site
 *  stacks them.
 *
 *  The class emblem is also painted as a dimmed base layer inside the disc, so
 *  when there is no verified character (or the portrait 404s) the badge degrades
 *  to a class crest instead of an empty circle.
 *
 *  NON-RENDERED optional props (level/fallback/className) are accepted for
 *  call-site convenience; `fallback` only supplies the initial letter. */
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
  const raw = src ? rawUrlOf(String(src)) : "";
  const hasPortrait = !!raw;
  return (
    <div className={`flex flex-col items-center shrink-0 ${className}`}>
      <div
        className={`relative shrink-0 rounded-full overflow-hidden border-2 border-cyan-400/40 bg-black shadow-[0_0_16px_rgba(0,255,255,0.22)] ${s.disc}`}
      >
        <img
          src={classThumbUrl(cls)}
          alt=""
          title={cls}
          className={`absolute inset-0 h-full w-full object-contain opacity-60 ${s.base}`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {!hasPortrait && fallback ? (
          <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-cyan-400/30 uppercase select-none pointer-events-none">
            {String(fallback || "?").slice(0, 1)}
          </span>
        ) : null}
        {hasPortrait ? (
          <CharacterPortrait
            src={raw}
            proxyOnly
            className="absolute inset-0 h-full w-full object-cover"
            alt=""
            title={cls ? `Game character · ${cls}` : "Game character"}
          />
        ) : null}
      </div>
      <div className={`-mt-1 shrink-0 ${s.thumb}`}>
        <img
          src={classThumbUrl(cls)}
          alt=""
          title={cls}
          className="h-full w-full object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    </div>
  );
}
