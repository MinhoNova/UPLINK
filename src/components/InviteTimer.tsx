"use client";

import { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";

type InviteTimerProps = {
  expiresAt: number;
  onCancel?: () => void;
  fullWidth?: boolean;
  variant?: "owner" | "player";
};

const InviteTimer = ({
  expiresAt,
  onCancel,
  fullWidth = false,
  variant = "owner",
}: InviteTimerProps) => {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const tick = () => {
      const r = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(r);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const urgency =
    remaining > 30 ? "safe" : remaining > 10 ? "warn" : "critical";

  const palette = {
    safe: {
      accent: "#eab308",
      glow: "rgba(234,179,8,0.25)",
      ring: "rgba(234,179,8,0.35)",
    },
    warn: {
      accent: "#f97316",
      glow: "rgba(249,115,22,0.3)",
      ring: "rgba(249,115,22,0.4)",
    },
    critical: {
      accent: "#ef4444",
      glow: "rgba(239,68,68,0.35)",
      ring: "rgba(239,68,68,0.45)",
    },
  }[urgency];

  if (variant === "player") {
    const pct = Math.max(0, Math.min(100, (remaining / 60) * 100));
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md ${
          fullWidth ? "w-full justify-center" : ""
        }`}
        style={{
          borderColor: palette.ring,
          background: `linear-gradient(135deg, rgba(0,0,0,0.55) 0%, ${palette.glow} 100%)`,
          boxShadow: `0 0 18px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        <Clock className="w-3 h-3 shrink-0" style={{ color: palette.accent }} />
        <span
          className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50"
        >
          Expires
        </span>
        <span
          className="text-sm font-black tabular-nums leading-none"
          style={{ color: palette.accent, textShadow: `0 0 10px ${palette.glow}` }}
        >
          {remaining}s
        </span>
        <div className="h-1 w-10 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${palette.accent}, #00ffff)`,
              boxShadow: `0 0 8px ${palette.glow}`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 ${fullWidth ? "w-full justify-center" : ""}`}
    >
      {onCancel && (
        <button
          onClick={onCancel}
          className="shrink-0 rounded-lg border px-2 py-1.5 font-black uppercase text-[7px] tracking-widest transition-all hover:brightness-125"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderColor: palette.accent,
            color: palette.accent,
          }}
          title="Cancel invite"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <div
        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 ${
          fullWidth ? "flex-1" : ""
        }`}
        style={{
          background: "rgba(0,0,0,0.45)",
          borderColor: palette.ring,
          boxShadow: `0 0 14px ${palette.glow}, inset 0 0 6px ${palette.glow}`,
        }}
      >
        <Clock
          className="w-3 h-3 shrink-0"
          style={{ color: palette.accent, opacity: 0.85 }}
        />
        <span
          className="text-sm font-black tabular-nums leading-none"
          style={{ color: palette.accent, textShadow: `0 0 8px ${palette.glow}` }}
        >
          {remaining}
        </span>
        <span className="text-[7px] font-black uppercase" style={{ color: `${palette.accent}88` }}>
          s
        </span>
      </div>
    </div>
  );
};

export default InviteTimer;
