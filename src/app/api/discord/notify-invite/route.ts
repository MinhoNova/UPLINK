import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKVPairs, initTables } from "@/lib/db";
import { sendDiscordInviteDM, sendDiscordConfirmedDM } from "@/lib/discord";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const lobbyId = String(body?.lobbyId || "");
  const notifId = body?.notifId;
  const applicantDiscordId = String(body?.applicantDiscordId || "");
  const mode = body?.mode === "confirmed" ? "confirmed" : "invite";

  if (!lobbyId || !applicantDiscordId) {
    return NextResponse.json({ error: "Missing lobbyId or applicantDiscordId" }, { status: 400 });
  }
  if (mode === "invite" && notifId == null) {
    return NextResponse.json({ error: "Missing notifId for invite" }, { status: 400 });
  }

  await initTables();
  const data = await getKVPairs();
  const lobby = (data.lobbies || []).find((l: any) => String(l.id) === lobbyId);
  if (!lobby) return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  if (String(lobby.ownerId) !== String(auth.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerUser = (data.registeredUsers || []).find((u: any) => String(u.id) === String(auth.user.id));
  const sent =
    mode === "confirmed"
      ? await sendDiscordConfirmedDM(applicantDiscordId, lobby, ownerUser)
      : await sendDiscordInviteDM(applicantDiscordId, lobby, ownerUser, notifId);

  return NextResponse.json({ ok: sent });
}
