import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { initTables, updateKVAtomic } from "@/lib/db";
import { isAdminUser } from "@/lib/secureDataWrite";
import {
  memberIdentityKey,
  repairLobbyRoles,
  splitLobbyAfterMemberExit,
} from "@/lib/lobbyLifecycle";

/** An offer past its mission: kicking there may correct the roster, never re-open it. */
const FINISHED_OFFER_STATUSES = new Set([
  "completed",
  "unpaid",
  "payment_pending",
  "cancelled",
  "failed",
]);

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: any = await req.json();
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
  const uid = String(auth.user.id);
  const isAdmin = isAdminUser(uid, auth.user.username);

  let abortReason: string | null = null;
  let focusLobbyId = String(lobbyId);
  let childLobby: any | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const lobby = cur.find((l: { id?: string }) => String(l.id) === String(lobbyId));
    if (!lobby) {
      abortReason = "Lobby not found";
      return undefined;
    }
    const isOwner = String((lobby as any).ownerId) === uid;
    const isSelfLeave = memberIdentityKey(member) === uid;
    if (!isAdmin && !isOwner && !(isSelfLeave && !isKick)) {
      abortReason = "Not allowed";
      return undefined;
    }
    if (isKick && !isAdmin && !isOwner) {
      abortReason = "Not allowed";
      return undefined;
    }
    // Removing a member from an offer that is already finished is a roster
    // correction, and stays one: it must carry zero completed runs. A member
    // exit with runs attached splits the offer and republishes whatever is left
    // as a brand new active offer — on a completed (already paid) offer that
    // turns one finished payout into an endless chain of fresh ones, and on an
    // unpaid one it is a way to dodge paying for runs already played. Both are
    // the reason kicks used to be hidden here entirely; the roster edit they
    // also blocked is legitimate, so the block moved to the part that is not.
    const finished = FINISHED_OFFER_STATUSES.has(String((lobby as any).status || "standby"));
    if (finished && completed > 0) {
      abortReason = "This offer is already finished — members can only be removed from its roster, with no runs attributed.";
      return undefined;
    }
    const splitResult = splitLobbyAfterMemberExit(
      cur,
      String(lobbyId),
      member,
      completed,
      isKick,
      leaveMsg,
      historySnapshot || member
    );
    if (!splitResult) {
      abortReason = "Split failed";
      return undefined;
    }
    focusLobbyId = splitResult.focusLobbyId;
    childLobby = splitResult.childLobby;
    return splitResult.lobbies.map(repairLobbyRoles);
  });

  if (!res.ok) {
    const status = abortReason === "Lobby not found" ? 404 : 400;
    return NextResponse.json({ error: abortReason || "Could not update — try again." }, { status });
  }

  const nextLobbies = res.value || [];
  return NextResponse.json({
    success: true,
    lobbies: nextLobbies,
    focusLobbyId,
    childLobby,
  });
}
