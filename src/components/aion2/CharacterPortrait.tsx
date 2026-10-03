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

/** In-game character portrait.
 *
 *  Loads the plaync URL straight from the visitor's browser first and only falls
 *  back to the site proxy. That order is the whole point of this component.
 *
 *  The proxy was tried first once, and it could never work: `profileimg.plaync.com`
 *  is served by Envoy behind Google Frontend (`Via: 1.1 google`, `x-envoy-upstream-service-time`),
 *  which bot-filters datacenter egress. Verified in production — the proxy route
 *  answered 502 "portrait unavailable" for a URL that answers 200 / image/jpeg /
 *  31,291 bytes from a residential IP, and an identical `fetch` from local Node
 *  (same URL, same User-Agent, same redirect handling) succeeded. The origin
 *  returns a stub to Cloudflare's ranges, so the proxy renders every portrait
 *  blank no matter what headers we send.
 *
 *  The official site loads these images as plain `<img>` tags from the player's
 *  own browser, which is exactly what this now does first. The proxy stays as a
 *  fallback for the rare client that genuinely cannot reach plaync, and the
 *  caller's neutral silhouette is the last resort.
 */
export default function CharacterPortrait({
  src,
  className = "",
  alt = "",
  title = "",
  preferProxy = false,
  onLoadingChange,
}: {
  src?: string | null;
  className?: string;
  alt?: string;
  title?: string;
  preferProxy?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const raw = src ? rawUrlOf(String(src)) : "";
  const proxied = raw ? portraitProxyPath(raw) : "";
  const [mode, setMode] = useState<0 | 1 | 2>(!raw ? 2 : preferProxy && proxied ? 0 : 1);
  const [loaded, setLoaded] = useState(false);
  if (!raw || mode === 2) return null;
  // 1 = direct plaync, 0 = site proxy. A direct load is what the official page
  // does and is the only path that survives the origin's bot filter.
  const current = mode === 1 ? raw : proxied;
  // Fade in rather than paint instantly. The portrait comes from a different
  // origin than the page, so there is a real DNS + TLS + TTFB wait behind it and
  // a hard swap out of the caller's placeholder reads as a black disc flashing
  // into a face. Holding opacity at 0 until `load` lets whatever the caller has
  // underneath stay visible the whole time.
  return (
    <img
      src={current}
      alt={alt}
      title={title}
      className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300 ease-out`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => {
        setLoaded(true);
        onLoadingChange?.(false);
      }}
      onError={() => {
        // Reset before switching sources, otherwise a successful proxy load would
        // stay invisible because `loaded` was never cleared.
        setLoaded(false);
        onLoadingChange?.(true);
        if (mode === 1 && proxied) setMode(0);
        else setMode(2);
      }}
    />
  );
}