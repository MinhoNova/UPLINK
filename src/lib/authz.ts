import { getAppSession } from "@/lib/authEnv";
import { isAdminRole, isModeratorOrAbove, getUserRole, type UserRole } from "@/lib/roles";
import { isLegacyAdmin } from "@/lib/roles";
import { isUserBanned } from "@/lib/banCheck";

export { isLegacyAdmin as isAdminUserSync };
export { getUserRole, isAdminRole, isModeratorOrAbove };
export type { UserRole };

export type SessionUser = {
  id: string;
  username: string;
  name?: string | null;
  role?: UserRole;
};

export type SessionResult =
  | { ok: true; user: SessionUser }
  | { ok: false; status: number; error: string; suspended?: boolean; user?: SessionUser };

/** Block browser requests from other origins to prevent CSRF. Non-browser/unknown origins pass. */
function sameOrigin(req?: Request): boolean {
  if (!req) return true;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function authorize(req?: Request): Promise<SessionResult> {
  const session = await getAppSession(req);
  if (!session?.user) return { ok: false, status: 401, error: "Unauthorized" };

  const id = (session.user as { id?: string }).id || "";
  const username = (session.user as { username?: string }).username || "";
  if (!id || !username) return { ok: false, status: 400, error: "Invalid session" };

  if (!sameOrigin(req)) {
    return { ok: false, status: 403, error: "Cross-origin request blocked" };
  }

  if (await isUserBanned(username, id)) {
    return {
      ok: false,
      status: 403,
      suspended: true,
      error: "Your account is suspended. Contact support if you believe this is a mistake.",
      user: { id, username, name: session.user.name, role: await getUserRole(id, username) },
    };
  }

  const role = await getUserRole(id, username);
  return { ok: true, user: { id, username, name: session.user.name, role } };
}

export async function requireSession(req?: Request): Promise<SessionResult> {
  return authorize(req);
}

export async function requireOptionalSession(req?: Request): Promise<SessionResult> {
  return authorize(req);
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
