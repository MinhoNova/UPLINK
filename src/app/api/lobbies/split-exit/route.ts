import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKVPairs, setKV, initTables } from "@/lib/db";
import { isAdminUser } from "@/lib/secureDataWrite";
import {
  memberIdentityKey,
  repairLobbyRoles,
  splitLobbyAfterMemberExit,
} from "@/lib/lobbyLifecycle";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const lobbyId = body?.lobbyId;
  const member = body?.member;
  const completed = Math.max(0, Number(body?.completed) || 0);
  const isKick = !!body?.isKick;
  const leaveMsg = body?.leaveMsg;
  const historySnapshot = body?.historySnapshot;

  if (!lobbyId || !member || !leaveMsg) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (completed > 0 && !historySnapshot) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const existing = await getKVPairs();
  const lobbies = Array.isArray(existing.lobbies) ? [...existing.lobbies] : [];
  const lobby = lobbies.find((l: { id?: string }) => String(l.id) === String(lobbyId));
  if (!lobby) return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  const uid = String(auth.user.id);
  const isAdmin = isAdminUser(uid, auth.user.username);
  const isOwner = String((lobby as any).ownerId) === uid;
  const isSelfLeave = memberIdentityKey(member) === uid;

  if (!isAdmin && !isOwner && !(isSelfLeave && !isKick)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (isKick && !isAdmin && !isOwner) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const splitResult = splitLobbyAfterMemberExit(
    lobbies,
    String(lobbyId),
    member,
    completed,
    isKick,
    leaveMsg,
    historySnapshot || member
  );

  if (!splitResult) {
    return NextResponse.json({ error: "Split failed" }, { status: 400 });
  }

  const nextLobbies = splitResult.lobbies.map(repairLobbyRoles);
  await setKV("lobbies", nextLobbies);

  return NextResponse.json({
    success: true,
    lobbies: nextLobbies,
    focusLobbyId: splitResult.focusLobbyId,
    childLobby: splitResult.childLobby,
  });
}
