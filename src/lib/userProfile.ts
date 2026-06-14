/** Secret Club profile helpers — subscription perks and notification routing. */

export function isSecretClubTier(user: any): boolean {
  if (!user) return false;
  if (String(user.id) === "1497295886223544471") return true;
  const sub = user.subscription;
  if (!sub || sub.tier !== "secret_club") return false;
  if (sub.endDate && Date.now() > sub.endDate) return false;
  return true;
}

/** Strip paid cosmetics when subscription is revoked or expires. */
export function revokeSecretClubPerks(user: any): any {
  if (!user) return user;
  const next = { ...user };
  delete next.profileGif;
  delete next.profileGifThumb;
  delete next.customAvatar;
  delete next.activeVfx;
  next.effect = "none";
  return next;
}

export function grantSecretClubSubscription(user: any, days = 30): any {
  const now = Date.now();
  return {
    ...user,
    subscription: {
      tier: "secret_club" as const,
      startDate: now,
      endDate: now + days * 24 * 60 * 60 * 1000,
    },
  };
}

/** Extend or start Secret Club by calendar months (30 days each). */
export function extendSecretClubSubscription(user: any, months: number): any {
  const days = months * 30;
  const now = Date.now();
  const sub = user?.subscription;
  const base =
    sub?.tier === "secret_club" && sub.endDate && sub.endDate > now ? sub.endDate : now;
  return {
    ...user,
    subscription: {
      tier: "secret_club" as const,
      startDate: sub?.startDate && sub.startDate < now ? sub.startDate : now,
      endDate: base + days * 24 * 60 * 60 * 1000,
    },
  };
}

export function getSubscriptionDaysLeft(user: any): number | null {
  if (!user?.subscription) return null;
  if (user.subscription.tier !== "secret_club") return 0;
  const end = user.subscription.endDate;
  if (!end) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function effectiveAvatarEffect(user: any, effect = "none"): string {
  if (!isSecretClubTier(user)) return "none";
  if (effect && effect !== "none") return effect;
  return user?.effect || "none";
}

export function effectiveProfileGif(user: any): string | null {
  if (!isSecretClubTier(user)) return null;
  return user?.profileGif || null;
}

/** Discord handle for lobby invite notifications (must match invitee session username). */
export function resolveNotificationRecipient(
  applicant: any,
  registeredUsers: any[] = []
): string {
  const uid = String(applicant?.applicantId || applicant?.userId || "");
  const matched = uid
    ? registeredUsers.find((u) => String(u.id) === uid)
    : registeredUsers.find(
        (u) =>
          (u.username || "").toLowerCase() ===
            String(applicant?.applicantDiscordHandle || applicant?.discordName || "").toLowerCase() ||
          (u.name || "").toLowerCase() === String(applicant?.applicantName || applicant?.name || "").toLowerCase()
      );
  return (
    matched?.username ||
    applicant?.applicantDiscordHandle ||
    applicant?.discordName ||
    applicant?.applicantName ||
    applicant?.name ||
    ""
  );
}

export function notificationMatchesUser(
  notif: any,
  userId: string,
  handle: string,
  registeredUsers: any[] = []
): boolean {
  const to = String(notif?.toUser || "").toLowerCase().trim();
  const h = String(handle || "").toLowerCase().trim();
  if (to && h && to === h) return true;

  const self = registeredUsers.find((u) => String(u.id) === String(userId));
  if (!self) return false;

  const aliases = new Set(
    [self.username, self.name, self.discordDisplayName, self.displayName]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase().trim())
  );
  return to ? aliases.has(to) : false;
}

/** Merge polled server profile with local self row (avoid wiping in-flight GIF/name saves). */
export function mergeRegisteredUsersFromServer(
  serverUsers: any[],
  localUsers: any[],
  userId: string,
  saveInFlight = false
): any[] {
  if (!Array.isArray(serverUsers)) return localUsers;
  if (saveInFlight) return localUsers;

  const localSelf = localUsers.find((u) => String(u.id) === String(userId));
  if (!localSelf) return serverUsers;

  return serverUsers.map((u) => {
    if (String(u.id) !== String(userId)) return u;
    return {
      ...u,
      name: u.name || localSelf.name,
      displayName: u.displayName || localSelf.displayName,
      discordDisplayName: u.discordDisplayName || localSelf.discordDisplayName,
      profileGif:
        u.profileGif && String(u.profileGif).trim()
          ? u.profileGif
          : localSelf.profileGif === null
            ? undefined
            : localSelf.profileGif,
      profileGifThumb:
        u.profileGifThumb && String(u.profileGifThumb).trim()
          ? u.profileGifThumb
          : localSelf.profileGifThumb === null
            ? undefined
            : localSelf.profileGifThumb,
      customAvatar: u.customAvatar || localSelf.customAvatar,
      effect: u.effect && u.effect !== "none" ? u.effect : localSelf.effect,
      activeVfx: u.activeVfx || localSelf.activeVfx,
      battleTag: u.battleTag || localSelf.battleTag,
      subscription: u.subscription || localSelf.subscription,
      offerDrafts: (u.offerDrafts?.length ? u.offerDrafts : localSelf.offerDrafts) || [],
    };
  });
}
