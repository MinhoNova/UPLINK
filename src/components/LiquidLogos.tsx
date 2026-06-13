import React, { useId } from 'react';
import { motion } from 'framer-motion';

const LiquidProtocolBase = ({ children, variantId }: { children: React.ReactNode, variantId: string }) => {
  const uid = useId().replace(/:/g, "");
  const liquidG = `liquid-flow-${variantId}-${uid}`;
  
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
      <defs>
        <linearGradient id={liquidG} x1="0%" y1="0%" x2="100%" y2="0%">
          <motion.stop offset="0%" stopColor="#00ffff" animate={{ offset: ["0%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          <motion.stop offset="100%" stopColor="#ff007f" animate={{ offset: ["100%", "0%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
        </linearGradient>
      </defs>
      {React.cloneElement(children as React.ReactElement, { stroke: `url(#${liquidG})`, fill: `url(#${liquidG})` } as any)}
    </svg>
  );
};

export const LiquidLogo1 = () => (
  <LiquidProtocolBase variantId="1">
    <path d="M8 20 Q20 9 32 20" strokeWidth="4" />
  </LiquidProtocolBase>
);

export const LiquidLogo2 = () => (
  <LiquidProtocolBase variantId="2">
    <path d="M9 9 L31 31" strokeWidth="3" />
    <path d="M31 9 L9 31" strokeWidth="3" />
  </LiquidProtocolBase>
);

export const LiquidLogo3 = () => (
  <LiquidProtocolBase variantId="3">
    <rect x="10" y="10" width="20" height="20" rx="4" strokeWidth="3" />
  </LiquidProtocolBase>
);

export const LiquidLogo4 = () => (
  <LiquidProtocolBase variantId="4">
    <circle cx="20" cy="20" r="12" strokeWidth="3" />
    <circle cx="20" cy="20" r="4" />
  </LiquidProtocolBase>
);

export const LiquidLogo5 = () => (
  <LiquidProtocolBase variantId="5">
    <polygon points="20,5 35,28 5,28" strokeWidth="3" />
  </LiquidProtocolBase>
);
