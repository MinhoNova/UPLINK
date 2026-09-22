"use client";
import { useState } from "react";

/** Renders the live game character portrait (already routed through the site proxy).
 *  Renders nothing when there is no src or the image fails to load. */
export default function GamePortrait({
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
  const [gone, setGone] = useState(false);
  if (!src || gone) return null;
  return (
    <img
      src={String(src)}
      alt={alt}
      title={title}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setGone(true)}
    />
  );
}