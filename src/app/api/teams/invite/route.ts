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

  const rl = await rateLimitByUser(auth.user.id, "team_invite", 40, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many team actions", retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  const body = await req.json();
  const ownerId = String(body?.ownerId || "");
  if (!ownerId || String(ownerId) !== String(auth.user.id)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
  if (ownerIdx === -1) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const owner = registeredUsers[ownerIdx];
  const ownerHandle = String(owner.username || auth.user.username || "");
  const members = Array.isArray(owner.team?.members) ? owner.team.members : [];
  const activeMemberIds = new Set(members.map((m: any) => String(m.id)));
  const teamName = String(owner.team?.name || "");

  let nextNotifications = notifications.filter(
    (n) =>
      !(
        String(n?.type) === "team_invite" &&
        String(n?.fromHandle || "").toLowerCase() === String(ownerHandle).toLowerCase() &&
        !activeMemberIds.has(String(n?.memberId || ""))
      )
  );

  const memberId = String(body?.memberId || "");
  if (memberId) {
    const member = registeredUsers.find((u) => String(u.id) === String(memberId));
    const memberEntry = members.find((m: any) => String(m.id) === String(memberId));
    const inTeam = !!memberEntry;
    const stillPending = inTeam && String(memberEntry?.status || "pending") === "pending";

    if (member && inTeam && stillPending) {
      const inviteId = Number(memberEntry?.inviteNotifId) || Date.now();

      if (memberEntry && !Number(memberEntry?.inviteNotifId)) {
        registeredUsers[ownerIdx] = {
          ...owner,
          team: {
            name: teamName,
            members: members.map((m: any) =>
              String(m.id) === String(memberId) ? { ...m, inviteNotifId: inviteId } : m
            ),
            ...(owner.team?.lastRenameAt ? { lastRenameAt: owner.team.lastRenameAt } : {}),
          },
        };
      }

      nextNotifications = nextNotifications.filter(
        (n) =>
          !(
            String(n?.type) === "team_invite" &&
            String(n?.fromHandle || "").toLowerCase() === String(ownerHandle).toLowerCase() &&
            String(n?.memberId || "") === String(memberId)
          )
      );
      nextNotifications.push({
        id: inviteId,
        type: "team_invite",
        fromHandle: ownerHandle,
        fromUser: String(owner.name || owner.username || "Team Captain"),
        toUser: String(member.username || ""),
        ownerId: String(ownerId),
        memberId: String(memberId),
        teamName,
        message: teamName ? `Invited you to join ${teamName}` : "Invited you to join their team",
        createdAt: Date.now(),
      });

      await setKV("registeredUsers", registeredUsers);
    }
  }

  await setKV("notifications", nextNotifications);

  return NextResponse.json({ success: true, pending: members.filter((m: any) => m.status === "pending").length });
}