import { ImageResponse } from "next/og";

export const alt = "UPLINK — WoW Mythic+ LFG";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #04040a 0%, #0a0a16 45%, #120818 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(0,255,255,0.18) 0%, rgba(255,0,127,0.08) 45%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="og-arc" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00ffff" />
                <stop offset="1" stopColor="#ff007f" />
              </linearGradient>
            </defs>
            <path d="M8 16 Q16 8 24 16" stroke="url(#og-arc)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="8" cy="16" r="3.5" fill="#00ffff" />
            <circle cx="24" cy="16" r="3.5" fill="#ff007f" />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              background: "linear-gradient(90deg, #00ffff 0%, #c4b5fd 50%, #ff007f 100%)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1,
            }}
          >
            UPLINK
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.88)",
            }}
          >
            WoW Mythic+ LFG
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 22,
              fontWeight: 600,
              color: "rgba(255,255,255,0.55)",
              maxWidth: 760,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Find groups · Sync Raider.io · Discord coordination
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(245,158,11,0.5)",
              background: "rgba(245,158,11,0.12)",
              color: "#fbbf24",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Beta
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(0,255,255,0.75)",
            }}
          >
            uplinklfg.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
