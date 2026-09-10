import { getKV, setKV, initTables } from "@/lib/db";
import {
  isAdminUser,
  ADMIN_HANDLES,
  sanitizeBannedIdRecords,
  type BanIdRecord,
} from "@/lib/secureDataWrite";

export type { BanIdRecord };

/** Usernames that can never be suspended (site owner / admin). */
export function isBanExempt(handle: string, userId?: string): boolean {
  return isAdminUser(userId || "", handle);
}

async function loadRecords(): Promise<BanIdRecord[]> {
  await initTables();
  const raw: unknown = await getKV("bannedUserIds");
  return sanitizeBannedIdRecords(Array.isArray(raw) ? raw : []);
}

/** All userId ban records (admin-only surface). */
export async function getAllBans(): Promise<BanIdRecord[]> {
  return loadRecords();
}

/** Ban record matching this user (by userId or handle) or null. */
export async function getBanInfo(handle: string, userId?: string): Promise<BanIdRecord | null> {
  if (isBanExempt(handle, userId)) return null;
  const recs = await loadRecords();
  const hit = recs.find(
    (b) => (userId && String(b.id) === String(userId)) || (handle && String(b.handle) === String(handle))
  );
  return hit || null;
}

export async function isUserBanned(handle: string, userId?: string): Promise<boolean> {
  if (isBanExempt(handle, userId)) return false;
  await initTables();
  const bannedHandles: string[] = (await getKV("bannedUsers")) || [];
  if (Array.isArray(bannedHandles) && bannedHandles.includes(handle)) return true;
  const hit = await loadRecords();
  return hit.some((b) => String(b.id) === String(userId));
}

export async function bannedResponse(reason?: string) {
  return Response.json(
    {
      error:
        reason || "Your account is suspended. Contact support if you believe this is a mistake.",
      suspended: true,
    },
    { status: 403 }
  );
}

/** Ban by stable user id; also records the handle in the legacy handle-list. */
export async function addUserBan(input: { id: string; handle?: string; reason?: string }) {
  if (isBanExempt(input.handle || "", input.id)) {
    return { ok: false as const, error: "Admins cannot be banned" };
  }
  await initTables();
  const recs = await loadRecords();
  if (!recs.some((b) => String(b.id) === String(input.id))) {
    const record: BanIdRecord = {
      id: String(input.id),
      handle: input.handle ? input.handle.trim().slice(0, 40) : undefined,
      reason: input.reason ? input.reason.trim().slice(0, 200) : undefined,
      at: Date.now(),
    };
    await setKV("bannedUserIds", sanitizeBannedIdRecords([...recs, record]));
  }
  const handles: string[] = (await getKV("bannedUsers")) || [];
  if (input.handle && Array.isArray(handles) && !handles.includes(input.handle)) {
    await setKV("bannedUsers", handles.concat(input.handle).filter((h) => !ADMIN_HANDLES.includes(h)));
  }
  return { ok: true as const };
}

/** Remove a ban by user id and/or handle from both lists. */
export async function removeUserBan(input: { id?: string; handle?: string }) {
  await initTables();
  const recs = await loadRecords();
  let removedHandle = input.handle;
  const next = recs.filter((b) => {
    const match =
      (input.id && String(b.id) === String(input.id)) ||
      (input.handle && String(b.handle) === String(input.handle));
    if (match) removedHandle = b.handle || removedHandle;
    return !match;
  });
  await setKV("bannedUserIds", next);
  if (removedHandle) {
    const handles: string[] = (await getKV("bannedUsers")) || [];
    await setKV("bannedUsers", Array.isArray(handles) ? handles.filter((h) => h !== removedHandle) : []);
  }
}