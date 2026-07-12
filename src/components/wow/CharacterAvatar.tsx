"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const avatarCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export default function CharacterAvatar({
  name, realm, region, specIcon, classColor, size = 36, free = false, clippedHeight,
}: {
  name: string; realm: string; region: string; specIcon: string; classColor: string; size?: number; free?: boolean; clippedHeight?: number;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!realm) { setFailed(true); return; }

    let cancelled = false;
    setFailed(false);
    setImgUrl(null);

    const cacheKey = `${region}/${realm}/${name}`.toLowerCase();
    const cached = avatarCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setImgUrl(cached.url);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    async function load() {
      try {
        const res = await fetch(
          `/api/wow/blizzard/character?name=${encodeURIComponent(name)}&realm=${encodeURIComponent(realm)}&region=${region}`,
          { signal: controller.signal }
        );
        clearTimeout(timer);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.available && data.render) {
            const r = data.render;
            const url = free ? (r.inset || r.avatar || r.mainRaw || r.main)
                       : (r.mainRaw || r.main || r.inset || r.avatar);
            if (url) {
              avatarCache.set(cacheKey, { url, ts: Date.now() });
              if (!cancelled) { setImgUrl(url); return; }
            }
          }
        }
      } catch {}
      if (!cancelled) setFailed(true);
    }

    load();
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [name, realm, region, free]);

  if (failed || !realm) {
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Image src={specIcon} alt="" width={size} height={size} className="shrink-0" style={{ backgroundColor: `${classColor}25`, boxShadow: `0 0 12px ${classColor}15` }} />
      </div>
    );
  }

  if (free) {
    const h = Math.round(size * 1.25);
    return (
      <div className="relative shrink-0 overflow-hidden" style={{ width: size, height: h }}>
        {imgUrl ? (
          <img src={imgUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} onError={() => setFailed(true)} />
        ) : (
          <Image src={specIcon} alt="" width={size} height={size} className="shrink-0" style={{ backgroundColor: `${classColor}25`, boxShadow: `0 0 12px ${classColor}15` }} />
        )}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 ${clippedHeight ? "rounded-lg" : ""}`} style={{ width: size, height: clippedHeight || size, overflow: clippedHeight ? "hidden" : undefined }}>
      {imgUrl ? (
        <img src={imgUrl} alt="" width={size} height={size} className="rounded-lg object-cover w-full" style={{ minWidth: size, minHeight: size, objectPosition: "center top" }} onError={() => setFailed(true)} />
      ) : (
        <Image src={specIcon} alt="" width={size} height={size} className="rounded-lg shrink-0" style={{ backgroundColor: `${classColor}25`, boxShadow: `0 0 12px ${classColor}15` }} />
      )}
    </div>
  );
}
