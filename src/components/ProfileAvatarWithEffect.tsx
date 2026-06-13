"use client";

import { useState } from "react";

type Props = {
  src: string;
  effect?: string;
  className?: string;
  electricColor?: number;
};

export default function ProfileAvatarWithEffect({
  src,
  effect = "none",
  className = "w-14 h-14",
  electricColor: electricColorProp,
}: Props) {
  const [electricColorLocal] = useState(() => {
    try { return parseInt(localStorage.getItem("UL_ELECTRIC_COLOR") || "0"); } catch { return 0; }
  });

  const electricColor = electricColorProp ?? electricColorLocal;
  const isGif = /\.gif(\?|$)/i.test(src);

  return (
    <div className={`relative shrink-0 overflow-visible flex items-center justify-center ${className}`}>
      <div className="rounded-full relative z-10 bg-black w-full h-full flex items-center justify-center overflow-hidden aspect-square border-2 border-white/10 shadow-inner">
        <img src={src} className={`w-full h-full ${isGif ? "object-contain" : "object-cover"}`} alt="" />
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
