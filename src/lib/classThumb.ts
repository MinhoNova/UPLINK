/** Lightweight 32×32 PNG thumbnails — avoid multi-MB SVG decode in lists. */
export function classThumbUrl(name: string): string {
  const n = name.trim();
  if (/death\s*knight/i.test(n)) return "/classes-thumb/DEATH KNIGHT.png";
  if (/demon\s*hunter/i.test(n)) return "/classes-thumb/DEMON HUNTER.png";
  if (/raider\s*io/i.test(n)) return "/classes-thumb/RAIDER IO.png";
  if (/battle\.?net/i.test(n)) return "/classes-thumb/Battle.net.png";
  const roleMap: Record<string, string> = { dps: "DPS", tank: "TANK", healer: "HEALER" };
  const role = roleMap[n.toLowerCase()];
  if (role) return `/classes-thumb/${role}.png`;
  return `/classes-thumb/${n.toUpperCase()}.png`;
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
