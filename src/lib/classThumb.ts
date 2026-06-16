/** Pre-rasterized WebP thumbs — sharp Lanczos from SVG; avoids multi-MB SVG decode in modals. */
export const CLASS_THUMB_PX = 96;
export const ROLE_THUMB_PX = 128;

export function classThumbUrl(name: string): string {
  const n = name.trim();
  if (/death\s*knight/i.test(n)) return "/classes-thumb/DEATH KNIGHT.webp";
  if (/demon\s*hunter/i.test(n)) return "/classes-thumb/DEMON HUNTER.webp";
  if (/raider\s*io/i.test(n)) return "/classes-thumb/RAIDER IO.webp";
  if (/battle\.?net/i.test(n)) return "/classes-thumb/Battle.net.webp";
  const roleMap: Record<string, string> = { dps: "DPS", tank: "TANK", healer: "HEALER" };
  const role = roleMap[n.toLowerCase()];
  if (role) return `/classes-thumb/${role}.webp`;
  return `/classes-thumb/${n.toUpperCase()}.webp`;
}

export function roleIconUrl(role: string): string {
  return classThumbUrl(role);
}

type IconSize = "sm" | "lg";

export function roleIconClass(role: string, size: IconSize = "sm"): string {
  const lg = size === "lg";
  return lg
    ? "brightness-[1.06] contrast-[1.08] saturate-[1.12]"
    : "brightness-[1.04] contrast-[1.06] saturate-[1.08]";
}

export function classIconClass(state: "accepted" | "partial" | "blocked" = "accepted"): string {
  switch (state) {
    case "blocked":
      return "brightness-[0.55] contrast-[0.95] saturate-[0.7] opacity-55";
    case "partial":
      return "brightness-[0.92] contrast-[1.04] saturate-[0.92] opacity-90";
    default:
      return "brightness-[1.04] contrast-[1.06] saturate-[1.1]";
  }
}
