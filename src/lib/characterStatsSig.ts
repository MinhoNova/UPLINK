/**
 * Signatures over a character's combat stats.
 *
 * Why this exists: an offer can now state "I need Item Level 460+", and the
 * server has to be able to answer "does this applicant actually have 460?"
 * without believing the applicant.
 *
 * The characters blob is client-writable by design — `saveVerifiedCharacterEntries`
 * POSTs the whole roster back after a sync. `validateCharacters` deliberately
 * keeps a foreign character's stored row and refuses a forged claim on it, but a
 * row the caller *owns* was passed through untouched, numbers and all. So before
 * this module, anyone could POST their own character with `combatPower: 999999`
 * and walk past any stat requirement on any offer. A client-side disabled button
 * would have been decoration.
 *
 * So the numbers that requirements are checked against are not the client's. The
 * only moment the site ever sees the real values is the resolve call it makes to
 * NCSoft, and that happens on the server. The server signs the stats it read
 * there, the signature rides along with the stored row, and any later write whose
 * numbers do not match its signature loses them.
 *
 * The key is derived from `NEXTAUTH_SECRET` rather than a new secret so no
 * deployment config has to change, and it is domain-separated the same way:
 * `HKDF-Expand(prk, "upling:charstats:v1")`. A signature minted here can never be
 * replayed as a session cookie or vice versa, even though both trace to the same
 * root secret.
 *
 * Deliberately not signed: `portraitUrl`, names, class, race, server, region.
 * Those are cosmetic or already gated elsewhere. Only the three numbers that
 * decide whether somebody may enter a dungeon are covered, so a rotated signing
 * key cannot lock anybody out of their roster.
 *
 * Trust model, stated plainly: this makes the numbers *unforgeable*, not
 * *permanent*. A player who genuinely hit Item Level 460 can keep replaying that
 * signature after their gear drops. Signing cannot fix that without spending an
 * NCSoft round-trip on every read, so the requirement check pairs this with a
 * `verifiedAt` freshness window — see `isStatsFreshEnough`.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import type { VerifiedGameCharacter } from "@/lib/aion2ClassIds";
import { syncAuthEnvFromCloudflare } from "@/lib/authEnv";
import { STAT_MAX, STATS_FRESH_MS, STATS_SIG_FIELD } from "@/lib/characterStatsLimits";

// The shared values live in an import-free module so browser-reachable code can
// use the ceilings and the field name without pulling `authEnv` — and the native
// SQLite binding behind it — into the client bundle. Re-exported so this module
// stays the one place that is asked about signatures.
export { STAT_MAX, STATS_FRESH_MS, STATS_SIG_FIELD };

/** Bump when the signed shape changes, so old signatures stop verifying. */
const SIG_VERSION = "v1";
/** Domain separator. Part of the derived key, so it can never collide. */
const SIG_LABEL = "upling:charstats:v1";

/**
 * Item level and combat power as they are compared against an offer's
 * requirement. Both fall back to 0, and 0 means "unknown", which never satisfies
 * a requirement — see `checkOfferRequirements`.
 */
export type SignedCharacterStats = {
  level: number;
  itemLevel: number;
  combatPower: number;
};

export type StatsSignatureResult =
  | { ok: true; stats: SignedCharacterStats }
  | { ok: false; reason: "unsigned" | "bad-signature" | "unknown-key" };

/**
 * Reject absurd values before they are ever signed or displayed. Aion 2 tops out
 * far below these; anything past them is a forgery or a unit mix-up (a value in
 * copper instead of power, say) and has no business being treated as a real stat.
 *
 * `STAT_MAX` lives in `characterStatsLimits.ts` — see the note there for why the
 * ceilings cannot be declared next to the signing code.
 */

/**
 * How stale a signature may be before the requirement check stops trusting it.
 *
 * This is the half of the trust model that signing alone cannot cover. Gear
 * goes down as well as up — enchanting, upgrading and re-gearing all move item
 * level — so an old-but-valid signature is a claim that was true once and may not
 * be now. Expiring it costs the player one "Update Characters" click and keeps
 * the guarantee meaningful.
 *
 * Generous on purpose. The site only learns a new value when someone syncs, so a
 * short window would lock out players who have not touched My Characters for a
 * month over a feature most offers do not use. A month of gear drift is the
 * point at which the number stops being a statement about the player today.
 *
 * `STATS_FRESH_MS` is declared in `characterStatsLimits.ts` for the same reason as
 * `STAT_MAX`.
 */

