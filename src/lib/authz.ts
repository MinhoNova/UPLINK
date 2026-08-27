import { getAppSession } from "@/lib/authEnv";
import { isAdminRole, isModeratorOrAbove, getUserRole, type UserRole } from "@/lib/roles";
import { isLegacyAdmin } from "@/lib/roles";

export { isLegacyAdmin as isAdminUserSync };
export { getUserRole, isAdminRole, isModeratorOrAbove };
export type { UserRole };

export type SessionUser = {
  id: string;
  username: string;
  name?: string | null;
  role?: UserRole;
};

export async function requireSession(req?: Request): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: number; error: string }
> {
  const session = await getAppSession(req);
  if (!session?.user) return { ok: false, status: 401, error: "Unauthorized" };

  const id = (session.user as { id?: string }).id || "";
  const username = (session.user as { username?: string }).username || "";
  if (!id || !username) return { ok: false, status: 400, error: "Invalid session" };

  const role = await getUserRole(id, username);
  return { ok: true, user: { id, username, name: session.user.name, role } };
}

export async function requireAdmin(req?: Request): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: number; error: string }
> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin") {
    return { ok: false, status: 403, error: "Admin only" };
  }
  return auth;
}

export async function requireModerator(req?: Request): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: number; error: string }
> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin" && auth.user.role !== "moderator") {
    return { ok: false, status: 403, error: "Moderator only" };
  }
  return auth;
}

/** Server-side admin check for routes not using requireAdmin */
export async function isAdminUser(userId: string, handle: string): Promise<boolean> {
  return isAdminRole(userId, handle);
}
