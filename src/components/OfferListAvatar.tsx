"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { isAnimatedImageUrl, resolveStaticProfileImage } from "@/lib/profileImage";

type Props = {
  src: string;
  effect?: string;
  className?: string;
  fallbackName?: string;
  userId?: string;
  registeredUsers?: any[];
};

/**
 * Lightweight avatar for the offers feed — avoids N iframes and simultaneous GIF decode.
 * Animated GIF + effect ring only activate on hover while the row is in view.
 */
export const OfferListAvatar = memo(function OfferListAvatar({
  src,
  effect = "none",
  className = "",
  fallbackName = "Operative",
  userId,
  registeredUsers,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "64px", threshold: 0.08 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const profileUser = useMemo(
    () =>
      userId && registeredUsers
        ? registeredUsers.find((u) => String(u.id) === String(userId))
        : null,
    [userId, registeredUsers]
  );

  const motionOn = inView && hovered;
  const animatedSrc = profileUser?.profileGif || src;
  const staticSrc = profileUser
    ? resolveStaticProfileImage(profileUser, fallbackName)
    : src?.trim() && !isAnimatedImageUrl(src)
      ? src
      : resolveStaticProfileImage({ name: fallbackName }, fallbackName);

  const displaySrc = motionOn && animatedSrc ? animatedSrc : staticSrc;
  const showElectric = motionOn && effect === "electric_circle";
  const isGif = isAnimatedImageUrl(displaySrc);

  return (
    <div
      ref={rootRef}
      className={`relative flex-shrink-0 flex items-center justify-center ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showElectric && (
        <div className="absolute inset-[-4px] rounded-full pointer-events-none z-0 offer-electric-ring" aria-hidden />
      )}
      <div
        className={`rounded-full relative z-10 bg-black w-full h-full flex overflow-hidden border-2 border-white/10 shadow-inner aspect-square ${
          showElectric ? "offer-electric-ring-inner" : ""
        }`}
      >
        <img
          src={displaySrc}
          alt=""
          loading="lazy"
          decoding="async"
          className={`w-full h-full rounded-full ${isGif ? "object-contain" : "object-cover"}`}
        />
      </div>
    </div>
  );
});
