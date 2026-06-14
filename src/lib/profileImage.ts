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

export function resolveProfileDisplayName(user: any, fallback = "Member"): string {
  return user?.displayName || user?.name || fallback;
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
