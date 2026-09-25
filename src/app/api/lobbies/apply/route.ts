import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables, updateKVAtomic } from "@/lib/db";
import { sanitizeApplicantNote } from "@/lib/applicantNote";
import { withdrawApplicantFromOfferFamily, acceptApplicantAcrossLobbies } from "@/lib/lobbyLifecycle";
import { resolveNotificationRecipient } from "@/lib/userProfile";
import { checkAndRecordOfferAction, getOfferDailyUsage } from "@/lib/offerDailyLimit";
import { touchUserLastIp } from "@/lib/userLastIp";
import { getClientIp } from "@/lib/requestIp";
import {
  sanitizeAionClass,
  sanitizeAionLevel,
  sanitizeAionCpAp,
  aionClassRole,
  BOOST_MIN_LEVEL,
} from "@/lib/aionClassMeta";

function memberId(member: { applicantId?: string; userId?: string; id?: string }) {
  return String(member.applicantId || member.userId || member.id || "");
}

/** Verified game characters use `game:<characterId>` as their applicant id. */
function isGameCharApplicantId(id: string): boolean {
  return id.startsWith("game:");
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: any = await req.json();
  const lobbyId = body?.lobbyId;
  const applicant = body?.applicant;
  if (!lobbyId || !applicant || typeof applicant !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const uid = String(auth.user.id);

  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];
  const user = registeredUsers.find((u) => String(u.id) === uid);
  const usage = await getOfferDailyUsage(uid);
  if (!usage.exempt && usage.remaining <= 0) {
    return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });
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
      const u = registeredUsers.find((x: any) => String(x.id) === uid);
      if (!u?.team?.name) return {};
      return {
        teamName: String(u.team.name).slice(0, 40),
        teamMembers: Array.isArray(u.team.members)
          ? u.team.members
              .filter((m: any) => (m.status || "confirmed") === "confirmed")
              .slice(0, 3)
          : [],
      };
    })(),
  };

  const applicantLevel = Number(nextApplicant.level ?? 0);
  if (applicantLevel < BOOST_MIN_LEVEL) {
    return NextResponse.json(
      { error: `Boosting offers require Level ${BOOST_MIN_LEVEL}+ — your character is Level ${applicantLevel}.` },
      { status: 400 }
    );
  }

  let abortReason: string | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const idx = cur.findIndex((l: any) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortReason = "Lobby not found";
      return undefined;
    }
    const lobby = cur[idx] as any;
    if (String(lobby.ownerId) === uid) {
      abortReason = "You cannot apply to your own offer.";
      return undefined;
    }
    if ((lobby.status || "standby") !== "standby") {
      abortReason = "Offer is no longer open";
      return undefined;
    }
    const applicants = lobby.applicants || [];
    const accepted = lobby.accepted || [];
    if (applicants.some((a: any) => memberId(a) === uid)) {
      abortReason = "Already applied";
      return undefined;
    }
    if (accepted.some((a: any) => memberId(a) === uid)) {
      abortReason = "Already in squad";
      return undefined;
    }
    const charId = String(applicant.id || "");
    if (charId) {
      if (isGameCharApplicantId(charId) && applicants.some((a: any) => String(a.id) === charId)) {
        abortReason = "Character already applied";
        return undefined;
      }
      const dupOwner = cur.some((l: any) => {
        const all = [...(l.applicants || []), ...(l.accepted || [])];
        return all.some((a: any) => String(a.id) === charId && memberId(a) !== uid);
      });
      if (dupOwner) {
        abortReason = "Character already used by another account";
        return undefined;
      }
    }
    const updatedLobby = { ...lobby, applicants: [...applicants, nextApplicant] };
    cur[idx] = updatedLobby;
    return cur;
  });

  if (!res.ok) {
    const status = abortReason === "Lobby not found" ? 404 : 409;
    return NextResponse.json({ error: abortReason || "Could not apply — try again." }, { status });
  }

  const limitCheck = await checkAndRecordOfferAction(uid, user || auth.user);
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 429 });
  }

  touchUserLastIp(uid, getClientIp(req)).catch(() => {});

  let updatedLobby = (res.value || []).find((l: any) => String(l.id) === String(lobbyId));
  const ownerId = String(updatedLobby?.ownerId || "");
  const ownerUser = registeredUsers.find((u: any) => String(u.id) === ownerId);
  const meUser = registeredUsers.find((u: any) => String(u.id) === uid);

  let autoAccepted = false;

  if (ownerId && String(ownerId) !== uid && ownerUser?.autoAccept === true) {
    const acceptedRes = await updateKVAtomic<any[]>("lobbies", (ls) => {
      const next = acceptApplicantAcrossLobbies(Array.isArray(ls) ? ls : [], String(lobbyId), nextApplicant);
      const cur = next.find((l: any) => String(l.id) === String(lobbyId));
      if (!cur || !(cur.accepted || []).some((a: any) => memberId(a) === uid)) return undefined;
      return next;
    });
    if (acceptedRes.ok) {
      autoAccepted = true;
      updatedLobby = (acceptedRes.value || []).find((l: any) => String(l.id) === String(lobbyId));
      await updateKVAtomic<any[]>("notifications", (arr) => {
        const next = Array.isArray(arr) ? arr : [];
        const notifId = Date.now();
        const entry = {
          id: notifId,
          toUser: resolveNotificationRecipient(nextApplicant, registeredUsers),
          fromUser: String(ownerUser?.displayName || ownerUser?.name || updatedLobby?.ownerDiscordName || "Commander"),
          fromHandle: String(ownerUser?.username || ""),
          fromAvatar: String(ownerUser?.image || ownerUser?.avatar || ""),
          message: `Accepted to ${updatedLobby?.title || "your offer"}!`,
          type: "lobby_accept",
          lobbyId: String(lobbyId),
          applicantId: nextApplicant.id,
          applicantName: nextApplicant.applicantName,
          applicantData: nextApplicant,
          autoAccepted: true,
          timestamp: Date.now(),
        };
        return [...next, entry].slice(-300);
      });
    }
  } else if (ownerId && String(ownerId) !== uid) {
    const ownerHandle = String(ownerUser?.username || "");
    if (ownerHandle) {
      await updateKVAtomic<any[]>("notifications", (arr) => {
        const next = Array.isArray(arr) ? arr : [];
        const entry = {
          id: Date.now(),
          toUser: ownerHandle,
          fromUser: String(meUser?.displayName || meUser?.name || nextApplicant.applicantName || "Operative"),
          fromHandle: String(meUser?.username || ""),
          fromAvatar: String(meUser?.image || meUser?.avatar || ""),
          message: String(updatedLobby?.title || "New applicant"),
          type: "lobby_apply",
          lobbyId: String(lobbyId),
          applicantId: nextApplicant.id,
          applicantName: nextApplicant.applicantName,
          applicantData: nextApplicant,
          timestamp: Date.now(),
        };
        return [...next, entry].slice(-300);
      });
    }
  }

  return NextResponse.json({ success: true, lobby: updatedLobby, autoAccepted });
}

