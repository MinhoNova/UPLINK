"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const CDN_BASE = "https://render.worldofwarcraft.com";

function buildCdnUrl(region: string, realm: string, name: string, variant: "main" | "inset"): string {
  const r = region.toLowerCase();
  const realmSlug = realm.toLowerCase().replace(/\s+/g, "-").replace(/['']/g, "");
  const n = name.toLowerCase().replace(/'/g, "");
  return `${CDN_BASE}/${r}/character/${realmSlug}/${n}-${variant}.jpg`;
}

export default function CharacterAvatar({
  name, realm, region, specIcon, classColor, size = 36,
}: {
  name: string; realm: string; region: string; specIcon: string; classColor: string; size?: number;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setImgUrl(null);

    async function tryFetch() {
      if (!realm) { setStatus("failed"); return; }

      const patterns = [
        buildCdnUrl(region, realm, name, "main"),
        buildCdnUrl(region, realm, name, "inset"),
      ];

      for (const url of patterns) {
        try {
          const res = await fetch(url, { method: "HEAD" });
          if (res.ok && !cancelled) { setImgUrl(url); setStatus("ok"); return; }
        } catch {}
      }

      try {
        const apiRes = await fetch(`/api/wow/blizzard/character?name=${encodeURIComponent(name)}&realm=${encodeURIComponent(realm)}&region=${region}`);
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data.available && !cancelled) { setImgUrl(data.url); setStatus("ok"); return; }
        }
      } catch {}

      if (!cancelled) setStatus("failed");
    }

    tryFetch();
    return () => { cancelled = true; };
  }, [name, realm, region]);

  if (status === "loading") {
    return (
      <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: size, height: size, background: `${classColor}15` }}>
        <div className="w-full h-full animate-pulse" style={{ background: `linear-gradient(135deg, ${classColor}00 0%, ${classColor}20 50%, ${classColor}00 100%)`, backgroundSize: "200% 200%", animation: "shimmer 1.5s ease-in-out infinite" }} />
      </div>
    );
  }

  if (status === "failed" || !imgUrl) {
    return (
      <Image
        src={specIcon}
        alt=""
        width={size}
        height={size}
        className="rounded-lg shrink-0"
        style={{ backgroundColor: `${classColor}25`, boxShadow: `0 0 12px ${classColor}15` }}
      />
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <img
        src={imgUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-lg object-cover w-full h-full"
        style={{ minWidth: size, minHeight: size, backgroundColor: `${classColor}10` }}
        onError={() => setStatus("failed")}
      />
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ border: `1px solid ${classColor}30`, boxShadow: `inset 0 0 8px ${classColor}20` }} />
    </div>
  );
}
