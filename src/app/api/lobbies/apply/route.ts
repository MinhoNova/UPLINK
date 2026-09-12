import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKVPairs, setKV, initTables } from "@/lib/db";
import { sanitizeApplicantNote } from "@/lib/applicantNote";
import { withdrawApplicantFromOfferFamily } from "@/lib/lobbyLifecycle";
import { checkAndRecordOfferAction } from "@/lib/offerDailyLimit";
import { touchUserLastIp } from "@/lib/userLastIp";
import { getClientIp } from "@/lib/requestIp";
import {
  sanitizeAionClass,
  sanitizeAionLevel,
  sanitizeAionCpAp,
  aionClassRole,
} from "@/lib/aionClassMeta";

function memberId(member: { applicantId?: string; userId?: string; id?: string }) {
  return String(member.applicantId || member.userId || member.id || "");
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const lobbyId = body?.lobbyId;
  const applicant = body?.applicant;
  if (!lobbyId || !applicant || typeof applicant !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const existing = await getKVPairs();
  const lobbies = Array.isArray(existing.lobbies) ? [...existing.lobbies] : [];
  const idx = lobbies.findIndex((l: { id?: string }) => String(l.id) === String(lobbyId));
  if (idx === -1) return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  const lobby = lobbies[idx] as any;
  const uid = String(auth.user.id);

  if (String(lobby.ownerId) === uid) {
    return NextResponse.json({ error: "You cannot apply to your own offer." }, { status: 403 });
  }

  const status = lobby.status || "standby";
  if (status !== "standby") {
    return NextResponse.json({ error: "Offer is no longer open" }, { status: 403 });
  }

  const applicants = lobby.applicants || [];
  const accepted = lobby.accepted || [];

  if (applicants.some((a: any) => memberId(a) === uid)) {
    return NextResponse.json({ error: "Already applied" }, { status: 409 });
  }
  if (accepted.some((a: any) => memberId(a) === uid)) {
    return NextResponse.json({ error: "Already in squad" }, { status: 409 });
  }

  const charId = String(applicant.id || "");
  if (charId && applicants.some((a: any) => String(a.id) === charId)) {
    return NextResponse.json({ error: "Character already applied" }, { status: 409 });
  }

  const registeredUsers: any[] = existing.registeredUsers || [];
  const user = registeredUsers.find((u) => String(u.id) === uid);
  const limitCheck = await checkAndRecordOfferAction(uid, user || auth.user);
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 429 });
  }

  const nextApplicant = {
    ...applicant,
    applicantId: uid,
    applicantName: applicant.applicantName || auth.user.name || "Operative",
    applicantNote: sanitizeApplicantNote(applicant.applicantNote),
    aionClass: sanitizeAionClass(applicant.aionClass || applicant.className || applicant.class),
    level: sanitizeAionLevel(applicant.level ?? applicant.applicantLevel),
    cpAp: sanitizeAionCpAp(applicant.cpAp ?? applicant.applicantCpAp),
    role: aionClassRole(applicant.aionClass || applicant.className || applicant.class),
    ...(() => {
      const user = registeredUsers.find((u) => String(u.id) === uid);
      if (!user?.team?.name) return {};
      return {
        teamName: String(user.team.name).slice(0, 40),
        teamMembers: Array.isArray(user.team.members)
          ? user.team.members
              .filter((m: any) => (m.status || "confirmed") === "confirmed")
              .slice(0, 3)
          : [],
      };
    })(),
  };

  const updatedLobby = {
    ...lobby,
    applicants: [...applicants, nextApplicant],
  };

  lobbies[idx] = updatedLobby;
  await setKV("lobbies", lobbies);
  touchUserLastIp(uid, getClientIp(req)).catch(() => {});

  return NextResponse.json({ success: true, lobby: updatedLobby });
}

export async function PATCH(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const lobbyId = body?.lobbyId;
  const applicant = body?.applicant;
  if (!lobbyId || !applicant || typeof applicant !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const existing = await getKVPairs();
  const lobbies = Array.isArray(existing.lobbies) ? [...existing.lobbies] : [];
  const idx = lobbies.findIndex((l: { id?: string }) => String(l.id) === String(lobbyId));
  if (idx === -1) return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  const lobby = lobbies[idx] as any;
  const uid = String(auth.user.id);

  if (String(lobby.ownerId) === uid) {
    return NextResponse.json({ error: "Cannot update your own offer application" }, { status: 403 });
  }

  if ((lobby.status || "standby") !== "standby") {
    return NextResponse.json({ error: "Offer is no longer open" }, { status: 403 });
  }

  const applicants = lobby.applicants || [];
  const appIdx = applicants.findIndex((a: any) => memberId(a) === uid);
  if (appIdx === -1) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const prev = applicants[appIdx];
  const nextApplicant = {
    ...prev,
    ...applicant,
    applicantId: uid,
    applicantName: applicant.applicantName || prev.applicantName || auth.user.name || "Operative",
    applicantNote:
      applicant.applicantNote != null
        ? sanitizeApplicantNote(applicant.applicantNote)
        : prev.applicantNote,
  };

  const nextApplicants = [...applicants];
  nextApplicants[appIdx] = nextApplicant;

  const updatedLobby = { ...lobby, applicants: nextApplicants };
  lobbies[idx] = updatedLobby;
  await setKV("lobbies", lobbies);

  return NextResponse.json({ success: true, lobby: updatedLobby });
}

export async function DELETE(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const lobbyId = searchParams.get("lobbyId");
  if (!lobbyId) return NextResponse.json({ error: "lobbyId required" }, { status: 400 });

  await initTables();
  const existing = await getKVPairs();
  const lobbies = Array.isArray(existing.lobbies) ? [...existing.lobbies] : [];
  const idx = lobbies.findIndex((l: { id?: string }) => String(l.id) === String(lobbyId));
  if (idx === -1) return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  const lobby = lobbies[idx] as any;
  const uid = String(auth.user.id);

  const updatedLobbies = withdrawApplicantFromOfferFamily(lobbies, lobbyId, uid);
  const updatedLobby = updatedLobbies.find((l: { id?: string }) => String(l.id) === String(lobbyId));

  await setKV("lobbies", updatedLobbies);

  return NextResponse.json({ success: true, lobby: updatedLobby ?? lobby });
}
