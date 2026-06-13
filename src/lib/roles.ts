import { getKV, setKV, initTables } from "@/lib/db";

export const LEGACY_ADMIN_ID = "1497295886223544471";
export const LEGACY_ADMIN_HANDLE = "minhonovazen";

export type UserRole = "admin" | "moderator" | "user";

export function isLegacyAdmin(userId: string, handle: string): boolean {
  return String(userId) === LEGACY_ADMIN_ID || handle === LEGACY_ADMIN_HANDLE;
}

export async function ensureRolesSeeded(): Promise<Record<string, UserRole>> {
  await initTables();
  let roles: Record<string, UserRole> = (await getKV("userRoles")) || {};
  if (!roles[LEGACY_ADMIN_ID]) {
    roles = { ...roles, [LEGACY_ADMIN_ID]: "admin" };
    await setKV("userRoles", roles);
  }
  return roles;
}

export async function getUserRole(userId: string, handle: string): Promise<UserRole> {
  if (isLegacyAdmin(userId, handle)) return "admin";
  const roles = await ensureRolesSeeded();
  return roles[String(userId)] || "user";
}

export async function isAdminRole(userId: string, handle: string): Promise<boolean> {
  return (await getUserRole(userId, handle)) === "admin";
}

export async function isModeratorOrAbove(userId: string, handle: string): Promise<boolean> {
  const role = await getUserRole(userId, handle);
  return role === "admin" || role === "moderator";
}

export async function setUserRole(actorId: string, actorHandle: string, targetUserId: string, role: UserRole): Promise<void> {
  if (!(await isAdminRole(actorId, actorHandle))) {
    throw new Error("Admin only");
  }
  if (targetUserId === LEGACY_ADMIN_ID && role !== "admin") {
    throw new Error("Cannot demote primary admin");
  }
  const roles = await ensureRolesSeeded();
  roles[String(targetUserId)] = role;
  await setKV("userRoles", roles);
}

/** Sync fallback for client UI — server always uses async getUserRole */
export function isAdminUserSync(userId: string, handle: string): boolean {
  return isLegacyAdmin(userId, handle);
}
