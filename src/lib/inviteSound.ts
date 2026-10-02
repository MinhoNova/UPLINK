/**
 * Invite chime for the player who just got invited.
 *
 * Browsers refuse to play audio before the user has interacted with the page,
 * so this cannot fire on the invite arriving over the websocket-less data poll:
 * by then the tab may never have been clicked. The sound is therefore tied to
 * the modal appearing, and every failure is swallowed — a blocked or missing
 * audio file must never take the Accept/Decline buttons down with it.
 */

const INVITE_SOUND_URL = "/Message.mp3";
const VOLUME = 0.55;

let cached: HTMLAudioElement | null = null;

function audio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  try {
    if (!cached) {
      cached = new Audio(INVITE_SOUND_URL);
      cached.volume = VOLUME;
      cached.preload = "auto";
    }
    return cached;
  } catch {
    return null;
  }
}

/** Play the invite chime. Safe to call repeatedly; no-op if audio is blocked. */
export function playInviteSound(): void {
  const el = audio();
  if (!el) return;
  try {
    el.currentTime = 0;
    const attempt = el.play();
    // Chrome returns a promise that rejects on autoplay policy; unhandled, that
    // surfaces as a console error on every invite for a muted tab.
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
  } catch {
    /* blocked */
  }
}
