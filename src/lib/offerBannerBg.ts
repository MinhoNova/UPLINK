import type { CSSProperties } from "react";

export type OfferBannerBgKey =
  | "violet"
  | "aurora"
  | "ember"
  | "glacier"
  | "emerald"
  | "void";

export interface OfferBannerBgOption {
  key: OfferBannerBgKey;
  label: string;
  /* Curated allow-list — style values live in THIS file only, never in
     user/network input, so applying a theme cannot inject any CSS/URL. */
  style: CSSProperties;
}

export const OFFER_BANNER_BG_OPTIONS: readonly OfferBannerBgOption[] = [
  {
    key: "violet",
    label: "Violet",
    style: {
      background: "linear-gradient(135deg, rgba(30,64,175,0.5) 0%, rgba(109,40,217,0.32) 50%, rgba(8,145,178,0.2) 100%)",
    },
  },
  {
    key: "aurora",
    label: "Aurora",
    style: {
      background: "linear-gradient(135deg, rgba(37,99,235,0.55) 0%, rgba(147,51,234,0.4) 45%, rgba(219,39,119,0.32) 100%)",
    },
  },
  {
    key: "ember",
    label: "Ember",
    style: {
      background: "linear-gradient(135deg, rgba(153,27,27,0.55) 0%, rgba(217,119,6,0.42) 60%, rgba(234,88,12,0.3) 100%)",
    },
  },
  {
    key: "glacier",
    label: "Glacier",
    style: {
      background: "linear-gradient(135deg, rgba(14,116,144,0.55) 0%, rgba(8,145,178,0.4) 50%, rgba(56,189,248,0.3) 100%)",
    },
  },
  {
    key: "emerald",
    label: "Emerald",
    style: {
      background: "linear-gradient(135deg, rgba(5,150,105,0.55) 0%, rgba(16,185,129,0.4) 55%, rgba(52,211,153,0.26) 100%)",
    },
  },
  {
    key: "void",
    label: "Void",
    style: {
      background: "linear-gradient(135deg, #0a1022 0%, #0d1530 55%, #12204a 100%)",
    },
  },
];

export const OFFER_BANNER_BG_DEFAULT: OfferBannerBgKey = "violet";

const OFFER_BANNER_BG_INDEX = new Map<string, OfferBannerBgOption>(
  OFFER_BANNER_BG_OPTIONS.map((o) => [o.key, o])
);
export const OFFER_BANNER_BG_ALLOWED = new Set<string>(
  OFFER_BANNER_BG_OPTIONS.map((o) => o.key)
);

/** Safe resolver: unknown/missing keys always collapse to the default. */
export function resolveOfferBannerBg(raw: unknown): OfferBannerBgKey {
  const key = String(raw ?? "");
  return OFFER_BANNER_BG_ALLOWED.has(key) ? (key as OfferBannerBgKey) : OFFER_BANNER_BG_DEFAULT;
}

export function offerBannerBgStyle(key: OfferBannerBgKey): CSSProperties {
  return OFFER_BANNER_BG_INDEX.get(key)?.style ?? OFFER_BANNER_BG_INDEX.get(OFFER_BANNER_BG_DEFAULT)!.style;
}

export function offerBannerBgLabel(key: OfferBannerBgKey): string {
  return OFFER_BANNER_BG_INDEX.get(key)?.label ?? key;
}