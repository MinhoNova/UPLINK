/**
 * Defense-in-depth text sanitizer for user-provided content.
 * Rendering is already safe (React escapes), but we also scrub
 * what gets persisted so no unsafe payload reaches storage or any future renderer.
 */

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B\uFEFF]/g;
const ANGLE_TAGS = /<[^>]*>/g;
const JS_PROTOCOL = /(?:javascript\s*:|vbscript\s*:|data\s*:\s*text\/html)/gi;
const EVENT_HANDLERS = /\son[a-z]+\s*=/gi;
const URL_ORIGIN = /^(https?:\/\/)/i;

/** Strip HTML tags, control chars, script protocols, and event handlers. */
export function sanitizePlainText(input: unknown, max = 2000): string {
  if (input == null) return "";
  if (typeof input !== "string") return "";
  return String(input)
    .replace(ANGLE_TAGS, "")
    .replace(JS_PROTOCOL, "")
    .replace(EVENT_HANDLERS, "")
    .replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, max);
}

/** Short-sanitize for reply snippets / previews. */
export function sanitizeShortText(input: unknown, max = 120): string {
  return sanitizePlainText(input, max);
}

/** Only allow http(s)-absolute URLs for remote image fields. */
export function sanitizeImageUrl(input: unknown, max = 2048): string {
  if (input == null) return "";
  const s = String(input).trim();
  if (!URL_ORIGIN.test(s)) return "";
  // Strip any embedded quotes/angle brackets leftover from crafted URLs
  const clean = s.replace(/["'<>\\]/g, "");
  return clean.slice(0, max);
}