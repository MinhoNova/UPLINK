import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { initTables, updateKVAtomic } from "@/lib/db";

export async function PATCH(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const lobbyId = body?.lobbyId;
  const customBg = body?.customBg;
  if (!lobbyId || typeof customBg !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const isAdmin = auth.user.role === "admin";
  const uid = String(auth.user.id);

  let abortReason: string | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const existing = Array.isArray(lobbies) ? lobbies : [];
    const idx = existing.findIndex((l: { id?: string }) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortReason = "Lobby not found";
      return undefined;
    }
    const lobby = existing[idx] as { ownerId?: string };
    if (String(lobby.ownerId) !== uid && !isAdmin) {
      abortReason = "Forbidden";
      return undefined;
    }
    const updated = existing.map((l, i) => (i === idx ? { ...l, customBg } : l));
    return updated;
  });

  if (!res.ok) {
    const status = abortReason === "Lobby not found" ? 404 : 403;
    return NextResponse.json({ error: abortReason || "Could not update — try again." }, { status });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  if (!Array.isArray(body?.lobbies)) {
    return NextResponse.json({ error: "Invalid lobbies" }, { status: 400 });
  }

  // Server-side merge: the client normally sends the full array it last saw.
  // Blindly replacing the store with that snapshot can silently erase lobbies
  // created by other users between the client's read and this write. Instead,
  // reconcile the incoming snapshot against the current store atomically:
  //   - keep any lobby the client did NOT send (concurrent additions)
  //   - upsert the lobbies the client DID send
  const res = await updateKVAtomic<any[]>("lobbies", (current) => {
    const storeLobbies = Array.isArray(current) ? current : [];
    const mergedById = new Map<string, any>();
    for (const l of storeLobbies) {
      if (l && l.id != null) mergedById.set(String(l.id), l);
    }
    for (const l of body.lobbies) {
      if (l && l.id != null) mergedById.set(String(l.id), l);
    }
    return [...mergedById.values()];
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not save lobbies — please retry" }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
