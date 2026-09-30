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

/** Hosts we accept as first-party. Derived from config so a tunnel/dev host can't widen it. */
function trustedHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const raw of [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!raw) continue;
    try {
      hosts.add(new URL(raw).host.toLowerCase());
    } catch {
      /* ignore malformed config */
    }
  }
  return hosts;
}

/** Strip a leading "www." so apex and www are treated as the same site. */
function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, "");
}

/**
 * Block cross-site browser requests (CSRF). Non-browser callers send no Origin
 * and no Sec-Fetch-Site, and are allowed through — cookie SameSite is their only
 * cross-site control, and a forged Origin header is not something a browser can
 * omit, which is exactly the case this must reject.
 */
function sameOrigin(req?: Request): boolean {
  if (!req) return true;

  // A browser always sends Sec-Fetch-Site on cross-site requests. If it says
  // cross-site or same-site-but-different-origin, reject before looking at Origin.
  const fetchSite = (req.headers.get("sec-fetch-site") || "").toLowerCase();
  if (fetchSite === "cross-site") return false;
  if (fetchSite === "same-site" || fetchSite === "none") {
    // "none" means a direct navigation/address-bar hit, which is not an XHR;
    // "same-site" is a different subdomain, so it still needs the Origin check below.
    if (fetchSite === "none") return true;
  }

  const origin = req.headers.get("origin");
  // No Origin: not a browser cross-origin request (native app, curl, server-to-server).
  if (!origin) return true;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    // An Origin we cannot parse is never a legitimate same-site value.
    return false;
  }

  const requestHost = req.headers.get("host") || "";
  if (requestHost && normalizeHost(requestHost) === normalizeHost(originHost)) return true;
  if (trustedHosts().has(normalizeHost(originHost))) return true;

  return false;
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
  if (auth.user.role !== "admin" && auth.user.role !== "moderator" && auth.user.role !== "support") {
    return { ok: false, status: 403, error: "Moderator only" };
  }
  return auth;
}

/** Server-side admin check for routes not using requireAdmin */
export async function isAdminUser(userId: string, handle: string): Promise<boolean> {
  return isAdminRole(userId, handle);
}
