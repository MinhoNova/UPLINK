import { isSecretClubTier } from "@/lib/userProfile";

/** Secret Club hidden identity — mask only on public offer party cards (not thread/DM/community). */
export function shouldHidePublicIdentity(user: any, viewerUserId?: string): boolean {
  if (!user) return false;
  if (viewerUserId && String(user.id) === String(viewerUserId)) return false;
  return isSecretClubTier(user) && user?.hiddenIdentity === true;
}

/** Resolve best profile image URL for display (GIF, custom avatar, or Discord avatar). */
export function resolveProfileImage(user: any, fallbackName = "U"): string {
  const src =
    user?.profileGif ||
    user?.customAvatar ||
    user?.avatar ||
    "";
  if (src?.trim()) return src;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || fallbackName)}&background=0b1020&color=00ffff&size=128`;
}

/** Display name only — never Discord username/handle. */
export function resolveProfileDisplayName(user: any, fallback = "Member"): string {
  return user?.displayName || user?.name || user?.discordDisplayName || fallback;
}

export type PublicAuthorFields = {
  userName: string;
  userImage: string;
  hiddenIdentity: boolean;
};

/** Author fields for community posts/comments — always show real identity. */
export function resolvePublicAuthorFields(
  user: any | undefined,
  sessionFallback?: { name?: string | null; image?: string | null }
): PublicAuthorFields {
  if (user) {
    return {
      userName: resolveProfileDisplayName(user, sessionFallback?.name || "Member"),
      userImage: resolveProfileImage(user, user.name || "U"),
      hiddenIdentity: false,
    };
  }
  return {
    userName: sessionFallback?.name || "Member",
    userImage: sessionFallback?.image || "",
    hiddenIdentity: false,
  };
}

export type ReviewProfileFields = {
  userId: string;
  userName: string;
  userImage: string;
};

export function enrichReviewWithProfile<T extends ReviewProfileFields>(
  review: T,
  user: any | undefined
): T {
  if (!user) return review;
  return {
    ...review,
    userName: resolveProfileDisplayName(user),
    userImage: resolveProfileImage(user),
  };
}

export function isAnimatedImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (/\.gif(\?|$)/i.test(trimmed)) return true;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("giphy.com") && u.pathname.includes("/media/")) return true;
    if (u.hostname.includes("tenor.com")) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function profileImgClass(url: string, base = "w-full h-full"): string {
  return `${base} ${isAnimatedImageUrl(url) ? "object-contain bg-black" : "object-cover"}`;
}

/** Static image for the offers feed — show the user's GIF (poster or full) before Discord avatar. */
export function resolveOfferFeedProfileImage(user: any, fallbackName = "U"): string {
  if (user?.profileGifThumb?.trim()) return user.profileGifThumb;
  if (user?.profileGif?.trim()) return user.profileGif;
  for (const src of [user?.customAvatar, user?.avatar]) {
    if (src?.trim() && !isAnimatedImageUrl(src)) return src;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || fallbackName)}&background=0b1020&color=00ffff&size=128&bold=true`;
}

/** Non-animated poster for off-screen offer rows (avoids N simultaneous GIF decodes). */
export function resolveStaticProfileImage(user: any, fallbackName = "U"): string {
  return resolveOfferFeedProfileImage(user, fallbackName);
}
