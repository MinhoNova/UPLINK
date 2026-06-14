import { getKVPairs, setKV, initTables } from "@/lib/db";
import {
  acceptApplicantAcrossLobbies,
  cancelLobbyInvite,
  confirmApplicantJoin,
  inviteApplicantToLobby,
  memberIdentityKey,
  repairLobbyRoles,
} from "@/lib/lobbyLifecycle";
import { notificationMatchesUser } from "@/lib/userProfile";
import { checkAndRecordOfferAction } from "@/lib/offerDailyLimit";

function memberId(member: { applicantId?: string; userId?: string; id?: string }) {
  return String(member.applicantId || member.userId || member.id || "");
}

export async function applyToLobbyFromDiscord(discordUserId: string, lobbyId: string) {
  await initTables();
  const data = await getKVPairs();
  const registeredUsers: any[] = data.registeredUsers || [];
  const characters: any[] = data.characters || [];
  const lobbies: any[] = Array.isArray(data.lobbies) ? [...data.lobbies] : [];

  const user = registeredUsers.find((u) => String(u.id) === String(discordUserId));
  if (!user) {
    return { ok: false as const, error: "Link your account on UPLINK first (Sign in with Discord on the site)." };
  }

  const idx = lobbies.findIndex((l) => String(l.id) === String(lobbyId));
  if (idx === -1) return { ok: false as const, error: "Offer not found or expired." };

  const lobby = lobbies[idx];
  if (String(lobby.ownerId) === String(discordUserId)) {
    return { ok: false as const, error: "You cannot apply to your own offer." };
  }
  if ((lobby.status || "standby") !== "standby") {
    return { ok: false as const, error: "This offer is no longer open." };
  }

  const uid = String(discordUserId);
  const applicants = lobby.applicants || [];
  const accepted = lobby.accepted || [];
  if (applicants.some((a: any) => memberId(a) === uid)) {
    return { ok: false as const, error: "You already applied to this offer." };
  }
  if (accepted.some((a: any) => memberId(a) === uid)) {
    return { ok: false as const, error: "You are already in this squad." };
  }

  const char =
    characters.find((c) => String(c.userId) === uid) ||
    characters.find((c) => String(c.userName || "").toLowerCase() === String(user.username || "").toLowerCase());

  if (!char) {
    return {
      ok: false as const,
      error: "Sync a character on UPLINK first (Armory → Raider.io), then apply from Discord.",
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

  lobbies[idx] = { ...lobby, applicants: [...applicants, nextApplicant] };
  await setKV("lobbies", lobbies);

  return { ok: true as const, lobby: lobbies[idx], applicantName: nextApplicant.applicantName };
}

export async function confirmInviteFromDiscord(discordUserId: string, lobbyId: string, notifId: string) {
  await initTables();
  const data = await getKVPairs();
  const lobbies: any[] = Array.isArray(data.lobbies) ? [...data.lobbies] : [];
  const notifications: any[] = data.notifications || [];
  const notif = notifications.find((n) => String(n.id) === String(notifId));
  if (!notif) return { ok: false as const, error: "Invite expired." };

  const uid = String(discordUserId);
  const registeredUsers: any[] = data.registeredUsers || [];
  const user = registeredUsers.find((u) => String(u.id) === uid);
  const handle = user?.username || "";
  if (!notificationMatchesUser(notif, uid, handle, registeredUsers)) {
    return { ok: false as const, error: "This invite is not for you." };
  }

  const idx = lobbies.findIndex((l) => String(l.id) === String(lobbyId));
  if (idx === -1) return { ok: false as const, error: "Offer not found." };

  const lobby = lobbies[idx];
  const invitedMember =
    (lobby.accepted || []).find((a: any) => memberIdentityKey(a) === uid && a.status === "invited") ||
    (lobby.applicants || []).find((a: any) => memberIdentityKey(a) === uid) ||
    notif.applicantData;

  if (!invitedMember) return { ok: false as const, error: "Invite slot not found." };

  const enriched = { ...invitedMember, ...(notif.applicantData || {}) };
  const updated = acceptApplicantAcrossLobbies(lobbies, lobbyId, enriched);
  const updatedNotifs = notifications.filter((n) => String(n.id) !== String(notifId));
  await setKV("lobbies", updated);
  await setKV("notifications", updatedNotifs);

  return { ok: true as const };
}

export async function declineInviteFromDiscord(discordUserId: string, lobbyId: string, notifId: string) {
  await initTables();
  const data = await getKVPairs();
  let lobbies: any[] = Array.isArray(data.lobbies) ? [...data.lobbies] : [];
  const notifications: any[] = data.notifications || [];
  const uid = String(discordUserId);

  const idx = lobbies.findIndex((l) => String(l.id) === String(lobbyId));
  if (idx === -1) return { ok: false as const, error: "Offer not found." };

  const lobby = lobbies[idx];
  const invitedMember = (lobby.accepted || []).find(
    (a: any) => memberIdentityKey(a) === uid && a.status === "invited"
  );

  if (invitedMember) {
    lobbies[idx] = repairLobbyRoles(cancelLobbyInvite(lobby, invitedMember));
  } else {
    lobbies[idx] = {
      ...lobby,
      applicants: (lobby.applicants || []).filter((a: any) => memberIdentityKey(a) !== uid),
    };
  }

  const updatedNotifs = notifications.filter((n) => String(n.id) !== String(notifId));
  await setKV("lobbies", lobbies);
  await setKV("notifications", updatedNotifs);

  return { ok: true as const };
}
