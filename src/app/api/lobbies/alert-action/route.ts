import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables, updateKVAtomic } from "@/lib/db";
import { acceptApplicantAcrossLobbies } from "@/lib/lobbyLifecycle";
import { resolveNotificationRecipient } from "@/lib/userProfile";
import { getClientIp } from "@/lib/requestIp";
import { touchUserLastIp } from "@/lib/userLastIp";

function memberId(member: { applicantId?: string; id?: string }) {
  return String(member.applicantId || member.id || "");
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const lobbyId = String(body?.lobbyId || "");
  const applicantId = String(body?.applicantId || "");
  const action = body?.action === "accept" ? "accept" : body?.action === "decline" ? "decline" : "";
  const notificationId = Number(body?.notificationId) || 0;
  if (!lobbyId || !applicantId || !action) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const uid = String(auth.user.id);
  const lobbies: any[] = (await getKV("lobbies")) || [];
  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];

  const target = lobbies.find((l: any) => String(l.id) === String(lobbyId));
  if (!target) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (String(target.ownerId) !== uid) {
    return NextResponse.json({ error: "Only the offer owner can act here" }, { status: 403 });
  }

  const applicant = (target.applicants || []).find((a: any) => memberId(a) === applicantId || String(a.id) === applicantId);
  if (!applicant) return NextResponse.json({ error: "Applicant no longer pending" }, { status: 404 });

  if (action === "accept") {
    const enriched = {
      ...applicant,
      applicantAvatar: applicant.applicantAvatar || registeredUsers.find((u: any) => String(u.id) === String(applicant.applicantId))?.image || "",
      raiderRegion: String(applicant.raiderRegion || applicant.region || "").toLowerCase(),
      raiderRealm: applicant.raiderRealm || applicant.realm,
    };
    const targetKey = String(enriched.applicantId || enriched.id || "");

    const acceptedRes = await updateKVAtomic<any[]>("lobbies", (ls) => {
      const arr = Array.isArray(ls) ? ls : [];
      const next = acceptApplicantAcrossLobbies(arr, lobbyId, enriched);
      const cur = next.find((l: any) => String(l.id) === lobbyId);
      const joined = cur?.accepted?.some((a: any) => String(a.applicantId || a.id) === targetKey);
      return joined ? next : undefined;
    });
    if (!acceptedRes.ok) return NextResponse.json({ error: "Failed to accept, try again" }, { status: 409 });

    const ownerInfo = registeredUsers.find((u: any) => String(u.id) === uid);
    await updateKVAtomic<any[]>("notifications", (arr) => {
      const next = Array.isArray(arr) ? arr : [];
      const entry = {
        id: Date.now(),
        toUser: resolveNotificationRecipient(enriched, registeredUsers),
        fromUser: String(ownerInfo?.displayName || ownerInfo?.name || target.ownerDiscordName || "Commander"),
        fromHandle: String(ownerInfo?.username || ""),
        fromAvatar: String(ownerInfo?.image || ownerInfo?.avatar || ""),
        message: `Accepted to ${target.title}!`,
        type: "lobby_accept",
        lobbyId,
        applicantId: enriched.id,
        applicantName: enriched.applicantName || enriched.name,
        applicantData: enriched,
        autoAccepted: false,
        timestamp: Date.now(),
      };
      const kept = next.filter((n: any) =>
        !(notificationId ? Number(n.id) === notificationId : String(n.type) === "lobby_apply" && String(n.applicantId) === applicantId)
      );
      return [...kept, entry].slice(-300);
    });

    touchUserLastIp(uid, getClientIp(req)).catch(() => {});
    return NextResponse.json({ success: true, action: "accept" });
  }

  // decline
  const finalRes = await updateKVAtomic<any[]>("lobbies", (ls) => {
    const arr = Array.isArray(ls) ? ls : [];
    const next = arr.map((l: any) => {
      if (String(l.id) !== lobbyId) return l;
      return { ...l, applicants: (l.applicants || []).filter((a: any) => memberId(a) !== applicantId && String(a.id) !== applicantId) };
    });
    return next;
  });
  if (!finalRes.ok) return NextResponse.json({ error: "Failed to decline, try again" }, { status: 409 });

  await updateKVAtomic<any[]>("notifications", (arr) => {
    const next = Array.isArray(arr) ? arr : [];
    return next.filter((n: any) => !(notificationId ? Number(n.id) === notificationId : String(n.type) === "lobby_apply" && String(n.applicantId) === applicantId));
  });

  touchUserLastIp(uid, getClientIp(req)).catch(() => {});
  return NextResponse.json({ success: true, action: "decline" });
}