export const LEGACY_ADMIN_ID = "1497295886223544471";
export const LEGACY_ADMIN_HANDLE = "minhonovazen";

export const OMARSALEH_ADMIN_ID = "711027724663128106";
export const OMARSALEH_ADMIN_HANDLE = "omarsaleh97";

export const ADMIN_IDS = [LEGACY_ADMIN_ID, OMARSALEH_ADMIN_ID];
export const ADMIN_HANDLES = [LEGACY_ADMIN_HANDLE, OMARSALEH_ADMIN_HANDLE];

export type UserRole = "admin" | "moderator" | "support" | "user";

/**
 * Client-side UI gating only — it decides which admin affordances to render,
 * never whether an action is allowed.
 *
 * The handle is deliberately NOT part of this decision. A Discord username is
 * renameable by the account holder, so a handle match is an impersonation
 * button: signing up as `omarsaleh97` used to make the client render the
 * admin UI, and the general chat's edit/delete override (`chat/general`) called
 * exactly this function server-side — so any account could rename itself and
 * edit or delete anybody's messages, and be seen as the site owner doing it.
 * The server-side authority is `isAdminUser` in `roles.ts`, which matches the
 * Discord id only.
 */
export function isPrimaryAdmin(userId: string, _handle?: string): boolean {
  return ADMIN_IDS.includes(String(userId));
}