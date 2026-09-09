import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKVPairs, setKV, initTables } from "@/lib/db";
import { canOwnerCancelLobby } from "@/lib/lobbyLifecycle";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const lobbyId = body?.lobbyId;
  if (!lobbyId) return NextResponse.json({ error: "lobbyId required" }, { status: 400 });

  await initTables();
  const existing = await getKVPairs();
  const lobbies = Array.isArray(existing.lobbies) ? [...existing.lobbies] : [];
  const idx = lobbies.findIndex((l: { id?: string }) => String(l.id) === String(lobbyId));
  if (idx === -1) return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  const lobby = lobbies[idx] as any;
  const uid = String(auth.user.id);
  const isOwner = String(lobby.ownerId) === uid;
  const isAdmin = auth.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Only the offer owner or an admin can delete this offer" }, { status: 403 });
  }

  if (isOwner && !isAdmin && !canOwnerCancelLobby(lobby)) {
    return NextResponse.json({ error: "Your offer already has a squad or is in progress" }, { status: 403 });
  }

  const nextLobbies = lobbies.filter((l: { id?: string }) => String(l.id) !== String(lobbyId));
  await setKV("lobbies", nextLobbies);

  return NextResponse.json({ success: true });
}