"use client";
import { useState } from "react";
import { portraitProxyPath } from "@/lib/aion2ClassIds";

/** Extract the raw plaync URL out of a stored `/api/aion2/portrait?u=…` proxy path. */
function rawUrlOf(src: string): string {
  if (src.startsWith("/api/aion2/portrait?u=")) {
    try {
      const u = new URL(window.location.origin + src).searchParams.get("u") || "";
      return u ? decodeURIComponent(u) : src;
    } catch {
      return src;
    }
  }
  return src;
}

/** In-game character portrait. Tries the site proxy first, then falls back to
 *  the direct plaync URL (same behaviour as the /character page), then hides so
 *  the caller's letter fallback is what the user sees. */
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
  const raw = src ? rawUrlOf(String(src)) : "";
  const proxied = raw ? portraitProxyPath(raw) : "";
  const [mode, setMode] = useState<0 | 1 | 2>(proxied ? 0 : raw ? 1 : 2);
  if (!raw || mode === 2) return null;
  const current = mode === 0 ? proxied : raw;
  return (
    <img
      src={current}
      alt={alt}
      title={title}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (mode === 0 && raw) setMode(1);
        else setMode(2);
      }}
    />
  );
}