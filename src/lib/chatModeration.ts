import { getKV, setKV, initTables } from "@/lib/db";
import { logAudit } from "@/lib/auditLog";
import { isAdminUser } from "@/lib/secureDataWrite";
import { touchUserLastIp } from "@/lib/userLastIp";

/** Max DMs in a short burst before cooldown. */
export const DM_BURST_LIMIT = 5;
/** Rolling window for burst counting. */
export const DM_BURST_WINDOW_MS = 60_000;
/** Cooldown after burst abuse. */
export const DM_COOLDOWN_MS = 2 * 60_000;
/** Strikes before auto-suspend. */
export const DM_STRIKES_BEFORE_SUSPEND = 3;
/** Strike counter resets after this idle period. */
export const DM_STRIKE_DECAY_MS = 24 * 60 * 60_000;

type ChatModRecord = {
  burstCount: number;
  burstWindowStart: number;
  cooldownUntil: number;
  strikes: number;
  lastStrikeAt: number;
};

export type DmModerationResult =
  | { ok: true }
  | { ok: false; status: 429; error: string; retryAfterMs: number }
  | { ok: false; status: 403; error: string; suspended: true };

async function loadRecord(userId: string): Promise<ChatModRecord> {
  await initTables();
  const store: Record<string, ChatModRecord> = (await getKV("chatModeration")) || {};
  return (
    store[userId] || {
      burstCount: 0,
      burstWindowStart: 0,
      cooldownUntil: 0,
      strikes: 0,
      lastStrikeAt: 0,
    }
  );
}

async function saveRecord(userId: string, record: ChatModRecord): Promise<void> {
  await initTables();
  const store: Record<string, ChatModRecord> = (await getKV("chatModeration")) || {};
  store[userId] = record;
  await setKV("chatModeration", store);
}

async function suspendForChatSpam(
  userId: string,
  handle: string,
  strikes: number,
  clientIp?: string
): Promise<void> {
  if (isAdminUser(userId, handle)) return;

  await initTables();
  const banned: string[] = (await getKV("bannedUsers")) || [];
  if (!banned.includes(handle)) {
    await setKV("bannedUsers", [...banned, handle]);
  }

  await logAudit({
    action: "chat.spam.suspend",
    userId,
    handle,
    meta: {
      reason: "Repeated DM spam",
      strikes,
      auto: true,
      ...(clientIp && clientIp !== "unknown" ? { ip: clientIp } : {}),
    },
  });
  if (clientIp && clientIp !== "unknown") {
    touchUserLastIp(userId, clientIp).catch(() => {});
  }
}

/**
 * Call before accepting a new DM. Enforces burst limits, cooldowns, and auto-suspend.
 */
export async function enforceDmAntiSpam(
  userId: string,
  handle: string,
  clientIp?: string
): Promise<DmModerationResult> {
  if (isAdminUser(userId, handle)) return { ok: true };

  const now = Date.now();
  let record = await loadRecord(userId);

  if (record.lastStrikeAt && now - record.lastStrikeAt > DM_STRIKE_DECAY_MS) {
    record = { ...record, strikes: 0 };
  }

  if (record.cooldownUntil > now) {
    return {
      ok: false,
      status: 429,
      error: "Chat cooldown active — you sent messages too quickly. Please wait.",
      retryAfterMs: record.cooldownUntil - now,
    };
  }

  if (!record.burstWindowStart || now - record.burstWindowStart >= DM_BURST_WINDOW_MS) {
    record.burstCount = 1;
    record.burstWindowStart = now;
  } else {
    record.burstCount += 1;
  }

  if (record.burstCount > DM_BURST_LIMIT) {
    record.cooldownUntil = now + DM_COOLDOWN_MS;
    record.strikes += 1;
    record.lastStrikeAt = now;
    record.burstCount = 0;
    record.burstWindowStart = 0;

    await logAudit({
      action: "chat.spam.cooldown",
      userId,
      handle,
      meta: {
        strikes: record.strikes,
        cooldownMs: DM_COOLDOWN_MS,
        ...(clientIp && clientIp !== "unknown" ? { ip: clientIp } : {}),
      },
    });
    if (clientIp && clientIp !== "unknown") {
      touchUserLastIp(userId, clientIp).catch(() => {});
    }

    if (record.strikes >= DM_STRIKES_BEFORE_SUSPEND) {
      await suspendForChatSpam(userId, handle, record.strikes, clientIp);
      await saveRecord(userId, { ...record, strikes: 0, cooldownUntil: 0 });
      return {
        ok: false,
        status: 403,
        error: "Account suspended for repeated chat spam.",
        suspended: true,
      };
    }

    await saveRecord(userId, record);
    return {
      ok: false,
      status: 429,
      error: `Too many messages. Wait ${Math.ceil(DM_COOLDOWN_MS / 60_000)} minutes before sending again. (Warning ${record.strikes}/${DM_STRIKES_BEFORE_SUSPEND})`,
      retryAfterMs: DM_COOLDOWN_MS,
    };
  }

  await saveRecord(userId, record);
  return { ok: true };
}
