"use client";

import { useMemo } from "react";

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

function blendHex(a: string, b: string, t: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  return rgbToHex(
    ra[0] + (rb[0] - ra[0]) * t,
    ra[1] + (rb[1] - ra[1]) * t,
    ra[2] + (rb[2] - ra[2]) * t
  );
}

function isGradient(v: string): boolean {
  return v.startsWith("linear-gradient");
}

export function nameGlowColor(color: string | null | undefined): string {
  if (!color || !isGradient(color)) return color || "#00ffff";
  const m = color.match(/#[0-9a-fA-F]{3,6}/g);
  return m?.[0] || "#00ffff";
}

export function toNameStyle(color: string): React.CSSProperties {
  if (!color) return {};
  if (isGradient(color)) {
    return {
      background: color,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    };
  }
  return { color };
}

export const PRESETS: [string, string][] = [
  ["#00ffff", "#3b82f6"],
  ["#f472b6", "#a855f7"],
  ["#34d399", "#22d3ee"],
  ["#facc15", "#f97316"],
  ["#c084fc", "#ec4899"],
  ["#60a5fa", "#818cf8"],
  ["#f43f5e", "#fb923c"],
  ["#2dd4bf", "#a78bfa"],
  ["#ffffff", "#94a3b8"],
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function GradientColorPicker({ value, onChange }: Props) {
  const gradient = useMemo(() => {
    if (isGradient(value)) return value;
    return `linear-gradient(90deg, ${value || "#00ffff"}, ${value || "#3b82f6"})`;
  }, [value]);

  const extractStops = (g: string): [string, string] => {
    const m = g.match(/#[0-9a-fA-F]{3,6}/g);
    return m && m.length >= 2 ? [m[0], m[1]] : ["#00ffff", "#3b82f6"];
  };
  const [stopA, stopB] = extractStops(gradient);

  const blended = blendHex(stopA, stopB, 0.5);

  return (
    <div className="space-y-3">
      <div
        className="w-full h-8 rounded-xl border border-white/15"
        style={{ background: gradient }}
      />

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <input
            type="color"
            value={stopA}
            onChange={(e) =>
              onChange(`linear-gradient(90deg, ${e.target.value}, ${stopB})`)
            }
            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20 bg-transparent p-0"
          />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
            Start
          </span>
        </div>

        <div className="flex-1 flex items-center gap-2 px-2">
          <svg
            className="w-3 h-3 text-slate-500 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M15 3l6 6-6 6" />
          </svg>
          <svg
            className="w-3 h-3 text-slate-500 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 3l6 6-6 6" />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-1">
          <input
            type="color"
            value={stopB}
            onChange={(e) =>
              onChange(`linear-gradient(90deg, ${stopA}, ${e.target.value})`)
            }
            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20 bg-transparent p-0"
          />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
            End
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(([a, b], i) => (
          <button
            key={i}
            onClick={() => onChange(`linear-gradient(90deg, ${a}, ${b})`)}
            className="w-7 h-7 rounded-full border-2 border-white/15 hover:border-white/40 transition-all"
            style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
          />
        ))}
        <button
          onClick={() => onChange("")}
          title="Reset color"
          className="w-7 h-7 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <span className="text-xs font-bold">✕</span>
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={isGradient(value) ? blended : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#00ffff"
          maxLength={7}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-[#00ffff]/50 text-sm font-black text-white placeholder:text-slate-700"
        />
      </div>

      <p className="text-[9px] text-slate-600">
        Pick two colors to create a gradient, or enter a hex code directly.
      </p>
    </div>
  );
}
