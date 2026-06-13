"use client";

import { useState, useEffect, useRef } from "react";

export const AUTO_ACCEPT_DURATION_MS = 10 * 60 * 1000;

const AutoAcceptTimer = ({ endTime, onExpire, showBar = false }: { endTime: number; onExpire: () => void; showBar?: boolean }) => {
   const [remaining, setRemaining] = useState(0);
   const onExpireRef = useRef(onExpire);
   const expiredRef = useRef(false);

   useEffect(() => {
      onExpireRef.current = onExpire;
   }, [onExpire]);

   useEffect(() => {
      expiredRef.current = false;
      const tick = () => {
         const diff = Math.max(0, endTime - Date.now());
         setRemaining(diff);
         if (diff <= 0 && !expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current();
         }
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
   }, [endTime]);

   const m = Math.floor(remaining / 60000);
   const s = Math.floor((remaining % 60000) / 1000);
   const display = `${m}:${s.toString().padStart(2, "0")}`;
   const progress = Math.max(0, Math.min(100, (remaining / AUTO_ACCEPT_DURATION_MS) * 100));

    if (!showBar) return <span className="text-[#00ffff] font-black text-sm tabular-nums">{display}</span>;

   return (
      <div className="space-y-2">
         <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Session Remaining</span>
         <span className="block text-base font-black tabular-nums text-[#00ffff] drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] text-center">{display}</span>
         <div className="h-3 w-full overflow-hidden rounded-full border border-[#00d4ff]/20 bg-black/60">
            <div
               className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] via-[#8a2be2] to-[#ff007f] shadow-[0_0_16px_rgba(0,212,255,0.35)] transition-all duration-1000"
               style={{ width: `${progress}%` }}
            />
         </div>
      </div>
   );
};

export default AutoAcceptTimer;
