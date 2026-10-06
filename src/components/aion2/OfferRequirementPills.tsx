"use client";

import { AION2_ITEM_LEVEL_ICON, AION2_POWER_ICON } from "@/lib/aion2Stats";
import type { RequirementFailure } from "@/lib/offerRequirements";
import { useI18n } from "@/i18n/i18n";

/**
 * The gear an offer demands, shown on its card.
 *
 * Renders nothing at all when the offer sets no requirement, which is every offer
 * that does not use the feature — the pill must not appear as an empty shell, and
 * an owner who clears both fields should see the card go back to how it looked.
 *
 * The icons and colours are the official ones, shared with `CharacterPowerStats`
 * and with the create/edit form, so the number on the card is visibly the same
 * figure the player sees on their own character.
 */
export function OfferRequirementPills({
  minItemLevel,
  minCombatPower,
  className = "",
}: {
  minItemLevel: number;
  minCombatPower: number;
  className?: string;
}) {
  const il = Math.max(0, Number(minItemLevel) || 0);
  const cp = Math.max(0, Number(minCombatPower) || 0);
  if (il <= 0 && cp <= 0) return null;

  const SHADOW = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.25)]";

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {il > 0 ? (
        <span
          className="relative inline-flex items-center gap-1 rounded-full bg-white/[0.08] py-1 pl-[18px] pr-2.5 text-[10px] font-bold text-white"
          title="Minimum Item Level required to apply"
        >
          <img src={AION2_ITEM_LEVEL_ICON} alt="" aria-hidden className={`absolute left-0 top-px h-[11px] w-auto ${SHADOW}`} loading="lazy" decoding="async" />
          {il}+
        </span>
      ) : null}
      {cp > 0 ? (
        <span
          className="relative inline-flex items-center gap-1 rounded-full bg-white/[0.08] py-1 pl-4 pr-2.5 text-[10px] font-bold text-[#78f2fb]"
          title="Minimum Combat Power required to apply"
        >
          <img src={AION2_POWER_ICON} alt="" aria-hidden className={`absolute left-0 top-0 h-2.5 w-auto ${SHADOW}`} loading="lazy" decoding="async" />
          {cp.toLocaleString("en-US")}+
        </span>
      ) : null}
    </div>
  );
}

/**
 * The reason a player cannot apply, as hover text.
 *
 * Purely explanatory. The Apply button is also disabled when this is non-empty, but
 * a disabled button gives no hover feedback on its own and no explanation at all,
 * which reads as a broken page rather than as a rule — so the reason has to ride
 * along on a wrapper that is still hoverable.
 *
 * `role="group"` plus `aria-disabled` rather than putting the text in a native
 * `title`, because a `title` on a disabled button is not exposed reliably and the
 * reason is the whole point of the control.
 */
export function ApplyBlockedHint({
  failures,
  children,
}: {
  failures: RequirementFailure[];
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const reason = describe(failures, t);
  if (!reason) return <>{children}</>;

  return (
    <span className="group relative block">
      <span aria-disabled="true" className="block cursor-not-allowed">
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[240px] -translate-x-1/2 rounded-xl border border-red-500/35 bg-[#0a0510]/95 px-3 py-2 text-left text-[10px] font-bold leading-relaxed text-red-200 opacity-0 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100"
      >
        {reason}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-[#0a0510]" />
      </span>
    </span>
  );
}

function describe(failures: RequirementFailure[], t: (k: string) => string): string {
  if (!failures.length) return "";
  // Two unverified stats are one problem, so collapse them rather than saying the
  // same sentence twice.
  const unverified = failures.some((f) => f.kind === "stats-unverified");
  const parts: string[] = [];
  if (unverified) parts.push(t("req_blockedUnverified") || "Sync your character in My Characters to verify its gear.");
  for (const f of failures) {
    if (f.kind === "item-level") {
      parts.push(
        `${t("req_blockedItemLevel") || "Item Level"} ${f.required}+ ${t("req_blockedRequired") || "required"} — ${t("req_blockedYours") || "yours"} ${f.actual ?? 0}`
      );
    }
    if (f.kind === "combat-power") {
      parts.push(
        `${t("req_blockedCombatPower") || "Combat Power"} ${f.required}+ ${t("req_blockedRequired") || "required"} — ${t("req_blockedYours") || "yours"} ${(f.actual ?? 0).toLocaleString("en-US")}`
      );
    }
  }
  return parts.join(" · ");
}
