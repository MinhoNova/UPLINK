"use client";

import { useState } from "react";
import Image from "next/image";

export default function CharacterAvatar({
  name, realm, region, specIcon, classColor, size = 36,
}: {
  name: string; realm: string; region: string; specIcon: string; classColor: string; size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const regionLower = region?.toLowerCase() || "us";
  const realmSlug = realm?.toLowerCase().replace(/\s+/g, "-") || "unknown";
  const renderUrl = `https://render.worldofwarcraft.com/${regionLower}/character/${realmSlug}/${encodeURIComponent(name.toLowerCase())}-inset.jpg`;

  if (failed) {
    return (
      <Image src={specIcon} alt="" width={size} height={size} className="rounded-lg shrink-0" style={{ backgroundColor: `${classColor}25`, boxShadow: `0 0 12px ${classColor}15` }} />
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <img
        src={renderUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-lg object-cover w-full h-full"
        style={{ minWidth: size, minHeight: size }}
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 rounded-lg" style={{ border: `1px solid ${classColor}30`, boxShadow: `inset 0 0 0 1px ${classColor}20` }} />
    </div>
  );
}
