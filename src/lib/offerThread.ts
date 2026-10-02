import { getKV } from "@/lib/db";
import { getThreadBlob, setThreadBlob } from "@/lib/threadBlobCache";
import {
  getOfferThreadFamily,
  userCanViewOfferThread,
  getThreadRootId,
} from "@/lib/lobbyLifecycle";
import { playerAliases } from "@/lib/playerIdentity";
import { applyCharacterSnapshots } from "@/lib/memberCharacter";
import { dropNonGlobalCharacters } from "@/lib/publicDataView";

/** `registeredUsers` drives display names, so it can be cached a touch longer.
 *  `characters` is only read to stamp a member's verified character onto their
 *  row, so it may go stale for a few seconds like the rest. */
const BLOB_TTL_MS: Record<string, number> = { lobbies: 3000, registeredUsers: 8000, characters: 8000 };

/**
 * Read one of the hot blobs, collapsing concurrent thread opens into a
 * single D1 read per isolate per window. Writes invalidate the cache, so the
 * only staleness possible is a few seconds for *other* viewers.
 */
async function readBlob(key: "lobbies" | "registeredUsers" | "characters"): Promise<any | null> {
  const hit = getThreadBlob(key, BLOB_TTL_MS[key]);
  if (hit) return hit.value;
  const value = await getKV(key);
  setThreadBlob(key, value, BLOB_TTL_MS[key]);
  return value;
}

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
  mediaOmitted?: boolean;
};

export type OfferThreadResult =
  | { ok: true; data: OfferThreadPayload }
  | { ok: false; status: number; error: string };

/** True for inline data URLs — pasted chat images and self-hosted avatars. */
function isInlineData(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

const MEDIA_FIELDS = ["image", "avatar", "customAvatar", "profileGif", "activeVfx"] as const;

/**
 * Drop inline base64 media from a payload.
 *
 * A busy thread carries pasted chat images as data URLs inside the message
 * objects. Handing that to a server-rendered page inlines it all into the HTML,
 * which pushed the worker past its memory/CPU limit (Error 1102). The text is
 * what the first paint needs, so the seed drops the media and the client
 * re-fetches the full thread right after mount, with no spinner in between.
 */
function stripInlineMedia(lobbies: any[], users: any[]): void {
  for (const lobby of lobbies) {
    for (const msg of lobby?.messages || []) {
      for (const field of MEDIA_FIELDS) {
        if (isInlineData(msg?.[field])) msg[field] = null;
      }
    }
  }
  for (const user of users) {
    for (const field of MEDIA_FIELDS) {
      if (isInlineData(user?.[field])) user[field] = null;
    }
  }
}

export async function loadOfferThread(
  id: string,
  user: { id: string; username: string },
  isAdmin: boolean,
  opts: { omitMedia?: boolean } = {}
): Promise<OfferThreadResult> {
  if (!id) return { ok: false, status: 400, error: "Missing lobby id" };

  // Both of these are whole-store blobs. Reading them per request is what made
  // a few thread opens in a row expensive enough to hit Error 1102, so they go
  // through a short per-isolate cache that `db.ts` drops on every write.
  const lobbies = ((await readBlob("lobbies")) || []) as any[];
  const seed =
    lobbies.find((l) => String(l.id) === String(id)) ||
    lobbies.find((l) => String(l.id)?.endsWith(`-${id}`));
  if (!seed) return { ok: false, status: 404, error: "Mission not found" };

  // Resolve aliases off the canonical account row so a Discord rename cannot
  // lock the owner out of their own thread.
  const allUsers = ((await readBlob("registeredUsers")) || []) as any[];
  const meRow = allUsers.find((u) => String(u.id) === String(user.id));
  const handle = String(meRow?.username || user.username || "");
  const aliases = meRow ? playerAliases(meRow) : [];

  if (!isAdmin && !userCanViewOfferThread(seed, user.id, handle, aliases)) {
    return { ok: false, status: 403, error: "Access denied" };
  }

  const family = getOfferThreadFamily(seed, lobbies);
  const rootId = getThreadRootId(seed, lobbies);

  // Stamp each member's verified game character onto their row: the portrait,
  // ilevel and server the thread card renders. The member rows come straight out
  // of the `lobbies` blob and carry none of it — it lives on the `characters`
  // roster — so without this the thread shows a default avatar where the official
  // client shows the player's face. Only the family is touched, never the whole
  // blob, and the caller sees no `characters` payload of their own.
  const characters = dropNonGlobalCharacters<any>((await readBlob("characters")) || []);
  const stampedFamily = applyCharacterSnapshots(family, characters);

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

  if (opts.omitMedia) stripInlineMedia(stampedFamily, users);

  return {
    ok: true,
    data: {
      lobbies: stampedFamily,
      rootId: String(rootId),
      registeredUsers: users,
      me: { id: user.id, username: handle },
      admin: isAdmin,
      mediaOmitted: !!opts.omitMedia,
    },
  };
}
