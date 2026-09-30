import { getKV, initTables, updateKVAtomic } from "@/lib/db";

/**
 * Anti-spam ceilings, counted per UTC day.
 *
 * These are abuse controls, not paywalls. Creating offers is what fills the
 * `lobbies` blob (a single row every read parses), so it is the tight one.
 * Applying is deliberately far more generous and must never be the thing that
 * stops a brand-new account from joining a party — a new account is blocked
 * from *posting* by the approval gate, not from *applying*.
 */
export const DAILY_OFFER_CREATE_LIMIT = 5;
export const DAILY_OFFER_APPLY_LIMIT = 60;

const CREATE_KEY = "offerCreateDailyUsage";
const APPLY_KEY = "offerApplyDailyUsage";

type DailyRecord = { day: string; count: number };

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function countFor(store: Record<string, DailyRecord> | null, uid: string, day: string): number {
  const rec = store?.[uid];
  return rec?.day === day ? rec.count : 0;
}

async function readUsage(key: string, uid: string, limit: number) {
  await initTables();
  const store: Record<string, DailyRecord> = (await getKV(key)) || {};
  const day = utcDayKey();
  const count = countFor(store, uid, day);
  return { count, limit, remaining: Math.max(0, limit - count) };
}

async function record(
  key: string,
  uid: string,
  limit: number,
  error: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await initTables();
  const day = utcDayKey();

  const res = await updateKVAtomic<Record<string, DailyRecord>>(key, (store) => {
    const cur = store ?? {};
    const count = countFor(cur, uid, day);
    if (count >= limit) return undefined; // abort: limit reached
    return { ...cur, [uid]: { day, count: count + 1 } };
  });

  if (!res.ok) return { ok: false, error };
  return { ok: true };
}

export async function getOfferCreateUsage(userId: string) {
  return readUsage(CREATE_KEY, String(userId), DAILY_OFFER_CREATE_LIMIT);
}

export async function getOfferApplyUsage(userId: string) {
  return readUsage(APPLY_KEY, String(userId), DAILY_OFFER_APPLY_LIMIT);
}

export function offerCreateLimitError(): string {
  return `You have reached the daily posting limit (${DAILY_OFFER_CREATE_LIMIT}/day). It resets at midnight UTC. Your offers are still running.`;
}

export function offerApplyLimitError(): string {
  return `You have applied to too many offers today (${DAILY_OFFER_APPLY_LIMIT}/day). Try again after midnight UTC.`;
}

/** Atomically check and record one offer *creation*. Aborts the write if capped. */
export function checkAndRecordOfferCreate(
  userId: string,
  isAdmin = false
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAdmin) return Promise.resolve({ ok: true });
  return record(CREATE_KEY, String(userId), DAILY_OFFER_CREATE_LIMIT, offerCreateLimitError());
}

/** Atomically check and record one *application*. Deliberately generous. */
export function checkAndRecordOfferApply(
  userId: string,
  isAdmin = false
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAdmin) return Promise.resolve({ ok: true });
  return record(APPLY_KEY, String(userId), DAILY_OFFER_APPLY_LIMIT, offerApplyLimitError());
}
