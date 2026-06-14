"use client";

import { memo, useMemo } from "react";
import {
  isAnimatedImageUrl,
  profileImgClass,
  resolveOfferFeedProfileImage,
} from "@/lib/profileImage";

type Props = {
  src: string;
  effect?: string;
  className?: string;
  fallbackName?: string;
  userId?: string;
  registeredUsers?: any[];
};

/**
 * Static avatar in the offers feed — animated GIF + effects show in profile/modals only.
 */
export const OfferFeedAvatar = memo(function OfferFeedAvatar({
  src,
  className = "",
  fallbackName = "Operative",
  userId,
  registeredUsers,
}: Props) {
  const profileUser = useMemo(
    () =>
      userId && registeredUsers
        ? registeredUsers.find((u) => String(u.id) === String(userId))
        : null,
    [userId, registeredUsers]
  );

  const displaySrc = useMemo(() => {
    if (profileUser) return resolveOfferFeedProfileImage(profileUser, fallbackName);
    if (src?.trim() && !isAnimatedImageUrl(src)) return src;
    return resolveOfferFeedProfileImage({ name: fallbackName }, fallbackName);
  }, [profileUser, src, fallbackName]);

  return (
    <div className={`relative flex-shrink-0 flex items-center justify-center ${className}`}>
      <div className="rounded-full relative z-10 bg-black w-full h-full flex overflow-hidden border-2 border-white/10 shadow-inner aspect-square">
        <img
          src={displaySrc}
          alt=""
          loading="lazy"
          decoding="async"
          className={`rounded-full ${profileImgClass(displaySrc, "w-full h-full")}`}
        />
      </div>
    </div>
  );
});
