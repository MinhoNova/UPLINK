import { getKV } from "@/lib/db";
import {
  getOfferThreadFamily,
  userCanViewOfferThread,
  getThreadRootId,
} from "@/lib/lobbyLifecycle";
import { playerAliases } from "@/lib/playerIdentity";

/**
 * Load one offer thread and nothing else.
 *
 * The thread page used to open `/api/data`, which loads and serialises the
 * entire key/value store — every lobby, every player, every character, market
 * history and all. Pasted chat images ride along as base64 inside the message
 * objects, so a single busy offer could make that response many megabytes, and
 * the page could sit on a spinner for a minute before rendering one thread.
 *
 * Both the API route and the server-rendered page shell go through here, so the
 * page can paint the thread with no loading screen at all while the API keeps
 * serving the same payload for client refreshes and polling.
 *
 * `me` is the identity the authorisation used, so the client's own gate lines up
 * with the server's by construction.
 */
export const THREAD_PROFILE_FIELDS = [
  "id",
  "name",
  "username",
  "displayName",
  "avatar",
  "customAvatar",
  "profileGif",
  "activeVfx",
  "vfxSettings",
  "effect",
  "className",
  "level",
] as const;

export type OfferThreadPayload = {
  lobbies: any[];
  rootId: string;
  registeredUsers: any[];
  me: { id: string; username: string };
  admin: boolean;
};

export type OfferThreadResult =
  | { ok: true; data: OfferThreadPayload }
  | { ok: false; status: number; error: string };

export async function loadOfferThread(
  id: string,
  user: { id: string; username: string },
  isAdmin: boolean
): Promise<OfferThreadResult> {
  if (!id) return { ok: false, status: 400, error: "Missing lobby id" };

  const lobbies = ((await getKV("lobbies")) || []) as any[];
  const seed =
    lobbies.find((l) => String(l.id) === String(id)) ||
    lobbies.find((l) => String(l.id)?.endsWith(`-${id}`));
  if (!seed) return { ok: false, status: 404, error: "Mission not found" };

  // Resolve aliases off the canonical account row so a Discord rename cannot
  // lock the owner out of their own thread.
  const allUsers = ((await getKV("registeredUsers")) || []) as any[];
  const meRow = allUsers.find((u) => String(u.id) === String(user.id));
  const handle = String(meRow?.username || user.username || "");
  const aliases = meRow ? playerAliases(meRow) : [];

  if (!isAdmin && !userCanViewOfferThread(seed, user.id, handle, aliases)) {
    return { ok: false, status: 403, error: "Access denied" };
  }

  const family = getOfferThreadFamily(seed, lobbies);
  const rootId = getThreadRootId(seed, lobbies);

  // Only the profiles that appear on this thread: owner, squad, applicants and
  // anyone already in the chat.
  const memberIds = new Set<string>([String(seed.ownerId)]);
  const collect = (rows: any) => {
    for (const row of rows || []) {
      const key = String(row?.applicantId ?? row?.userId ?? row?.id ?? "");
      if (key) memberIds.add(key);
    }
  };
  for (const lobby of family) {
    collect(lobby.accepted);
    collect(lobby.invited);
    collect(lobby.applicants);
    collect(lobby.history);
    for (const msg of lobby.messages || []) {
      const key = String(msg?.fromId ?? msg?.userId ?? msg?.from ?? "");
      if (key) memberIds.add(key);
    }
  }

  const users = allUsers
    .filter((u) => memberIds.has(String(u.id)))
    .map((u) => {
      const out: Record<string, unknown> = {};
      for (const field of THREAD_PROFILE_FIELDS) {
        if (u[field] !== undefined) out[field] = u[field];
      }
      return out;
    });

  return {
    ok: true,
    data: {
      lobbies: family,
      rootId: String(rootId),
      registeredUsers: users,
      me: { id: user.id, username: handle },
      admin: isAdmin,
    },
  };
}
