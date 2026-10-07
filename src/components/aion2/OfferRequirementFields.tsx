"use client";

import { AION2_ITEM_LEVEL_ICON, AION2_POWER_ICON } from "@/lib/aion2Stats";
import { STAT_MAX } from "@/lib/characterStatsLimits";
import { useI18n } from "@/i18n/i18n";

/**
 * The two optional minimum-gear fields on an offer.
 *
 * Both are "any character" when left at 0, which is what every offer that does not
 * use this feature stores, so nothing needs migrating and nothing changes for
 * them.
 *
 * The icons are the official Aion 2 ones, already used by `CharacterPowerStats` for
 * these exact two numbers on the character page and in My Characters — same asset,
 * same colours, so an owner recognises the requirement as the same figure they saw
 * on their own character rather than as a new invented label.
 *
 * One component for create and edit on purpose: these fields decide who may apply,
 * and two copies of a gate would eventually disagree about their bounds.
 */

const SHADOW = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.25)]";

export default function OfferRequirementFields({
  minItemLevel,
  minCombatPower,
  onChange,
  disabled,
}: {
  minItemLevel: number;
  minCombatPower: number;
  onChange: (next: { minItemLevel: number; minCombatPower: number }) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  const set = (key: "minItemLevel" | "minCombatPower", raw: string) => {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    onChange({ minItemLevel, minCombatPower, [key]: n });
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
        {t("offer_reqTitle") || "Gear Required to Apply"}
      </p>
      <p className="mb-3 text-[10px] leading-relaxed text-gray-500">
        {t("offer_reqHint") ||
          "Optional. A character below these numbers cannot apply, and sees why on the Apply button."}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RequirementInput
          icon={AION2_ITEM_LEVEL_ICON}
          iconClass="h-[13px] w-auto"
          label={t("offer_reqItemLevel") || "Item Level"}
          value={minItemLevel}
          max={STAT_MAX.itemLevel}
          disabled={disabled}
          onChange={(v) => set("minItemLevel", v)}
          anyLabel={t("offer_reqAny") || "Any"}
        />
        <RequirementInput
          icon={AION2_POWER_ICON}
          iconClass="h-3 w-auto"
          label={t("offer_reqCombatPower") || "Combat Power"}
          value={minCombatPower}
          max={100000}
          disabled={disabled}
          onChange={(v) => set("minCombatPower", v)}
          anyLabel={t("offer_reqAny") || "Any"}
        />
      </div>
    </div>
  );
}

function RequirementInput({
  icon,
  iconClass,
  label,
  value,
  max,
  onChange,
  disabled,
  anyLabel,
}: {
  icon: string;
  iconClass: string;
  label: string;
  value: number;
  max: number;
  onChange: (v: string) => void;
  disabled?: boolean;
  anyLabel: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
        <span className={`relative pl-5 ${SHADOW}`}>
          {/* The official glyph is what makes this read as the same number the
              player already sees on their own character. */}
          <img
            src={icon}
            alt=""
            aria-hidden
            className={`absolute left-0 top-0 ${iconClass}`}
            loading="lazy"
            decoding="async"
          />
          <span className="font-bold text-white">{label}</span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          step={1}
          value={value === 0 ? "" : value}
          placeholder={anyLabel}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 text-sm font-black tabular-nums text-white outline-none transition-all placeholder:text-gray-600 focus:border-cyan-400/60 focus:shadow-[0_0_16px_rgba(0,229,255,0.12)] disabled:opacity-50"
        />
        {value > 0 ? (
          <button
            type="button"
            onClick={() => onChange("0")}
            disabled={disabled}
            className="h-9 shrink-0 rounded-lg border border-white/[0.12] bg-white/[0.06] px-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400 transition-all hover:border-white/25 hover:text-white disabled:opacity-50 cursor-pointer"
          >
            {anyLabel}
          </button>
        ) : null}
      </span>
    </label>
  );
}
