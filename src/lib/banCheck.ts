import { getKV, initTables } from "@/lib/db";
import { isAdminUser, ADMIN_HANDLE } from "@/lib/secureDataWrite";

/** Usernames that can never be suspended (site owner / admin). */
export function isBanExempt(handle: string, userId?: string): boolean {
  return isAdminUser(userId || "", handle);
}

export async function isUserBanned(handle: string, userId?: string): Promise<boolean> {
  if (isBanExempt(handle, userId)) return false;
  await initTables();
  const banned: string[] = (await getKV("bannedUsers")) || [];
  return banned.includes(handle);
}

export async function bannedResponse() {
  return Response.json(
    { error: "Your account is suspended. Contact support if you believe this is a mistake." },
    { status: 403 }
  );
}
