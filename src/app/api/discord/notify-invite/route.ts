import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { rateLimitByUser } from "@/lib/rateLimit";
import { getKVPairs, initTables } from "@/lib/db";
import { sendDiscordInviteDM, sendDiscordConfirmedDM } from "@/lib/discord";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Each accepted call is an outbound message from the site's bot, so the
  // volume a single offer owner can spend is capped.
  const rl = await rateLimitByUser(auth.user.id, "discord_notify_invite", 20, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many Discord notifications, try again later" },
      { status: 429 }
    );
  }

  const body: any = await req.json().catch(() => ({}));
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

  // The lobby was checked but the recipient was not. `applicantDiscordId` came
  // straight from the request body, so owning one offer was enough to point the
  // site bot at any snowflake and DM it as UPLINK, as often as the per-IP
  // bucket allowed — spam from your bot, to strangers, at their DMs.
  //
  // The recipient has to be somebody who is actually on this offer: an applicant
  // who asked to join, an invitee, or an accepted member. A Discord id is a
  // stable id, so the roster can be checked exactly.
  const known = (list: any) =>
    (Array.isArray(list) ? list : []).some((m: any) =>
      [m?.discordId, m?.applicantDiscordId, m?.userId, m?.applicantId, m?.id]
        .map((v: any) => String(v ?? ""))
        .includes(applicantDiscordId)
    );
  const isOnOffer =
    known(lobby.applicants) || known(lobby.invited) || known(lobby.accepted) || known(lobby.history);
  if (!isOnOffer) {
    return NextResponse.json({ error: "That player is not on this offer" }, { status: 403 });
  }

  const ownerUser = (data.registeredUsers || []).find((u: any) => String(u.id) === String(auth.user.id));
  const sent =
    mode === "confirmed"
      ? await sendDiscordConfirmedDM(applicantDiscordId, lobby, ownerUser)
      : await sendDiscordInviteDM(applicantDiscordId, lobby, ownerUser, notifId);

  return NextResponse.json({ ok: sent });
}
