import { useEffect, useRef, useMemo } from "react";

const VARIANTS = {
  compact: {
    width: 84,
    height: 96,
    pad: "8px 6px",
    radius: 10,
    ring: 40,
    ring2: 48,
    inner: 36,
    canvas: 72,
    canvasOffset: -18,
    exclSize: 5,
    exclTracking: 1.5,
    titleSize: 7,
    titleTracking: 2,
    dividerMb: 4,
    dividerMt: 4,
    titleMb: 6,
    runeSize: 7,
    hover: false,
  },
  inline: {
    width: 108,
    height: 128,
    pad: "10px 8px",
    radius: 11,
    ring: 52,
    ring2: 62,
    inner: 46,
    canvas: 92,
    canvasOffset: -23,
    exclSize: 6,
    exclTracking: 2,
    titleSize: 8,
    titleTracking: 2.5,
    dividerMb: 5,
    dividerMt: 5,
    titleMb: 8,
    runeSize: 8,
    hover: false,
  },
  default: {
    width: 120,
    height: 148,
    pad: "10px 8px",
    radius: 12,
    ring: 58,
    ring2: 68,
    inner: 52,
    canvas: 100,
    canvasOffset: -24,
    exclSize: 7,
    exclTracking: 2.5,
    titleSize: 9,
    titleTracking: 3,
    dividerMb: 6,
    dividerMt: 6,
    titleMb: 10,
    runeSize: 9,
    hover: true,
  },
};