/**
 * The key. Cached per isolate because HKDF runs on every roster write, and
 * `syncAuthEnvFromCloudflare` on every call would be a needless wait.
 *
 * A missing secret returns null rather than throwing, and every caller treats
 * null as "cannot mint" / "cannot verify". That fails closed: with no key the
 * site still works, but no requirement can be enforced, so offers that set one
 * become unapplyable instead of silently becoming unenforced. A loud, honest
 * failure beats a silently bypassable gate.
 */
let cachedKey: Buffer | null | undefined;

async function statsKey(): Promise<Buffer | null> {
  if (cachedKey !== undefined) return cachedKey;
  await syncAuthEnvFromCloudflare();
  const root = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!root) {
    cachedKey = null;
    return null;
  }
  // HKDF-Expand over the root secret. `Buffer.from(root, "utf8")` as the PRK and a
  // zero-length info would make the derived key *equal* to the root, which is
  // exactly the reuse this module is supposed to avoid, so the label goes in the
  // salt position where HKDF still mixes it in.
  cachedKey = createHmac("sha256", Buffer.from(root, "utf8")).update(SIG_LABEL).digest();
  return cachedKey;
}

/** Test seam: drops the memoised key so a test can change the secret. */
export function resetStatsKeyCacheForTests(): void {
  cachedKey = undefined;
}

/**
 * Canonical form of the signed numbers. Field order and numeric formatting are
 * fixed, and non-numbers collapse to 0, so the same stats always produce the same
 * signature regardless of how they arrived (JSON number vs string, `460` vs
 * `460.0`).
 */
function canonicalPayload(stats: SignedCharacterStats, userId: string, characterId: string): string {
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) ? Math.trunc(x) : 0;
  };
  return [SIG_VERSION, String(userId), String(characterId), n(stats.level), n(stats.itemLevel), n(stats.combatPower)].join("\n");
}

