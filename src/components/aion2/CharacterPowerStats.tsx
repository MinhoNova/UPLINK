"use client";
import {
  AION2_ITEM_LEVEL_ICON,
  AION2_POWER_ICON,
  formatCombatPower,
  formatItemLevel,
} from "@/lib/aion2Stats";

/**
 * Combat power + item level, composed exactly like the official character page's
 * `.profile__info-level-con` pill:
 *
 *   .profile__info-level-con {
 *     display:flex; width:fit-content; margin:10px auto 0;
 *     justify-content:center; align-items:center; gap:18px;
 *     padding:6px 16px; border-radius:100px; background:#ffffff14 }
 *   .profile__info-power-level > span {
 *     position:relative; padding-left:27px; color:#78f2fb;
 *     text-shadow:1px 1px 1px rgba(0,0,0,.25) }   // icon 21x21
 *   .profile__info-item-level > span {
 *     position:relative; padding-left:18px; color:#fff;
 *     text-shadow:1px 1px 1px rgba(0,0,0,.25) }   // icon 12x17
 *
 * Both numbers use the official formatters from `@/lib/aion2Stats`, so a card
 * here reads "39.98K" exactly as the official page does.
 *
 * Each half is omitted when the value is missing, which is what the official
 * page does too (`combatPower > 0 &&`).
 */
const SIZES = {
  sm: {
    pill: "gap-2 px-2.5 py-1 text-[10px]",
    power: "pl-4",
    powerIcon: "h-2.5 w-auto",
    item: "pl-3.5",
    itemIcon: "h-[11px] w-auto",
  },
  md: {
    pill: "gap-[18px] px-4 py-1.5 text-[13px]",
    power: "pl-[27px]",
    powerIcon: "h-[21px] w-auto",
    item: "pl-[18px]",
    itemIcon: "h-[17px] w-auto",
  },
} as const;

export default function CharacterPowerStats({
  combatPower,
  itemLevel,
  size = "md",
  className = "",
}: {
  combatPower?: number | null;
  itemLevel?: number | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const cp = Number(combatPower) || 0;
  const il = Number(itemLevel) || 0;
  if (cp <= 0 && il <= 0) return null;
  const s = SIZES[size];
  const shadow = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.25)]";
  return (
    <div
      className={`flex w-fit items-center justify-center rounded-full bg-white/[0.08] ${s.pill} ${className}`}
    >
      {cp > 0 ? (
        <span className={`relative font-bold text-[#78f2fb] ${shadow} ${s.power}`}>
          <img
            src={AION2_POWER_ICON}
            alt=""
            aria-hidden
            className={`absolute left-0 top-0 ${s.powerIcon}`}
            loading="lazy"
            decoding="async"
          />
          {formatCombatPower(cp)}
        </span>
      ) : null}
      {il > 0 ? (
        <span className={`relative font-bold text-white ${shadow} ${s.item}`}>
          <img
            src={AION2_ITEM_LEVEL_ICON}
            alt=""
            aria-hidden
            className={`absolute left-0 top-px ${s.itemIcon}`}
            loading="lazy"
            decoding="async"
          />
          {formatItemLevel(il)}
        </span>
      ) : null}
    </div>
  );
}