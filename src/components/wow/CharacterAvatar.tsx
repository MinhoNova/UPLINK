"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function CharacterAvatar({
  name, realm, region, specIcon, classColor, size = 36,
}: {
  name: string; realm: string; region: string; specIcon: string; classColor: string; size?: number;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "failed">("loading");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!realm) { setStatus("failed"); return; }

    let cancelled = false;
    setStatus("loading");
    setImgUrl(null);

    async function load() {
      // 1. Try official Blizzard API first (most reliable)
      try {
        const res = await fetch(
          `/api/wow/blizzard/character?name=${encodeURIComponent(name)}&realm=${encodeURIComponent(realm)}&region=${region}`
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.available && data.render?.main) {
            setImgUrl(data.render.main);
            setStatus("ok");
            return;
          }
        }
      } catch {}

      // 2. Fallback: CDN direct URLs
      if (!cancelled) {
        const realmSlug = realm.toLowerCase().replace(/\s+/g, "-").replace(/['']/g, "");
        const n = name.toLowerCase().replace(/'/g, "");
        const r = region.toLowerCase();
        const cdnUrls = [
          `https://render.worldofwarcraft.com/${r}/character/${realmSlug}/${n}-main.jpg`,
          `https://render.worldofwarcraft.com/${r}/character/${realmSlug}/${n}-inset.jpg`,
        ];

        // Try each CDN URL by loading into an image
        for (const url of cdnUrls) {
          try {
            const ok = await new Promise<boolean>((resolve) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = url;
            });
            if (!cancelled && ok) {
              setImgUrl(url);
              setStatus("ok");
              return;
            }
          } catch {}
        }
      }

      if (!cancelled) setStatus("failed");
    }

    load();
    return () => { cancelled = true; };
  }, [name, realm, region]);

  if (status === "loading" && !imgUrl) {
    return (
      <div className="relative shrink-0 rounded-lg overflow-hidden animate-pulse" style={{ width: size, height: size, backgroundColor: `${classColor}15` }} />
    );
  }

  if (status === "failed" || !imgUrl) {
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Image src={specIcon} alt="" width={size} height={size} className="rounded-lg shrink-0" style={{ backgroundColor: `${classColor}25`, boxShadow: `0 0 12px ${classColor}15` }} />
        <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ border: `1px solid ${classColor}30` }} />
      </div>
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size, backgroundColor: `${classColor}10` }}>
      <img src={imgUrl} alt="" width={size} height={size} className="rounded-lg object-cover w-full h-full" style={{ minWidth: size, minHeight: size }} onError={() => !mountedRef.current && setStatus("failed")} />
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ border: `1px solid ${classColor}30`, boxShadow: `inset 0 0 6px ${classColor}20` }} />
    </div>
  );
}
