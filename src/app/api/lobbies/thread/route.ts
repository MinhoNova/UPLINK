import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import {
  getOfferThreadFamily,
  userCanViewOfferThread,
  getThreadRootId,
} from "@/lib/lobbyLifecycle";
import { playerAliases } from "@/lib/playerIdentity";

/**
 * One offer thread, and only what it needs.
 *
 * The thread page used to open `/api/data`, which loads and serialises the
 * entire key/value store — every lobby, every player, every character, market
 * history and all. Pasted chat images ride along as base64 inside the message
 * objects, so a single busy offer could make that response many megabytes, and
 * the page could sit on a spinner for a minute before rendering one thread.
 *
 * This reads the single `lobbies` key, keeps just the clicked thread's family,
 * and returns only the profile fields a thread header actually renders. The
 * authorisation is the same `userCanViewOfferThread` the UI used to apply
 * client-side, now enforced on the server where it cannot be bypassed.
 */
export const dynamic = "force-dynamic";

const PROFILE_FIELDS = [
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

export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    await initTables();
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "Missing lobby id" }, { status: 400 });

    const lobbies = ((await getKV("lobbies")) || []) as any[];
    const seed =
      lobbies.find((l) => String(l.id) === String(id)) ||
      lobbies.find((l) => String(l.id)?.endsWith(`-${id}`));
    if (!seed) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

    // Resolve aliases off the canonical account row so a Discord rename cannot
    // lock the owner out of their own thread.
    const allUsers = ((await getKV("registeredUsers")) || []) as any[];
    const meRow = allUsers.find((u) => String(u.id) === String(auth.user.id));
    const handle = String(meRow?.username || auth.user.username || "");
    const aliases = meRow ? playerAliases(meRow) : [];

    if (!userCanViewOfferThread(seed, auth.user.id, handle, aliases)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const family = getOfferThreadFamily(seed, lobbies);
    const rootId = getThreadRootId(seed, lobbies);

    // Only the profiles that appear on this thread: owner, squad, applicants
    // and anyone already in the chat.
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
        for (const field of PROFILE_FIELDS) {
          if (u[field] !== undefined) out[field] = u[field];
        }
        return out;
      });

    return NextResponse.json({
      lobbies: family,
      rootId: String(rootId),
      registeredUsers: users,
      me: { id: auth.user.id, username: handle },
    });
  } catch (error) {
    console.error("[thread] failed to read thread:", error);
    return NextResponse.json({ error: "Failed to load mission" }, { status: 500 });
  }
}
