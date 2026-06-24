export const LEGACY_ADMIN_ID = "1497295886223544471";
export const LEGACY_ADMIN_HANDLE = "minhonovazen";

export type UserRole = "admin" | "moderator" | "user";

export function isPrimaryAdmin(userId: string, handle: string): boolean {
  return String(userId) === LEGACY_ADMIN_ID || handle === LEGACY_ADMIN_HANDLE || handle === "omarsaleh97";
}

export function hasAdminPower(userId: string, handle: string): boolean {
  return isPrimaryAdmin(userId, handle);
}
