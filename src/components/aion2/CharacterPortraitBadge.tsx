"use client";
import { UserRound } from "lucide-react";
import CharacterPortrait from "./CharacterPortrait";
import { classThumbUrl } from "@/lib/classThumb";

/**
 * Portrait disc geometry, transcribed from the official character page
 * (assets.playnccdn.com/static-aion2/characters/css/index.css):
 *
 *   .profile__avatar { position:absolute; top:-40px; left:50%;
 *                      width:80px; height:80px; margin-left:-40px;
 *                      overflow:hidden; background:#000; border-radius:50% }
 *   .profile__class  { position:absolute; top:-10px; left:50%;
 *                      width:55px; height:55px; margin-left:6px;
 *                      display:flex; align-items:end; justify-content:center }
 *
 * `.profile__class` is a *sibling* of `.profile__avatar`, not a child, so the
 * emblem is not clipped by the circle and deliberately overhangs it. Measured
 * against the disc:
 *
 *   emblem size   55 / 80  = 68.75%
 *   emblem left   (40 + 6) / 80 = 57.5%   (6px right of centre)
 *   emblem top    (-10 - -40) / 80 = 37.5%  (bottom-weighted on the disc)
 *
 * The level number sits inside the same box (`padding-bottom:5px`), painted
 * over the emblem, which is why the sizes below carry a type scale too.
 */
const SIZES = {
  sm: { disc: "h-12 w-12", level: "text-[11px]" },
  md: { disc: "h-14 w-14 sm:h-16 sm:w-16", level: "text-[13px] sm:text-[14px]" },
  lg: { disc: "h-16 w-16 sm:h-20 sm:w-20", level: "text-[14px] sm:text-[18px]" },
} as const;

const EMBLEM_BOX = "absolute w-[68.75%] h-[68.75%] left-[57.5%] top-[37.5%]";

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

/** NC-style character badge: the circular in-game portrait with the class emblem
 *  overlaid on its lower right, exactly as the official character page composes
 *  `.profile__avatar` and `.profile__class`.
 *
 *  Two things this deliberately does *not* do, both of which were wrong here
 *  first: it does not stack the emblem underneath the disc, and it does not use
 *  the emblem as a stand-in for the portrait. An empty portrait is a dark disc
 *  with a neutral silhouette, so a missing face is visible as missing instead of
 *  being papered over by a crest that reads as the picture.
 *
 *  The emblem overhangs the circle on purpose, so only the portrait is clipped
 *  to the round frame — hence the extra non-clipping wrapper.
 */
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
      {/* Wrapper must not clip: the official emblem overhangs the circle. */}
      <div className={`relative shrink-0 ${s.disc}`}>
        <div
          className={`absolute inset-0 rounded-full overflow-hidden border-2 border-cyan-400/40 bg-black shadow-[0_0_16px_rgba(0,255,255,0.22)]`}
        >
          {/* Always painted, not only when there is no portrait. The portrait is
              transparent until it loads (see CharacterPortrait), so this is what
              the disc shows during the wait instead of a bare black circle. */}
          <span className="absolute inset-0 flex items-center justify-center select-none pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.14),rgba(2,6,23,0.9)_70%)]">
            <UserRound className="h-1/2 w-1/2 text-cyan-400/25" strokeWidth={1.5} />
          </span>
          {hasPortrait ? (
            <CharacterPortrait
              src={raw}
              className="absolute inset-0 h-full w-full object-cover"
              alt=""
              title={cls ? `Game character · ${cls}` : "Game character"}
            />
          ) : null}
        </div>
        <div className={EMBLEM_BOX}>
          <img
            src={classThumbUrl(cls)}
            alt=""
            title={cls}
            className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          {level !== "" && level !== undefined && level !== null ? (
            <span
              className={`relative flex h-full items-end justify-center pb-[9%] font-black text-white [text-shadow:1px_1px_2px_#000] ${s.level}`}
            >
              {level}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}