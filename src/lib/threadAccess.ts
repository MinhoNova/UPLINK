import { userCanViewOfferThread } from "@/lib/lobbyLifecycle";
import { isPrimaryAdmin } from "@/lib/rolesConstants";

/**
 * The client half of mission-thread access.
 *
 * The server is the real boundary — `loadOfferThread` answers 403 and the page
 * shell simply ships no thread. This gate only decides whether to *draw* a
 * thread the server already released, so it must never be stricter than the
 * server or a legitimately authorised account stares at a red "Access Denied"
 * on a page that already holds its data.
 *
 * That is exactly what it used to be. The client re-derived admin from the
 * session cookie, which knows neither the second seeded admin nor anyone
 * promoted through `userRoles`, so:
 *
 *  - `omarsaleh97` / `711027724663128106` was a server admin and a client
 *    stranger, and
 *  - `(session.user as any).role` was `undefined` on every session, because
 *    nothing ever wrote it, making that clause of the check dead code.
 *
 * `serverAdmin` is the verdict the server already computed and shipped in the
 * payload, so it is the authority. The session checks remain as a fallback for
 * the first paint, before any payload has arrived.
 */
export function clientCanViewOfferThread(
  lobby: any,
  userId: string,
  handle: string | undefined,
  aliases: string[] | undefined,
  opts: { serverAdmin?: boolean; sessionHandle?: string; sessionRole?: string } = {}
): boolean {
  if (!lobby) return false;
  if (opts.serverAdmin) return true;
  if (isPrimaryAdmin(userId, opts.sessionHandle || "")) return true;
  if (opts.sessionRole === "admin") return true;
  return userCanViewOfferThread(lobby, userId, handle, aliases);
}
