"use client";

import { useEffect, useState } from "react";
import { HERO_BG_DEFAULT } from "./heroBg";

/**
 * Client-side read of the site-wide backdrop setting.
 *
 * Server-rendered pages get this for free as a prop. Client-only pages (the
 * community hub) have no server pass, and previously either guessed "scenic" or
 * hand-rolled their own background — which is how the club quietly drifted
 * away from the lobby's look.
 *
 * The promise is module-level so several components on one page share a single
 * request, and a failed read resolves to the default instead of leaving the
 * page without a backdrop.
 */
let cached: Promise<string> | null = null;

function readHeroBg(): Promise<string> {
  if (cached) return cached;
  cached = fetch("/api/site/hero-bg", { credentials: "include" })
    .then((r) => (r.ok ? r.json() : { bg: HERO_BG_DEFAULT }))
    .then((d: any) => String(d?.bg || HERO_BG_DEFAULT))
    .catch(() => HERO_BG_DEFAULT);
  return cached;
}

export function useHeroBg(): string {
  const [bg, setBg] = useState<string>(HERO_BG_DEFAULT);
  useEffect(() => {
    let alive = true;
    readHeroBg().then((v) => {
      if (alive) setBg(v);
    });
    return () => {
      alive = false;
    };
  }, []);
  return bg;
}
