import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, initTables, updateKVAtomic } from "@/lib/db";
import {
  acceptApplicantAcrossLobbies,
  cancelLobbyInvite,
  memberIdentityKey,
  repairLobbyRoles,
} from "@/lib/lobbyLifecycle";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: any = await req.json();
  const lobbyId = body?.lobbyId;
  const action = body?.action;
  if (!lobbyId || (action !== "accept" && action !== "decline")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const uid = String(auth.user.id);

  let abortError: string | null = null;
  let removedNotifId: number | null = null;

  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const idx = cur.findIndex((l) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortError = "Offer not found.";
      return undefined;
    }
    const lobby = cur[idx];

    if (String(lobby.ownerId) === uid) {
      abortError = "You cannot join your own offer.";
      return undefined;
    }

    const invitedMember = (lobby.accepted || []).find(
      (a: any) => memberIdentityKey(a) === uid && a.status === "invited"
    );
    if (!invitedMember) {
      abortError = "Invite not found or already expired.";
      return undefined;
    }

    removedNotifId = Number(invitedMember.inviteNotifId) || null;

    if (action === "accept") {
      const next = acceptApplicantAcrossLobbies(cur, String(lobbyId), { ...invitedMember });
      const updated = next.find((l: any) => String(l.id) === String(lobbyId));
      const joined = (updated?.accepted || []).some(
        (a: any) => memberIdentityKey(a) === uid && a.status !== "invited"
      );
      if (!joined) {
        abortError = "Could not confirm your invite — squad may be full.";
        return undefined;
      }
      return next;
    }

    cur[idx] = repairLobbyRoles(cancelLobbyInvite(lobby, invitedMember));
    return cur;
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: abortError || "Could not respond — try again." },
      { status: 409 }
    );
  }

  if (removedNotifId) {
    const notifications: any[] = (await getKV("notifications")) || [];
    await setKV(
      "notifications",
      notifications.filter((n) => Number(n.id) !== removedNotifId)
    );
  }

  const updatedLobby = (res.value || []).find((l) => String(l.id) === String(lobbyId));
  return NextResponse.json({ success: true, action, lobby: updatedLobby || null });
}