import { getKV, setKV, initTables } from "@/lib/db";
import { isSecretClubTier } from "@/lib/userProfile";

/** Max offer actions per UTC day for non–Secret Club users (create + apply). */
export const FREE_DAILY_OFFER_LIMIT = 3;

type DailyRecord = { day: string; count: number };

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOfferLimitExempt(user: unknown): boolean {
  return isSecretClubTier(user);
}

export async function getOfferDailyUsage(
  userId: string,
  user?: unknown
): Promise<{
  count: number;
  limit: number;
  remaining: number;
  exempt: boolean;
}> {
  await initTables();
  const store: Record<string, DailyRecord> = (await getKV("offerDailyUsage")) || {};
  const day = utcDayKey();
  const rec = store[String(userId)];
  const count = rec?.day === day ? rec.count : 0;
  const exempt = !!user && isOfferLimitExempt(user);
  return {
    count,
    limit: FREE_DAILY_OFFER_LIMIT,
    remaining: exempt ? Infinity : Math.max(0, FREE_DAILY_OFFER_LIMIT - count),
    exempt,
  };
}

export function offerDailyLimitError(): string {
  return `Daily limit reached (${FREE_DAILY_OFFER_LIMIT}/day). Secret Club members have unlimited offers.`;
}

/** Atomically check limit and record one offer action (create or apply). */
export async function checkAndRecordOfferAction(
  userId: string,
  user: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isOfferLimitExempt(user)) return { ok: true };

  await initTables();
  const store: Record<string, DailyRecord> = (await getKV("offerDailyUsage")) || {};
  const uid = String(userId);
  const day = utcDayKey();
  const rec = store[uid];
  const count = rec?.day === day ? rec.count : 0;

  if (count >= FREE_DAILY_OFFER_LIMIT) {
    return { ok: false, error: offerDailyLimitError() };
  }

  store[uid] = { day, count: count + 1 };
  await setKV("offerDailyUsage", store);
  return { ok: true };
}
