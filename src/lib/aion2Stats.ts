/**
 * Combat power and item level, formatted and iconed the way the official Aion 2
 * character page does it.
 *
 * Both the formatters and the icon URLs are transcribed from the official
 * frontend rather than invented:
 *
 *  - `static-aion2/characters/js/index.js` formats combat power with a
 *    four-significant-digit K/M abbreviation and item level with plain
 *    thousands separators. A character with 39,984 power is shown as "39.98K"
 *    on the official page, not "39,984".
 *  - `static-aion2/characters/css/index.css` draws the two icons as ::before
 *    pseudo-elements at 21x21 (power) and 12x17 (item level), swapping the
 *    power icon for a 28x28 `_pc` variant at the PC breakpoint, and paints the
 *    power number in #78f2fb against white for the item level.
 */

export const AION2_STATIC_BASE =
  "https://assets.playnccdn.com/static-aion2/characters";

/** `.profile__info-power-level::before` */
export const AION2_POWER_ICON = `${AION2_STATIC_BASE}/img/info/profile_power_icon.png`;
/** The same rule's PC-breakpoint override. */
export const AION2_POWER_ICON_PC = `${AION2_STATIC_BASE}/img/info/profile_power_icon_pc.png`;

/** `.profile__info-item-level::before` */
export const AION2_ITEM_LEVEL_ICON = `${AION2_STATIC_BASE}/img/info/profile_level_icon.png`;
export const AION2_ITEM_LEVEL_ICON_PC = `${AION2_STATIC_BASE}/img/info/profile_level_icon_pc.png`;

/** Official combat-power format: four significant digits with a K/M suffix.
 *
 *  Ported from the page's `h()`. The subtlety is the `/ C` after the floor:
 *  it renormalises the scaled number so `toFixed(places)` cannot emit garbage
 *  digits, which is why 39,984 renders as "39.98K" and not "39.980K".
 */
export function formatCombatPower(value: unknown): string {
  const p = Number(value);
  if (!Number.isFinite(p) || p === 0) return "-";
  const abs = Math.abs(p);
  let suffix = "K";
  let scaled = p / 1e3;
  if (abs >= 1e6) {
    suffix = "M";
    scaled = p / 1e6;
  }
  const magnitude = Math.abs(scaled);
  const digits = magnitude === 0 ? 1 : Math.floor(Math.log10(magnitude)) + 1;
  const places = Math.max(4 - digits, 0);
  const factor = 10 ** places;
  const epsilon = 1e-12;
  const truncated =
    scaled >= 0
      ? Math.floor(scaled * factor + epsilon) / factor
      : Math.ceil(scaled * factor - epsilon) / factor;
  return `${truncated.toFixed(places)}${suffix}`;
}

/** Official item-level format: thousands separators, no abbreviation.
 *
 *  The page returns the literal string "null" for a missing value; that is an
 *  artefact of it defaulting the stat to 0 upstream, and rendering it here
 *  would put the word "null" on a card, so missing reads as "-".
 */
export function formatItemLevel(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  if (n === 0) return "0";
  const [whole, fraction] = String(n).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}