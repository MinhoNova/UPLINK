import { getKV, setKV, initTables, updateKVAtomic } from "@/lib/db";
import {
  acceptApplicantAcrossLobbies,
  cancelLobbyInvite,
  memberIdentityKey,
  repairLobbyRoles,
} from "@/lib/lobbyLifecycle";
import { notificationMatchesUser } from "@/lib/userProfile";
import { checkAndRecordOfferAction } from "@/lib/offerDailyLimit";

function memberId(member: { applicantId?: string; userId?: string; id?: string }) {
  return String(member.applicantId || member.userId || member.id || "");
}

async function loadLobbyData() {
  await initTables();
  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];
  const characters: any[] = (await getKV("characters")) || [];
  const notifications: any[] = (await getKV("notifications")) || [];
  return { registeredUsers, characters, notifications };
}

export async function applyToLobbyFromDiscord(discordUserId: string, lobbyId: string) {
  const { registeredUsers, characters } = await loadLobbyData();

  const user = registeredUsers.find((u) => String(u.id) === String(discordUserId));
  if (!user) {
    return { ok: false as const, error: "Link your account on UPLINK first (Sign in with Discord on the site)." };
  }

  const uid = String(discordUserId);
  const char =
    characters.find((c) => String(c.userId) === uid) ||
    characters.find((c) => String(c.userName || "").toLowerCase() === String(user.username || "").toLowerCase());

  if (!char) {
    return {
      ok: false as const,
      error: "Character required — add one on UPLINK first, then apply from Discord.",
    };
  }

  const limitCheck = await checkAndRecordOfferAction(uid, user);
  if (!limitCheck.ok) {
    return { ok: false as const, error: limitCheck.error };
  }

  const nextApplicant = {
    ...char,
    applicantId: uid,
    applicantName: user.displayName || user.name || char.name || "Operative",
    applicantAvatar: user.customAvatar || user.profileGif || user.avatar || char.userAvatar || "",
    applicantEffect: user.effect || char.effect || "none",
  };

  let abortError: string | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const idx = cur.findIndex((l) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortError = "Offer not found or expired.";
      return undefined;
    }
    const lobby = cur[idx];
    if (String(lobby.ownerId) === uid) {
      abortError = "You cannot apply to your own offer.";
      return undefined;
    }
    if ((lobby.status || "standby") !== "standby") {
      abortError = "This offer is no longer open.";
      return undefined;
    }
    const applicants = lobby.applicants || [];
    const accepted = lobby.accepted || [];
    if (applicants.some((a: any) => memberId(a) === uid)) {
      abortError = "You already applied to this offer.";
      return undefined;
    }
    if (accepted.some((a: any) => memberId(a) === uid)) {
      abortError = "You are already in this squad.";
      return undefined;
    }
    cur[idx] = { ...lobby, applicants: [...applicants, nextApplicant] };
    return cur;
  });

  if (!res.ok) return { ok: false as const, error: abortError || "Could not apply — try again." };

  const lobby = (res.value || []).find((l: any) => String(l.id) === String(lobbyId));
  return { ok: true as const, lobby, applicantName: nextApplicant.applicantName };
}

export async function confirmInviteFromDiscord(discordUserId: string, lobbyId: string, notifId: string) {
  const { registeredUsers, notifications } = await loadLobbyData();
  const notif = notifications.find((n) => String(n.id) === String(notifId));
  if (!notif) return { ok: false as const, error: "Invite expired." };

  const uid = String(discordUserId);
  const user = registeredUsers.find((u) => String(u.id) === uid);
  const handle = user?.username || "";
  if (!notificationMatchesUser(notif, uid, handle, registeredUsers)) {
    return { ok: false as const, error: "This invite is not for you." };
  }

  let abortError: string | null = null;
  const notifApplicantData = notif.applicantData;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const idx = cur.findIndex((l) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortError = "Offer not found.";
      return undefined;
    }
    const lobby = cur[idx];
    const invitedMember =
      (lobby.accepted || []).find((a: any) => memberIdentityKey(a) === uid && a.status === "invited") ||
      (lobby.applicants || []).find((a: any) => memberIdentityKey(a) === uid) ||
      notifApplicantData;
    if (!invitedMember) {
      abortError = "Invite slot not found.";
      return undefined;
    }
    const enriched = { ...invitedMember, ...(notifApplicantData || {}) };
    const updated = acceptApplicantAcrossLobbies(cur, lobbyId, enriched);
    return updated;
  });

  if (!res.ok) return { ok: false as const, error: abortError || "Could not accept invite — try again." };

  const updatedNotifs = notifications.filter((n) => String(n.id) !== String(notifId));
  await setKV("notifications", updatedNotifs);

  return { ok: true as const };
}

export async function declineInviteFromDiscord(discordUserId: string, lobbyId: string, notifId: string) {
  const { registeredUsers, notifications } = await loadLobbyData();
  const notif = notifications.find((n) => String(n.id) === String(notifId));
  if (!notif) return { ok: false as const, error: "Invite expired." };

  const uid = String(discordUserId);
  const user = registeredUsers.find((u) => String(u.id) === uid);
  const handle = user?.username || "";
  if (!notificationMatchesUser(notif, uid, handle, registeredUsers)) {
    return { ok: false as const, error: "This invite is not for you." };
  }

  let abortError: string | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const cur = Array.isArray(lobbies) ? [...lobbies] : [];
    const idx = cur.findIndex((l) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortError = "Offer not found.";
      return undefined;
    }
    const lobby = cur[idx];
    const invitedMember = (lobby.accepted || []).find(
      (a: any) => memberIdentityKey(a) === uid && a.status === "invited"
    );
    if (invitedMember) {
      cur[idx] = repairLobbyRoles(cancelLobbyInvite(lobby, invitedMember));
    } else if ((lobby.applicants || []).some((a: any) => memberIdentityKey(a) === uid)) {
      cur[idx] = {
        ...lobby,
        applicants: (lobby.applicants || []).filter((a: any) => memberIdentityKey(a) !== uid),
      };
    }
    return cur;
  });

  if (!res.ok) return { ok: false as const, error: abortError || "Could not decline invite — try again." };

  const updatedNotifs = notifications.filter((n) => String(n.id) !== String(notifId));
  await setKV("notifications", updatedNotifs);

  return { ok: true as const };
}
