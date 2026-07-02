"use client";

import { useState } from "react";
import Image from "next/image";

const CDN_BASE = "https://render.worldofwarcraft.com";

function buildCdnUrl(region: string, realm: string, name: string, variant: string): string {
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
  const [failed, setFailed] = useState(false);
  const [tryMain, setTryMain] = useState(true);

  if (failed || !realm) {
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Image
          src={specIcon}
          alt=""
          width={size}
          height={size}
          className="rounded-lg shrink-0"
          style={{ backgroundColor: `${classColor}25`, boxShadow: `0 0 12px ${classColor}15` }}
        />
        <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ border: `1px solid ${classColor}30` }} />
      </div>
    );
  }

  const src = tryMain
    ? buildCdnUrl(region, realm, name, "main")
    : buildCdnUrl(region, realm, name, "inset");

  return (
    <div className="relative shrink-0" style={{ width: size, height: size, backgroundColor: `${classColor}10` }}>
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="rounded-lg object-cover w-full h-full"
        style={{ minWidth: size, minHeight: size }}
        onError={() => {
          if (tryMain) setTryMain(false);
          else setFailed(true);
        }}
      />
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ border: `1px solid ${classColor}30`, boxShadow: `inset 0 0 6px ${classColor}20` }} />
    </div>
  );
}