export async function PATCH(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: any = await req.json();
  const lobbyId = body?.lobbyId;
  const applicant = body?.applicant;
  if (!lobbyId || !applicant || typeof applicant !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const uid = String(auth.user.id);

  let abortReason: string | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const idx = cur.findIndex((l: any) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortReason = "Lobby not found";
      return undefined;
    }
    const lobby = cur[idx] as any;
    if (String(lobby.ownerId) === uid) {
      abortReason = "Cannot update your own offer application";
      return undefined;
    }
    if ((lobby.status || "standby") !== "standby") {
      abortReason = "Offer is no longer open";
      return undefined;
    }
    const applicants = lobby.applicants || [];
    const appIdx = applicants.findIndex((a: any) => memberId(a) === uid);
    if (appIdx === -1) {
      abortReason = "Application not found";
      return undefined;
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
    cur[idx] = updatedLobby;
    return cur;
  });

  if (!res.ok) {
    return NextResponse.json({ error: abortReason || "Could not update — try again." }, { status: 400 });
  }

  const updatedLobby = (res.value || []).find((l: any) => String(l.id) === String(lobbyId));
  return NextResponse.json({ success: true, lobby: updatedLobby });
}

export async function DELETE(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const lobbyId = searchParams.get("lobbyId");
  if (!lobbyId) return NextResponse.json({ error: "lobbyId required" }, { status: 400 });

  await initTables();
  const uid = String(auth.user.id);

  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    return withdrawApplicantFromOfferFamily(cur, lobbyId, uid);
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not withdraw — try again." }, { status: 409 });
  }

  const updatedLobby = (res.value || []).find((l: any) => String(l.id) === String(lobbyId));
  return NextResponse.json({ success: true, lobby: updatedLobby });
}
