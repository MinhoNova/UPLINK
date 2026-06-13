"use client";

import { useState, useRef } from "react";

const LongPressButton = ({ onClick, duration = 3000, className, children }: { onClick: () => void, duration?: number, className?: string, children: React.ReactNode }) => {
   const [isPressing, setIsPressing] = useState(false);
   const [progress, setProgress] = useState(0);
   const pressTimer = useRef<any>(null);
   const progressInterval = useRef<any>(null);

   const startPress = () => {
      setIsPressing(true);
      setProgress(0);
      const startTime = Date.now();
      
      progressInterval.current = setInterval(() => {
         const elapsed = Date.now() - startTime;
         setProgress(Math.min(100, (elapsed / duration) * 100));
      }, 50);

      pressTimer.current = setTimeout(() => {
         clearInterval(progressInterval.current);
         setIsPressing(false);
         setProgress(0);
         onClick();
      }, duration);
   };

   const cancelPress = () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
      setIsPressing(false);
      setProgress(0);
   };

   return (
      <button 
         onMouseDown={startPress}
         onMouseUp={cancelPress}
         onMouseLeave={cancelPress}
         onTouchStart={startPress}
         onTouchEnd={cancelPress}
         className={`relative overflow-hidden ${className} ${isPressing ? 'scale-95' : ''} transition-transform`}
      >
         <div className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-75" style={{ width: `${progress}%` }}></div>
         <div className="relative z-10 w-full h-full flex items-center justify-center gap-2">{children}</div>
      </button>
   );
};

export default LongPressButton;
