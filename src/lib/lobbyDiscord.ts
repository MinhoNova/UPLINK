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
  NO_REQUIREMENTS,
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
  const lobbies: any[] = (await getKV("lobbies")) || [];
  return { registeredUsers, characters, notifications, lobbies };
}

export async function applyToLobbyFromDiscord(discordUserId: string, lobbyId: string) {
   const { registeredUsers, characters } = await loadLobbyData();

   const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").replace(/\/+$/, "");
   const applyPage = `${siteUrl}/apply/${encodeURIComponent(lobbyId)}`;
   const myCharacters = `${siteUrl}/my-characters`;

   // Every Discord path that cannot finish an apply now says where to go on the
   // site instead of ending in prose. Gear refusals additionally point at the
   // character roster, which is where a player syncs the numbers the gate needs.
   const guide = (msg: string, opts: { chars?: boolean; apply?: boolean } = {}) => {
      const lines = [msg];
      if (opts.chars) lines.push(`👤 Add or sync your character: ${myCharacters}`);
      if (opts.apply) lines.push(`🎯 Apply in your browser (sign in with Discord there): ${applyPage}`);
      return lines.join("\n");
   };

   const user = registeredUsers.find((u) => String(u.id) === String(discordUserId));
   if (!user) {
      return {
         ok: false as const,
         error: guide(`Sign in with Discord on UPLINK and add your character, then apply.`, {
            apply: true,
         }),
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
         error: guide(`You have no character on UPLINK yet — add one first, then apply.`, {
            chars: true,
            apply: true,
         }),
      };
   }

   // Every offer on the site runs under the 45+ floor — leveling included — so
   // only characters of Level 45+ are ever put forward. The only per-category
   // difference is the gear requirement later: leveling offers have none, so any
   // Level 45 character is welcome there.
   const eligible = owned.filter((c) => Number(c.level ?? c.applicantLevel ?? 0) >= 45);
   if (eligible.length === 0) {
      const best = owned.reduce((m, c) =>
         Number(c.level ?? c.applicantLevel ?? 0) > Number(m.level ?? m.applicantLevel ?? 0) ? c : m,
      );
      return {
         ok: false as const,
         error: guide(
            `Offers require Level 45+ — your best character is Level ${best.level || best.applicantLevel || "?"}. Add a higher one, then apply.`,
            { chars: true, apply: true },
         ),
      };
   }

   if (eligible.length > 1) {
      // Ambiguous, so stop rather than guess. Guessing is what caused the bug
      // above; the apply page is where the player picks on purpose.
      return {
         ok: false as const,
         error: guide(
            `You have ${eligible.length} eligible characters (${eligible
               .map((c: any) => c.name || "unnamed")
               .join(", ")}). Pick the one you want to bring.`,
            { apply: true },
         ),
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
    return { ok: false as const, error: guide(limitCheck.error, { apply: true }) };
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
    // Leveling offers carry no gear requirement by design — any Level 45
    // character fits there — so numbers stored on one are ignored.
    const required =
      String(lobby.category || "").toLowerCase() === "leveling"
        ? NO_REQUIREMENTS
        : readOfferRequirements(lobby);
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

  if (!res.ok) {
    const isGear = String(abortError || "").startsWith("Cannot apply");
    return {
      ok: false as const,
      error: guide(abortError || "Could not apply — try again.", { chars: isGear, apply: true }),
    };
  }

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
