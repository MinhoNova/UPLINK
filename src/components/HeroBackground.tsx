"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export function HeroBackground({ light }: { light?: boolean }) {
  // Generate random particles (reduced count for performance)
  const particles = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
    isCyan: Math.random() > 0.5,
  })), []);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${light ? 'bg-[#e8e8f0]' : 'bg-[#030308]'}`}>
      {/* 1. Moving Cyberpunk Grid (Perspective) */}
      <div 
        className={`absolute inset-0 ${light ? 'opacity-[0.06]' : 'opacity-[0.12]'}`}
        style={{
          backgroundImage: light
            ? `linear-gradient(transparent 95%, rgba(100, 100, 180, 0.2) 100%), linear-gradient(90deg, transparent 95%, rgba(180, 100, 200, 0.2) 100%)`
            : `linear-gradient(transparent 95%, rgba(0, 255, 255, 0.4) 100%), linear-gradient(90deg, transparent 95%, rgba(255, 0, 127, 0.4) 100%)`,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(60deg) scale(2)",
          transformOrigin: "bottom center",
          animation: "grid-move 4s linear infinite",
          willChange: "background-position"
        }}
      />
      
      {/* 2. Floating Data Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: light
              ? (p.isCyan ? "rgba(80, 80, 200, 0.4)" : "rgba(200, 80, 150, 0.4)")
              : (p.isCyan ? "#00ffff" : "#ff007f"),
            willChange: "transform, opacity"
          }}
          animate={{
            y: ["0%", "-100vh"],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}

      {/* 3. Static Atmospheric Glows */}
      {light ? (
        <>
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] blur-[100px] rounded-full" style={{ backgroundColor: "rgba(136,136,255,0.08)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] blur-[120px] rounded-full" style={{ backgroundColor: "rgba(255,136,204,0.08)" }} />
        </>
      ) : (
        <>
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00ffff]/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#ff007f]/10 blur-[120px] rounded-full" />
        </>
      )}

      {/* 4. Vignette / Fade at bottom to blend with the rest of the site */}
      <div className={`absolute inset-0 ${light ? 'bg-gradient-to-b from-transparent via-[#e8e8f0]/40 to-[#e8e8f0]' : 'bg-gradient-to-b from-transparent via-[#030308]/40 to-[#030308]'}`} />

      <style jsx>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
      `}</style>
    </div>
  );
}
