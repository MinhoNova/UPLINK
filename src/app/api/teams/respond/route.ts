import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKVPairs, setKV, initTables } from "@/lib/db";
import { rateLimitByUser } from "@/lib/rateLimit";
import { isUserBanned, bannedResponse } from "@/lib/banCheck";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (await isUserBanned(auth.user.username, auth.user.id)) {
    return bannedResponse();
  }

  const rl = await rateLimitByUser(auth.user.id, "team_respond", 40, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many team actions", retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  const body = await req.json();
  const ownerId = String(body?.ownerId || "");
  const action = String(body?.action || "");
  if (!ownerId || (action !== "accept" && action !== "decline")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (String(ownerId) === String(auth.user.id)) {
    return NextResponse.json({ error: "You cannot respond to your own team" }, { status: 400 });
  }

  await initTables();
  const data = await getKVPairs();
  const registeredUsers: Record<string, any>[] = Array.isArray(data.registeredUsers)
    ? data.registeredUsers
    : [];
  const notifications: Record<string, any>[] = Array.isArray(data.notifications)
    ? data.notifications
    : [];

  const ownerIdx = registeredUsers.findIndex((u) => String(u.id) === String(ownerId));
  if (ownerIdx === -1) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const owner = registeredUsers[ownerIdx];
  const members = Array.isArray(owner.team?.members) ? owner.team.members : [];
  const memberIdx = members.findIndex((m: any) => String(m.id) === String(auth.user.id));
  if (memberIdx === -1) {
    return NextResponse.json({ error: "You are not invited to this team" }, { status: 404 });
  }

  const responder = registeredUsers.find((u) => String(u.id) === String(auth.user.id));
  const responderName = String(responder?.name || auth.user.name || auth.user.username || "Player");
  const responderAvatar = String(responder?.avatar || "");

  let nextMembers = [...members];
  if (action === "accept") {
    nextMembers[memberIdx] = {
      ...nextMembers[memberIdx],
      status: "confirmed",
      name: responderName,
      avatar: responderAvatar,
    };
  } else {
    nextMembers = nextMembers.filter((m: any) => String(m.id) !== String(auth.user.id));
  }

  registeredUsers[ownerIdx] = {
    ...owner,
    team: {
      name: String(owner.team?.name || ""),
      members: nextMembers,
      ...(owner.team?.lastRenameAt ? { lastRenameAt: owner.team.lastRenameAt } : {}),
    },
  };

  const inviteId = Number(members[memberIdx]?.inviteNotifId) || 0;
  const nextNotifications = notifications.filter(
    (n) =>
      !(
        String(n?.type) === "team_invite" &&
        inviteId > 0 &&
        Number(n?.id) === inviteId
      )
  );
  const replyNotif = {
    id: Date.now(),
    type: action === "accept" ? "team_accept" : "team_decline",
    fromHandle: auth.user.username,
    fromUser: responderName,
    toUser: String(owner.username || ""),
    message: `${responderName} ${action === "accept" ? "accepted" : "declined"} your team invite`,
    teamName: String(owner.team?.name || ""),
    createdAt: Date.now(),
  };
  nextNotifications.push(replyNotif);

  await setKV("registeredUsers", registeredUsers);
  await setKV("notifications", nextNotifications);

  return NextResponse.json({
    success: true,
    action,
    teamName: String(owner.team?.name || ""),
    memberCount: nextMembers.length,
  });
}