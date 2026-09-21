import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { initTables, updateKVAtomic } from "@/lib/db";
import { canOwnerCancelLobby } from "@/lib/lobbyLifecycle";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: any = await req.json();
  const lobbyId = body?.lobbyId;
  if (!lobbyId) return NextResponse.json({ error: "lobbyId required" }, { status: 400 });

  await initTables();
  const uid = String(auth.user.id);
  const isAdmin = auth.user.role === "admin";

  let abortReason: string | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const idx = cur.findIndex((l: { id?: string }) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortReason = "Lobby not found";
      return undefined;
    }
    const lobby = cur[idx] as any;
    const isOwner = String(lobby.ownerId) === uid;
    if (!isOwner && !isAdmin) {
      abortReason = "Only the offer owner or an admin can delete this offer";
      return undefined;
    }
    if (isOwner && !isAdmin && !canOwnerCancelLobby(lobby)) {
      abortReason = "Your offer already has a squad or is in progress";
      return undefined;
    }
    return cur.filter((l: { id?: string }) => String(l.id) !== String(lobbyId));
  });

  if (!res.ok) {
    const status = abortReason === "Lobby not found" ? 404 : 403;
    return NextResponse.json({ error: abortReason || "Could not delete — try again." }, { status });
  }

  return NextResponse.json({ success: true });
}