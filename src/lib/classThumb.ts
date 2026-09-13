import { aionClassRole } from "@/lib/aionClassMeta";

/** Pre-rasterized Aion 2 class portraits, sized for UI use. */
const AION_CLASS_THUMBS: Record<string, string> = {
  Templar: "/classes-thumb/Templar.webp",
  Gladiator: "/classes-thumb/Gladiator.webp",
  Assassin: "/classes-thumb/Assassin.webp",
  Ranger: "/classes-thumb/Ranger.webp",
  Sorcerer: "/classes-thumb/Sorcerer.webp",
  Spiritmaster: "/classes-thumb/Elementalist.webp",
  Elementalist: "/classes-thumb/Elementalist.webp",
  Cleric: "/classes-thumb/Cleric.webp",
  Chanter: "/classes-thumb/Chanter.webp",
};

/** Class thumbnail — real portrait when the name is a known Aion class. */
export function classThumbUrl(name: string): string {
  const n = (name || "").trim();
  if (!n) return AION_CLASS_THUMBS.Templar;
  const exact = AION_CLASS_THUMBS[n];
  if (exact) return exact;
  const titleCase = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
  if (AION_CLASS_THUMBS[titleCase]) return AION_CLASS_THUMBS[titleCase];
  return AION_CLASS_THUMBS.Templar;
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
