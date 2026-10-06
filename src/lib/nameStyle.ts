import type { CSSProperties } from "react";

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

export function toNameStyle(color: string): CSSProperties {
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

export { hexToRgb, rgbToHex, blendHex, isGradient };