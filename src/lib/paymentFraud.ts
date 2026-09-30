import { getKV, setKV, initTables } from "@/lib/db";
import { addUserBan } from "@/lib/banCheck";
import { logAudit } from "@/lib/auditLog";

/**
 * Payment-fraud strikes.
 *
 * Marking a solo mission paid is refused by the lobby validator, and the
 * refusal used to ban the account on the spot — one write, one mis-click, no
 * appeal, no admin able to tell the difference between a scammer and an owner
 * settling an old offer whose last member had already left. A permanent ban
 * from a single rejected write is not a defence, it is an outage waiting for
 * the wrong user to hit it.
 *
 * So the refusal is what enforces the rule, and the ban follows a pattern:
 * every attempt is audited with its offer id, and the account is suspended once
 * it crosses the limit. One stray attempt costs a warning; a determined
 * forger gets suspended within a handful of tries, and an admin can see every
 * attempt in the audit log either way.
 */
export const PAYMENT_FRAUD_STRIKE_LIMIT = 3;

type Strike = { id: string; count: number; lastAt: number; lastLobbyId?: string };

async function loadStrikes(): Promise<Strike[]> {
  await initTables();
  const raw: unknown = await getKV("paymentFraudStrikes");
  return Array.isArray(raw)
    ? (raw.filter((s: any) => s && typeof s.id === "string" && Number(s.count) > 0) as Strike[])
    : [];
}

export type FraudAttemptResult = {
  strikes: number;
  limit: number;
  banned: boolean;
};

/** Record one refused payout, and suspend the account once the limit is passed. */
export async function recordPaymentFraudAttempt(
  user: { id: string; username: string },
  lobbyId: string
): Promise<FraudAttemptResult> {
  const id = String(user.id);
  const strikes = await loadStrikes();
  const prev = strikes.find((s) => s.id === id);
  const count = (prev?.count || 0) + 1;
  const next: Strike = { id, count, lastAt: Date.now(), lastLobbyId: String(lobbyId) };
  await setKV(
    "paymentFraudStrikes",
    [...strikes.filter((s) => s.id !== id), next]
  ).catch(() => {});

  const banned = count >= PAYMENT_FRAUD_STRIKE_LIMIT;
  await logAudit({
    action: "system.paymentFraud",
    userId: id,
    handle: user.username,
    meta: {
      lobbyId: String(lobbyId),
      attempt: count,
      limit: PAYMENT_FRAUD_STRIKE_LIMIT,
      outcome: banned ? "suspended" : "warned",
    },
  }).catch(() => {});

  if (banned) {
    await addUserBan({
      id,
      handle: user.username,
      reason: `payment_fraud: ${count} attempts to mark a mission paid with no other player on the offer`,
    }).catch(() => {});
  }
  return { strikes: count, limit: PAYMENT_FRAUD_STRIKE_LIMIT, banned };
}

/** Clear the strikes of an account (admin unban / appeal upheld). */
export async function clearPaymentFraudStrikes(userId: string): Promise<void> {
  const strikes = await loadStrikes();
  if (!strikes.some((s) => s.id === String(userId))) return;
  await setKV("paymentFraudStrikes", strikes.filter((s) => s.id !== String(userId))).catch(() => {});
}