export default function SecretClubCard({ variant = "default" }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  const canvasRef = useRef(null);
  const stateRef = useRef({
    t: 0,
    lidProgress: 0,
    blinking: false,
    blinkPhase: "idle",
    closedTimer: 0,
    blinkTimeout: null,
  });

  const canvasSize = v.canvas;
  const CX = canvasSize / 2;
  const CY = canvasSize / 2;
  const R = canvasSize * 0.43;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvasSize;
    const H = canvasSize;
    const CLOSED_HOLD = 55;
    const CLOSE_SPEED = 0.048;
    const OPEN_SPEED = 0.03;
    const s = stateRef.current;

    function scheduleBlink() {
      s.blinkTimeout = setTimeout(() => {
        s.blinking = true;
        s.blinkPhase = "closing";
      }, 1800 + Math.random() * 3200);
    }
    scheduleBlink();

    function drawEyelid(progress) {
      const lidBottomY = CY - R + progress * R * 2;
      const dip = progress * (R * 0.19);
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, lidBottomY);
      ctx.quadraticCurveTo(CX, lidBottomY + dip, 0, lidBottomY);
      ctx.closePath();
      const lg = ctx.createLinearGradient(0, 0, 0, lidBottomY + dip);
      lg.addColorStop(0, "#04000e");
      lg.addColorStop(1, "#1a0030");
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.restore();
    }

    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      s.t += 0.028;
      const ix = CX + Math.sin(s.t) * (R * 0.27);
      const iy = CY;

      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.clip();

      const ig = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
      ig.addColorStop(0, "#ffffff");
      ig.addColorStop(0.52, "#f2ecff");
      ig.addColorStop(0.82, "#ddd0f8");
      ig.addColorStop(1, "#c4b0ee");
      ctx.fillStyle = ig;
      ctx.fillRect(0, 0, W, H);

      const gg = ctx.createRadialGradient(ix, iy, 0, ix, iy, R * 0.58);
      gg.addColorStop(0, "rgba(25,0,55,.38)");
      gg.addColorStop(1, "rgba(25,0,55,0)");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(ix, iy, R * 0.58, 0, Math.PI * 2);
      ctx.fill();

      const pg = ctx.createRadialGradient(ix - 3, iy - 3, 0, ix, iy, R * 0.37);
      pg.addColorStop(0, "#1a003a");
      pg.addColorStop(0.6, "#0c0020");
      pg.addColorStop(1, "#04000c");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(ix, iy, R * 0.37, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,.88)";
      ctx.beginPath();
      ctx.arc(ix + R * 0.12, iy - R * 0.13, R * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(75,15,125,.65)";
      ctx.lineWidth = Math.max(2, R * 0.07);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = Math.max(1, R * 0.03);
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (s.blinking) {
        if (s.blinkPhase === "closing") {
          s.lidProgress += CLOSE_SPEED;
          if (s.lidProgress >= 1) {
            s.lidProgress = 1;
            s.blinkPhase = "closed";
            s.closedTimer = 0;
          }
        } else if (s.blinkPhase === "closed") {
          s.closedTimer++;
          if (s.closedTimer >= CLOSED_HOLD) s.blinkPhase = "opening";
        } else if (s.blinkPhase === "opening") {
          s.lidProgress -= OPEN_SPEED;
          if (s.lidProgress <= 0) {
            s.lidProgress = 0;
            s.blinking = false;
            scheduleBlink();
          }
        }
      }
      if (s.lidProgress > 0) drawEyelid(s.lidProgress);
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(s.blinkTimeout);
    };
  }, [canvasSize, CX, CY, R]);

  const styleId = useMemo(() => `sc-card-${variant}`, [variant]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');

        @keyframes sc-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes sc-spin-rev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes sc-shimmer-bg { 0%{opacity:.3} 50%{opacity:.55} 100%{opacity:.3} }
        @keyframes sc-gold-pulse {
          0%,100%{text-shadow:0 0 3px rgba(212,175,55,.4)}
          50%{text-shadow:0 0 6px rgba(212,175,55,.7)}
        }
        @keyframes sc-neon-cyan {
          0%,100%{text-shadow:0 0 4px #00ffff,0 0 10px rgba(0,255,255,.35)}
          50%{text-shadow:0 0 6px #00ffff,0 0 16px rgba(0,255,255,.5)}
        }

        .${styleId}-wrap {
          width:${v.width}px;height:${v.height}px;
          border-radius:${v.radius}px;
          background:linear-gradient(160deg,#02000a 0%,#080010 40%,#0d0018 100%);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:${v.pad};box-sizing:border-box;position:relative;
          box-shadow:0 0 12px rgba(100,0,200,.2),inset 0 1px 0 rgba(255,255,255,.04);
          ${v.hover ? "transition:transform .2s ease;" : ""}
        }
        ${v.hover ? `.${styleId}-wrap:hover{transform:scale(1.03);}` : ""}

        .${styleId}-ring-outer {
          position:absolute;width:${v.ring}px;height:${v.ring}px;border-radius:50%;
          border:1px solid #2e1065;border-top-color:#7c3aed;
          animation:sc-spin-slow 6s linear infinite;
        }
        .${styleId}-ring-outer2 {
          position:absolute;width:${v.ring2}px;height:${v.ring2}px;border-radius:50%;
          border:1px dashed #1e0858;
          animation:sc-spin-rev 10s linear infinite;
        }
        .${styleId}-excl {
          font-family:'Cinzel',serif;
          font-size:${v.exclSize}px;font-weight:700;letter-spacing:${v.exclTracking}px;
          color:#d4af37;animation:sc-gold-pulse 1.4s ease-in-out infinite;
          line-height:1;
        }
        .${styleId}-title {
          font-family:'Cinzel',serif;
          font-size:${v.titleSize}px;font-weight:900;letter-spacing:${v.titleTracking}px;
          color:#00ffff;animation:sc-neon-cyan 1.2s ease-in-out infinite;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          text-align:center;line-height:1.05;gap:1px;
        }
        .${styleId}-title span { display:block; }
      `}</style>
      <div className={`${styleId}-wrap`}>
        <div
          className="sc-shimmer-bg"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: v.radius,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at 50% 45%,rgba(80,0,160,.14) 0%,transparent 70%)",
            animation: "sc-shimmer-bg 4s ease-in-out infinite",
          }}
        />
        <span className={`${styleId}-excl`} style={{ zIndex: 2, marginBottom: 3 }}>
          EXCLUSIVE
        </span>
        <div
          style={{
            width: "55%",
            height: 1,
            background:
              "linear-gradient(90deg,transparent,#d4af37 40%,#d4af37 60%,transparent)",
            marginBottom: v.dividerMb,
            zIndex: 2,
            opacity: 0.4,
          }}
        />
        <div
          style={{
            position: "relative",
            width: v.ring,
            height: v.ring,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            flexShrink: 0,
          }}
        >
          <div className={`${styleId}-ring-outer`} />
          <div className={`${styleId}-ring-outer2`} />
          <div
            style={{
              width: v.inner,
              height: v.inner,
              borderRadius: "50%",
              border: "1px solid #3b0764",
              boxShadow:
                "0 0 10px rgba(60,0,120,.45),inset 0 0 6px rgba(200,180,255,.08)",
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
              background: "#000",
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              style={{
                position: "absolute",
                top: v.canvasOffset,
                left: v.canvasOffset,
                width: canvasSize,
                height: canvasSize,
              }}
            />
          </div>
        </div>
        <div
          style={{
            width: "55%",
            height: 1,
            background:
              "linear-gradient(90deg,transparent,#7c3aed 40%,#7c3aed 60%,transparent)",
            marginTop: v.dividerMt,
            marginBottom: v.titleMb,
            zIndex: 2,
            opacity: 0.5,
          }}
        />
        <div className={`${styleId}-title`} style={{ zIndex: 2 }}>
          <span>SECRET</span>
          <span>CLUB</span>
        </div>
      </div>
    </>
  );
}
