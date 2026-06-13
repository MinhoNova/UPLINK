import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/svg+xml';

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#06060c',
        borderRadius: '8px',
        border: '1px solid rgba(0,255,255,0.45)'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="ic" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00ffff" />
              <stop offset="1" stopColor="#ff007f" />
            </linearGradient>
          </defs>
          <path d="M8 16 Q16 8 24 16" stroke="url(#ic)" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="8" cy="16" r="3.5" fill="#00ffff" />
          <circle cx="24" cy="16" r="3.5" fill="#ff007f" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
