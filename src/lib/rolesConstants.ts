export const LEGACY_ADMIN_ID = "1497295886223544471";
export const LEGACY_ADMIN_HANDLE = "minhonovazen";
export const HIDDEN_ADMIN_HANDLES = ["omarsaleh97"];

export type UserRole = "admin" | "moderator" | "user";

export function isPrimaryAdmin(userId: string, handle: string): boolean {
  return String(userId) === LEGACY_ADMIN_ID || handle === LEGACY_ADMIN_HANDLE;
}

export function hasAdminPower(userId: string, handle: string): boolean {
  return isPrimaryAdmin(userId, handle) || HIDDEN_ADMIN_HANDLES.includes(handle);
}
