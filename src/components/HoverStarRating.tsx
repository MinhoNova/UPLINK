"use client";

import { useCallback, useRef, useState } from "react";
import { Star } from "lucide-react";

const STAR_COUNT = 5;

function starFill(value: number, index: number): number {
  const pos = value - index;
  if (pos >= 1) return 1;
  if (pos <= 0) return 0;
  return pos;
}

export default function HoverStarRating({
  onSubmit,
  size = 44,
}: {
  onSubmit: (score: number) => void;
  size?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const valueFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const raw = (x / rect.width) * STAR_COUNT;
    const snapped = Math.ceil(raw * 2) / 2;
    return Math.max(0.5, Math.min(STAR_COUNT, snapped));
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = valueFromClientX(e.clientX);
    if (v != null) setHoverValue(v);
  };

  const handleLeave = () => setHoverValue(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = valueFromClientX(e.clientX);
    if (v != null) onSubmit(v);
  };

  const display = hoverValue ?? 0;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0.5}
        aria-valuemax={5}
        aria-valuenow={hoverValue ?? undefined}
        className="flex items-center gap-1 cursor-pointer px-2 py-3 rounded-2xl hover:bg-yellow-500/5 transition-colors"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={handleClick}
      >
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const fill = starFill(display, i);
          return (
            <div
              key={i}
              className="relative shrink-0"
              style={{ width: size, height: size }}
            >
              <Star
                className="absolute inset-0 text-white/15"
                style={{ width: size, height: size }}
                strokeWidth={1.5}
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.65)]"
                  style={{ width: size, height: size }}
                  strokeWidth={1.5}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 min-h-[14px]">
        {hoverValue != null ? (
          <span className="text-yellow-400">{hoverValue.toFixed(1)} / 5 — click to confirm</span>
        ) : (
          "Hover stars to rate"
        )}
      </p>
    </div>
  );
}
