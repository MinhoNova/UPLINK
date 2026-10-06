import { getKV, setKV, initTables, updateKVAtomic } from "@/lib/db";
import {
  acceptApplicantAcrossLobbies,
  cancelLobbyInvite,
  memberIdentityKey,
  repairLobbyRoles,
} from "@/lib/lobbyLifecycle";
import { notificationMatchesUser } from "@/lib/userProfile";
import { checkAndRecordOfferApply } from "@/lib/offerDailyLimit";
import { trustCharacterStats } from "@/lib/characterStatsSig";
import {
  checkOfferRequirements,
  describeRequirementFailures,
  hasOfferRequirements,
  readOfferRequirements,
} from "@/lib/offerRequirements";
import { isUserBanned } from "@/lib/banCheck";

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

   const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").replace(/\/+$/, "");
   const applyPage = `${siteUrl}/apply/${encodeURIComponent(lobbyId)}`;
   const user = registeredUsers.find((u) => String(u.id) === String(discordUserId));
   if (!user) {
      return {
         ok: false as const,
         error: `Sign in with Discord on UPLINK and add your character, then apply — ${applyPage}`,
      };
   }

   // The web apply route runs this inside `requireSession`. Discord's button
   // bypassed it, so a suspended account could still apply from a stale embed.
   if (await isUserBanned(user.username, user.id)) {
      return { ok: false as const, error: "Your account is suspended. Contact support if this is a mistake." };
   }

   const uid = String(discordUserId);

   // Collect every character this account owns instead of taking the first one.
   // `find` handed the applicant whichever row happened to be first, so someone
   // with a level 20 alt and a level 80 main could silently apply on the alt, and
   // the per-character `game:<charId>` dedupe in the web route never ran here —
   // which is exactly how the same character ends up on two squads.
   const owned = characters.filter(
      (c) =>
         String(c.userId) === uid ||
         String(c.userName || "").toLowerCase() === String(user.username || "").toLowerCase(),
   );

   if (owned.length === 0) {
      return {
         ok: false as const,
         error: `You have no character on UPLINK yet. Add one, then apply — ${applyPage}`,
      };
   }

   const eligible = owned.filter((c) => Number(c.level ?? c.applicantLevel ?? 0) >= 45);
   if (eligible.length === 0) {
      const best = owned.reduce((m, c) =>
         Number(c.level ?? c.applicantLevel ?? 0) > Number(m.level ?? m.applicantLevel ?? 0) ? c : m,
      );
      return {
         ok: false as const,
         error: `Boosting offers require Level 45+ — your best character is Level ${best.level || best.applicantLevel || "?"}. Add a higher one here: ${applyPage}`,
      };
   }

   if (eligible.length > 1) {
      // Ambiguous, so stop rather than guess. Guessing is what caused the bug
      // above; the apply page is where the player picks on purpose.
      return {
         ok: false as const,
         error: `You have ${eligible.length} characters at Level 45+ (${eligible
            .map((c: any) => c.name || "unnamed")
            .join(", ")}). Pick the one you want to bring: ${applyPage}`,
      };
   }

   const char = eligible[0];

   // Gear requirements — the bot is a third door into `lobby.applicants`, and it
   // picks the character for the player rather than letting them choose. Without
   // this gate a Discord player joins offers the site had just refused them
   // through the browser.
   //
   // Verified here, before the write, because `updateKVAtomic` is synchronous. The
   // comparison itself still happens inside it against the requirements on the row
   // actually being written, so an owner raising the bar mid-request cannot be
   // slipped past by this earlier read.
   const trustedStats = await trustCharacterStats(char, uid);

  const limitCheck = await checkAndRecordOfferApply(uid, false);
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
    // Requirements read from the row being written, not the pre-write copy.
    const required = readOfferRequirements(lobby);
    if (hasOfferRequirements(required)) {
      const verdict = checkOfferRequirements(required, trustedStats);
      if (!verdict.ok) {
        abortError = describeRequirementFailures(verdict.failures);
        return undefined;
      }
    }
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
