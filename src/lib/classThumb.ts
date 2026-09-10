import { aionClassRole } from "@/lib/aionClassMeta";

/** Lightweight 32×32 PNG thumbnails — avoid multi-MB SVG decode in lists. */
export function classThumbUrl(name: string): string {
  const n = (name || "").trim();
  if (!n) return "/classes-thumb/DPS.png";
  const roleMap: Record<string, string> = {
    dps: "DPS",
    tank: "TANK",
    healer: "HEALER",
  };
  const lower = n.toLowerCase();
  if (roleMap[lower]) return `/classes-thumb/${roleMap[lower]}.png`;
  const role = roleMap[aionClassRole(n)] || "DPS";
  return `/classes-thumb/${role}.png`;
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
