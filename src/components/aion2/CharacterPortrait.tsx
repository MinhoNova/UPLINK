"use client";
import { useState } from "react";

/** In-game character portrait (already routed through the site proxy).
 *  Retries once with a cache-bust param (old Cloudflare-broken caches),
 *  then hides so the caller's fallback box is what the user sees. */
export default function CharacterPortrait({
  src,
  className = "",
  alt = "",
  title = "",
}: {
  src?: string | null;
  className?: string;
  alt?: string;
  title?: string;
}) {
  const [tryCount, setTryCount] = useState(0);
  const [gone, setGone] = useState(!src);
  if (!src || gone) return null;
  const base = String(src);
  const finalSrc =
    tryCount === 0
      ? base
      : `${base}${base.includes("?") ? "&" : "?"}r=${Date.now()}`;
  return (
    <img
      src={finalSrc}
      alt={alt}
      title={title}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (tryCount === 0) setTryCount(1);
        else setGone(true);
      }}
    />
  );
}