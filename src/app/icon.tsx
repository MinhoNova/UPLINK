export const size = { width: 32, height: 32 };
export const contentType = 'image/svg+xml';

export default function Icon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="ic" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse">
          <stop stop-color="#00ffff" />
          <stop offset="1" stop-color="#ff007f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#06060c" stroke="url(#ic)" stroke-width="1.5" />
      <path d="M8 16 Q16 8 24 16" stroke="url(#ic)" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="8" cy="16" r="3.5" fill="#00ffff" />
      <circle cx="24" cy="16" r="3.5" fill="#ff007f" />
    </svg>`,
    {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
