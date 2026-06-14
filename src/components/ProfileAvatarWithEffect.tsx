"use client";

import { useState, useEffect } from "react";

type Props = {
  src: string;
  effect?: string;
  className?: string;
  electricColor?: number;
  fallbackName?: string;
};

export default function ProfileAvatarWithEffect({
  src,
  effect = "none",
  className = "w-14 h-14",
  electricColor: electricColorProp,
  fallbackName = "U",
}: Props) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const [electricColorLocal] = useState(() => {
    try { return parseInt(localStorage.getItem("UL_ELECTRIC_COLOR") || "0"); } catch { return 0; }
  });

  const electricColor = electricColorProp ?? electricColorLocal;
  const displaySrc =
    imgSrc?.trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=0b1020&color=00ffff&size=128`;
  const isGif = /\.gif(\?|$)/i.test(displaySrc);

  return (
    <div className={`relative shrink-0 overflow-visible flex items-center justify-center ${className}`}>
      <div className="rounded-full relative z-10 bg-black w-full h-full flex items-center justify-center overflow-hidden aspect-square border-2 border-white/10 shadow-inner">
        <img
          src={displaySrc}
          className={`w-full h-full ${isGif ? "object-contain" : "object-cover"}`}
          alt=""
          onError={() => {
            setImgSrc(
              `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=0b1020&color=00ffff&size=128`
            );
          }}
        />
      </div>
      {effect === "electric_circle" && (
        <div
          className="absolute pointer-events-none rounded-full overflow-visible"
          style={{ width: "132%", height: "132%", left: "-16%", top: "-16%", zIndex: 30 }}
        >
          <iframe src={`/effects/electric-circle.html?color=${electricColor}`} className="w-full h-full border-0 pointer-events-none" title="" />
        </div>
      )}
    </div>
  );
}