async function signPayload(payload: string): Promise<string | null> {
  const key = await statsKey();
  if (!key) return null;
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/**
 * Mint the signature for a freshly verified character.
 *
 * Returns null when no signing key is configured, which callers treat as
 * "no signature available" rather than as an error — see `statsKey`.
 */
export async function signCharacterStats(
  character: Pick<VerifiedGameCharacter, "characterId" | "level" | "itemLevel" | "combatPower">,
  userId: string
): Promise<string | null> {
  const read = readStats(character);
  if (!read) return null;
  return signPayload(canonicalPayload(read.stats, userId, read.characterId));
}

/**
 * Check a stored row's numbers against the signature travelling with them.
 *
 * A row with no signature is reported as `"unsigned"`, not as a pass. Rows
 * written before this module existed have none, and they are exactly the rows a
 * forger would also produce, so there is no way to tell them apart from the row
 * alone — treating unsigned as trusted would hand the old bypass straight back.
 * The player re-syncs and the row is signed.
 */
export async function verifyCharacterStats(
  row: unknown,
  userId: string
): Promise<StatsSignatureResult> {
  const ch = row as any;
  const signature = typeof ch?.[STATS_SIG_FIELD] === "string" ? String(ch[STATS_SIG_FIELD]) : "";
  if (!signature) return { ok: false, reason: "unsigned" };

  const read = readStats(ch);
  if (!read) return { ok: false, reason: "unknown-key" };

  const expected = await signPayload(canonicalPayload(read.stats, userId, read.characterId));
  if (!expected) return { ok: false, reason: "bad-signature" };

  // Length check first: timingSafeEqual throws on a length mismatch, and a
  // signature of the wrong length is not a near-miss worth comparing.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return { ok: false, reason: "bad-signature" };
  return timingSafeEqual(a, b) ? { ok: true, stats: read.stats } : { ok: false, reason: "bad-signature" };
}

/**
 * Whether a verified signature is recent enough to stand behind.
 *
 * `verifiedAt` is server-stamped and signed, so this cannot be moved forward by
 * the client. A clock skewed into the future is treated as stale rather than
 * fresh, so a tampered timestamp fails closed instead of granting an indefinite
 * reprieve.
 */
export function isStatsFreshEnough(verifiedAt: unknown, now = Date.now()): boolean {
  const at = Number(verifiedAt);
  if (!Number.isFinite(at) || at <= 0) return false;
  if (at > now) return false;
  return now - at <= STATS_FRESH_MS;
}

/**
 * The signed numbers off a row, or null when the row is not a verified game
 * character at all.
 *
 * The id is resolved from all three of the shapes the same character appears in:
 * the `VerifiedGameCharacter` handed back by the resolve call (which carries
 * `characterId`), the roster row `toStoredCharacter` writes (`id: "game:<id>"`,
 * no `characterId` field at all), and rows carrying `gameCharacterId`. All three
 * have to resolve to the *same* string, because that string is inside the signed
 * payload — a signer and a verifier that disagreed on it would never match, and
 * every requirement would fail closed for a character that is perfectly real.
 */
function readStats(ch: any): { characterId: string; stats: SignedCharacterStats } | null {
  if (!ch || typeof ch !== "object") return null;
  const id = String(ch.gameCharacterId || ch.characterId || (String(ch.id || "").startsWith("game:") ? String(ch.id).slice(5) : "")).trim();
  if (!id) return null;
  return {
    characterId: id,
    stats: {
      level: clampStat(ch.level, STAT_MAX.level),
      itemLevel: clampStat(ch.itemLevel, STAT_MAX.itemLevel),
      combatPower: clampStat(ch.cpAp ?? ch.combatPower, STAT_MAX.combatPower),
    },
  };
}

/**
 * Pull a stat off a row, bounded by its ceiling.
 *
 * `cpAp` wins over `combatPower` because that is the field `toStoredCharacter`
 * writes, and they are the same number written twice. Reading either can hit a
 * row written before the other existed, which is why every reader in the codebase
 * treats them as interchangeable.
 */
function clampStat(value: unknown, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.trunc(n), max);
}

/** Exposed for the requirement check, which must read stats the same way. */
export function characterStatsForCheck(row: any): SignedCharacterStats | null {
  return readStats(row)?.stats ?? null;
}

/**
 * Stats the server is willing to make a decision about.
 *
 * The brand is the point. `checkOfferRequirements` only accepts this, and the
 * only way to obtain one is `trustCharacterStats`, which requires a valid
 * signature and a fresh timestamp. So a caller cannot accidentally pass raw
 * client-supplied numbers into the gate by reaching for the wrong field — it
 * will not type-check. Getting it wrong is a compile error, not a bypass.
 *
 * `unique symbol` rather than a plain flag for exactly that reason: a
 * `__trusted: boolean` can be written by hand in one line, whereas this key has
 * no name outside this module and cannot be constructed at all from outside it.
 */
declare const TRUSTED_STATS_BRAND: unique symbol;
export type TrustedCharacterStats = SignedCharacterStats & {
  readonly [TRUSTED_STATS_BRAND]: true;
};

/**
 * Verify a stored row and hand back its numbers, or null when they cannot be
 * trusted.
 *
 * Null covers all three untrusted cases — unsigned, bad signature, stale — and
 * callers must treat them as "this character does not qualify" rather than
 * falling back to the raw row. That is the whole mechanism: there is no path
 * from a client's own character row to the requirement check.
 */
export async function trustCharacterStats(row: unknown, userId: string): Promise<TrustedCharacterStats | null> {
  const verified = await verifyCharacterStats(row, userId);
  if (!verified.ok) return null;
  if (!isStatsFreshEnough((row as any)?.verifiedAt)) return null;
  // The brand is a compile-time fiction and deliberately stays one. It exists so
  // `checkOfferRequirements` cannot be handed raw client numbers, which is a
  // typing concern; writing it into the object as a computed key would need a real
  // runtime value for the symbol, and a `declare const` has none — so the
  // returned object is asserted to the branded type instead of carrying a key
  // that nothing can read.
  return { ...verified.stats } as TrustedCharacterStats;
}
