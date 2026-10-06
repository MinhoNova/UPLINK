import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables, updateKVAtomic } from "@/lib/db";
import { sanitizeApplicantNote } from "@/lib/applicantNote";
import { withdrawApplicantFromOfferFamily, acceptApplicantAcrossLobbies } from "@/lib/lobbyLifecycle";
import { resolveNotificationRecipient, resolveNotificationRecipientId } from "@/lib/userProfile";
import { checkAndRecordOfferApply, getOfferApplyUsage } from "@/lib/offerDailyLimit";
import type { TrustedCharacterStats } from "@/lib/characterStatsSig";
import { trustCharacterStats } from "@/lib/characterStatsSig";
import {
  checkOfferRequirements,
  describeRequirementFailures,
  hasOfferRequirements,
  readOfferRequirements,
} from "@/lib/offerRequirements";
import { touchUserLastIp } from "@/lib/userLastIp";
import { charactersFromStore, memberCharacterSnapshot } from "@/lib/memberCharacter";
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

  // Charge the apply quota BEFORE the write. Recording it afterwards only
  // counted attempts — it never blocked the application, so the cap was a no-op.
  const limitCheck = await checkAndRecordOfferApply(uid, auth.user.role === "admin");
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 429 });
  }
  const usage = await getOfferApplyUsage(uid);

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

  const characters = await charactersFromStore();

  // The applicant's own character row, with the server's own numbers.
  //
  // `characters` is a client-writable blob, so a row could carry any level,
  // ilevel or combat power it liked. The row is only believed here when this
  // account owns it and the server's signature over its stats still verifies —
  // which is what makes both the Level 45 rule and an offer's gear requirement
  // enforceable. A client that POSTs a bigger number gets the same answer as one
  // that never tried.
  //
  // Verified before the atomic block because verification is async, then compared
  // inside it against the lobby actually being written — so an owner editing the
  // requirement between the two cannot be slipped past by a stale read.
  const myCharId = String(nextApplicant.id || "");
  let myStats: TrustedCharacterStats | null = null;
  if (myCharId.startsWith("game:")) {
    const row = characters.find((ch: any) => String(ch.id) === myCharId);
    if (row && String(row.userId) === uid) {
      myStats = await trustCharacterStats(row, uid);
    }
  }

  // Level 45 is read from the signed numbers, not from `applicant.level` in the
  // request body — reading it off the request made the rule decorative: anyone
  // who edited the payload cleared it. Unverifiable rows fail it too, which is
  // why the message points at the sync page: an unproven level is not a level
  // above 44, it is an unknown one.
  //
  // The check itself lives inside `updateKVAtomic` below, next to the lobby
  // actually being written, so it can exempt leveling offers: a leveling offer
  // exists to raise a character that is usually under 45, so the boost floor
  // would block every buyer it is meant for. There the applicant's own claimed
  // level is kept for the owner to see instead of the verified one.
  const trustedLevel = myStats?.level ?? 0;

  // The thread shows a member's real in-game portrait and ilevel. Those live on
  // the `characters` rows, so they are snapshotted onto the applicant here rather
  // than taken from the request: a client-supplied portrait would be discarded by
  // `clampMemberWrite` anyway, since a member's row is frozen to what is stored.
  const snapshot = memberCharacterSnapshot(characters, { ...nextApplicant, applicantId: uid });

  // Region check: prevent EU <-> NA cross-application
  try {
    const myCharId = String(applicant.id || nextApplicant.id || "");
    let myRegion: string | null = null;
    if (myCharId.startsWith("game:")) {
      const c = characters.find((ch: any) => String(ch.id) === myCharId);
      if (c?.region) myRegion = String(c.region).toLowerCase();
    }
    if (myRegion && myRegion !== "global") {
      const lobbyCheck = (await getKV("lobbies")) || [];
      const targetLobby = lobbyCheck.find((l: any) => String(l.id) === String(lobbyId));
      if (targetLobby) {
        const memberChars: any[] = [];
        const allMembers = [...(targetLobby.accepted || []), ...(targetLobby.applicants || [])];
        for (const m of allMembers) {
          const mid = String(m.id || "");
          if (mid.startsWith("game:")) {
            const mc = characters.find((ch: any) => String(ch.id) === mid);
            if (mc?.region) memberChars.push(String(mc.region).toLowerCase());
          }
        }
        if (memberChars.length > 0) {
          const lobbyRegion = memberChars[0];
          if (lobbyRegion !== "global" && myRegion !== lobbyRegion) {
            return NextResponse.json(
              {
                error: `Cannot apply: this offer is ${lobbyRegion.toUpperCase()} region, your character is ${myRegion.toUpperCase()} region.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }
  } catch (e) {
    // ignore region check errors
  }

  // Gear requirements: an offer can demand a minimum Item Level / Combat Power
  // because the dungeon genuinely locks lower characters out, so a player under
  // it cannot join. Checked against `myStats`, resolved above.
  let abortReason: string | null = null;
  let abortStatus = 0;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const idx = cur.findIndex((l: any) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortReason = "Lobby not found";
      return undefined;
    }
    const lobby = cur[idx] as any;

    // The Level 45 floor, evaluated against the lobby row being written so the
    // category cannot be swapped out between read and write.
    const isLevelingOffer = String(lobby.category || "").toLowerCase() === "leveling";
    if (!isLevelingOffer) {
      if (trustedLevel < BOOST_MIN_LEVEL) {
        abortReason = myStats
          ? `Boosting offers require Level ${BOOST_MIN_LEVEL}+ — your character is Level ${trustedLevel}.`
          : `Boosting offers require a verified Level ${BOOST_MIN_LEVEL}+ character — sync your character in My Characters first.`;
        // 400, not 409 or 403: the applicant is not eligible for the rule this
        // offer runs under and retrying will not change that.
        abortStatus = 400;
        return undefined;
      }
      // What the squad leader sees in the applicant row is the verified level,
      // not the number that was sent in.
      nextApplicant.level = trustedLevel;
    }

    // Against the requirements on the row being written, not a copy read earlier.
    const required = readOfferRequirements(lobby);
    if (hasOfferRequirements(required)) {
      const verdict = checkOfferRequirements(required, myStats);
      if (!verdict.ok) {
        abortReason = describeRequirementFailures(verdict.failures);
        // 403, not 409: nothing is wrong with the state of the offer, the caller
        // simply is not eligible for it, and retrying will not change that.
        abortStatus = 403;
        return undefined;
      }
    }

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
    const updatedLobby = { ...lobby, applicants: [...applicants, { ...nextApplicant, ...snapshot }] };
    cur[idx] = updatedLobby;
    return cur;
  });

  if (!res.ok) {
    const status = abortStatus || (abortReason === "Lobby not found" ? 404 : 409);
    return NextResponse.json({ error: abortReason || "Could not apply — try again." }, { status });
  }

  touchUserLastIp(uid, getClientIp(req)).catch(() => {});

  let updatedLobby = (res.value || []).find((l: any) => String(l.id) === String(lobbyId));
  const ownerId = String(updatedLobby?.ownerId || "");
  const ownerUser = registeredUsers.find((u: any) => String(u.id) === ownerId);
  const meUser = registeredUsers.find((u: any) => String(u.id) === uid);

  let autoAccepted = false;

  if (ownerId && String(ownerId) !== uid && ownerUser?.autoAccept === true) {
    const acceptedRes = await updateKVAtomic<any[]>("lobbies", (ls) => {
      const next = acceptApplicantAcrossLobbies(Array.isArray(ls) ? ls : [], String(lobbyId), { ...nextApplicant, ...snapshot });
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
          toUserId: resolveNotificationRecipientId(nextApplicant, registeredUsers),
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
          toUserId: ownerId,
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
