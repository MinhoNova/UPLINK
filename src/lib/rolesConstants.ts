export const LEGACY_ADMIN_ID = "1497295886223544471";
export const LEGACY_ADMIN_HANDLE = "minhonovazen";

export const OMARSALEH_ADMIN_ID = "711027724663128106";
export const OMARSALEH_ADMIN_HANDLE = "omarsaleh97";

export const ADMIN_IDS = [LEGACY_ADMIN_ID, OMARSALEH_ADMIN_ID];
export const ADMIN_HANDLES = [LEGACY_ADMIN_HANDLE, OMARSALEH_ADMIN_HANDLE];

export type UserRole = "admin" | "moderator" | "user";

export function isPrimaryAdmin(userId: string, handle: string): boolean {
  return ADMIN_IDS.includes(String(userId)) || ADMIN_HANDLES.includes(handle);
}