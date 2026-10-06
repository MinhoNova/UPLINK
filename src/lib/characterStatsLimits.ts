/**
 * The numbers and field name that a character-stat signature is made of.
 *
 * Deliberately import-free, and that is the whole point of this file existing.
 *
 * `characterStatsSig.ts` needs the Worker secrets synced before it can derive a
 * key, which it does through `authEnv` — and `authEnv` reaches `db` and its native
 * `better-sqlite3`. Every constant in this file is needed by code that runs in the
 * browser: the roster store writes the field name, and the requirement helpers
 * clamp against the same ceilings. If they reached into the signing module for
 * those constants, the client bundle would pull a Node-only module into it and the
 * production build fails on `Can't resolve 'fs'`.
 *
 * So the shared values live here, where nothing can drag a dependency in with
 * them, and the signing module imports them from here. Do not add an import to
 * this file.
 */

/** The row field the signature travels in. */
export const STATS_SIG_FIELD = "statsSig";

/**
 * Reject absurd values before they are ever signed or displayed. Aion 2 tops out
 * far below these; anything past them is a forgery or a unit mix-up (a value in
 * copper instead of power, say) and has no business being treated as a real stat.
 *
 * `combatPower` matches `AION2_CPAP_MAX`, which already caps applicant rows.
 * Two independent bounds would drift, and the lower one would start rejecting
 * real players the moment the other was raised.
 */
export const STAT_MAX = {
  level: 200,
  itemLevel: 1000,
  combatPower: 100_000,
} as const;

/**
 * How stale a signature may be before a requirement check stops trusting it.
 * See `isStatsFreshEnough` in the signing module for why signing alone is not
 * enough.
 */
export const STATS_FRESH_MS = 30 * 24 * 60 * 60 * 1000;
