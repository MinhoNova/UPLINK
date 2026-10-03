"use client";
import { UserRound } from "lucide-react";
import CharacterPortrait from "./CharacterPortrait";
import { classThumbUrl } from "@/lib/classThumb";

/** Portrait disc size / class emblem size per badge size. The emblem always sits
 *  UNDER the portrait and is deliberately smaller — the official layout. */
const SIZES = {
  sm: { disc: "h-12 w-12", thumb: "h-5 w-5" },
  md: { disc: "h-14 w-14 sm:h-16 sm:w-16", thumb: "h-6 w-6 sm:h-7 sm:w-7" },
  lg: { disc: "h-16 w-16 sm:h-20 sm:w-20", thumb: "h-7 w-7 sm:h-8 sm:w-8" },
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
 *  The disc is for the character's face and nothing else. An earlier version
 *  painted the class crest as a dimmed layer *inside* the disc as a "tidy
 *  fallback"; in practice, with no portrait loaded, the crest filled the portrait
 *  frame and read as the picture itself — the board looked populated while the
 *  character had no face at all. The disc now shows a neutral silhouette, so a
 *  missing portrait is visibly missing and the class emblem stays where it
 *  belongs: underneath.
 *
 *  `level` and `fallback` are accepted for call-site convenience but unused. */
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
        {hasPortrait ? (
          <CharacterPortrait
            src={raw}
            className="absolute inset-0 h-full w-full object-cover"
            alt=""
            title={cls ? `Game character · ${cls}` : "Game character"}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center select-none pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.14),rgba(2,6,23,0.9)_70%)]">
            <UserRound className="h-1/2 w-1/2 text-cyan-400/25" strokeWidth={1.5} />
          </span>
        )}
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
