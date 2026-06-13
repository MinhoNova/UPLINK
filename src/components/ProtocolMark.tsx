"use client";

import { useId } from "react";
import { motion } from "framer-motion";

export type ProtocolMarkVariant = 1 | 2 | 3 | 4 | 5;

export const PROTOCOL_MARK_OPTIONS: { id: ProtocolMarkVariant; label: string }[] = [
  { id: 1, label: "Live link" },
  { id: 2, label: "Cross beam" },
  { id: 3, label: "Signal stack" },
  { id: 4, label: "Lattice" },
  { id: 5, label: "Pulse field" },
];

const c = (gold: boolean) => ({
  cyan: gold ? "#ffd700" : "#00ffff",
  pink: gold ? "#d4a017" : "#ff007f",
  purple: gold ? "#b8860b" : "#8a2be2",
  cyanRgb: gold ? "255,215,0" : "0,255,255",
  pinkRgb: gold ? "212,160,23" : "255,0,127",
});

export function ProtocolMark({
  variant = 1,
  className = "",
  gold = false,
}: {
  variant?: ProtocolMarkVariant;
  className?: string;
  gold?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const col = c(gold);

  const v: ProtocolMarkVariant =
    variant >= 1 && variant <= 5 ? (Math.floor(variant) as ProtocolMarkVariant) : 1;

  const g = `pr-g-${v}-${uid}`;

  const defs = (
    <defs>
      <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={col.cyan} />
        <stop offset="100%" stopColor={col.pink} />
      </linearGradient>
      <filter id={`glass-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  switch (v) {
    case 1: {
      const arcD = 'M8 20 Q20 9 32 20';
      const len = 30;

      return (
        <svg
          className={className}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          style={{
            overflow: 'visible',
            shapeRendering: 'geometricPrecision',
            vectorEffect: 'non-scaling-stroke'
          }}
        >
          {defs}
          <rect width="40" height="40" rx="12" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

          <path d={arcD} fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="6.5" strokeLinecap="round" />
          <path d={arcD} fill="none" stroke={col.pink} strokeWidth="5.5" strokeLinecap="round" strokeOpacity="0.85" />

          <motion.path
            d={arcD}
            fill="none"
            stroke={col.cyan}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray={len}
            animate={{
              strokeDashoffset: [len, 0, 0, len, len]
            }}
            transition={{
              duration: 4,
              times: [0, 0.4, 0.5, 0.9, 1],
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              willChange: "stroke-dashoffset"
            }}
          />

          <motion.circle
            cx="8" cy="20" r="3.25"
            animate={{
              fill: [col.cyan, col.cyan, col.cyan, col.pink, col.pink, col.cyan],
              scale: [1.6, 1, 1, 1.6, 1, 1.6],
            }}
            transition={{
              duration: 4,
              times: [0, 0.1, 0.88, 0.92, 0.96, 1],
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              willChange: "transform, fill"
            }}
          />

          <motion.circle
            cx="32" cy="20" r="3.25"
            animate={{
              fill: [col.pink, col.pink, col.cyan, col.cyan, col.pink, col.pink, col.pink],
              scale: [1, 1, 1.6, 1, 1.6, 1, 1],
            }}
            transition={{
              duration: 4,
              times: [0, 0.38, 0.42, 0.46, 0.5, 0.54, 1],
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              willChange: "transform, fill"
            }}
          />
        </svg>
      );
    }
    case 2:
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          {defs}
          <rect width="40" height="40" rx="11" fill="none" stroke={`rgba(${col.pinkRgb},0.35)`} strokeWidth="1" />
          <path d="M9 9 L31 31" stroke={`url(#${g})`} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M31 9 L9 31" stroke={`url(#${g})`} strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
          <circle cx="20" cy="20" r="5" fill="none" stroke={`url(#${g})`} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="2.5" fill={col.cyan} />
        </svg>
      );
    case 3:
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          {defs}
          <rect width="40" height="40" rx="11" fill="none" stroke={`rgba(${col.cyanRgb},0.35)`} strokeWidth="1" />
          <path d="M6 30 L34 30" stroke={`url(#${g})`} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <rect x="7" y="18" width="5" height="12" rx="1.5" fill={`url(#${g})`} />
          <rect x="17.5" y="10" width="5" height="20" rx="1.5" fill={`url(#${g})`} opacity="0.95" />
          <rect x="28" y="14" width="5" height="16" rx="1.5" fill={`url(#${g})`} />
          <circle cx="20" cy="6" r="2.5" fill={col.pink} />
        </svg>
      );
    case 4: {
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          {defs}
          <rect width="40" height="40" rx="11" fill="none" stroke={`rgba(${col.purple},0.4)`} strokeWidth="1" />
          <path
            d="M20 5 L33 12.5 L33 27.5 L20 35 L7 27.5 L7 12.5 Z"
            stroke={`url(#${g})`}
            strokeWidth="1.8"
            fill="none"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="5" fill="none" stroke={`url(#${g})`} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="2" fill={col.cyan} />
          <circle cx="20" cy="9" r="1.8" fill={col.pink} />
          <circle cx="31" cy="20" r="1.8" fill={col.cyan} opacity="0.85" />
          <circle cx="20" cy="31" r="1.8" fill={col.pink} opacity="0.85" />
          <circle cx="9" cy="20" r="1.8" fill={col.purple} />
        </svg>
      );
    }
    case 5:
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          {defs}
          <rect width="40" height="40" rx="11" fill="none" stroke={`rgba(${col.cyanRgb},0.35)`} strokeWidth="1" />
          <circle cx="20" cy="20" r="14" stroke={`url(#${g})`} strokeWidth="1.4" strokeDasharray="4 5" fill="none" opacity="0.9" />
          <circle cx="20" cy="20" r="9" stroke={`url(#${g})`} strokeWidth="1.2" strokeDasharray="2 4" fill="none" opacity="0.65" />
          <circle cx="20" cy="20" r="3.5" fill={`url(#${g})`} />
          <path d="M20 6 L20 11" stroke={col.pink} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M20 29 L20 34" stroke={col.cyan} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 20 L11 20" stroke={col.cyan} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <path d="M29 20 L34 20" stroke={col.pink} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    default:
      return null;
  }
}
