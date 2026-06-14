export const APPLICANT_NOTE_MAX = 200;

function stripApplicantNoteUnsafe(input: string): string {
  return input
    .replace(/[<>"'`]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .slice(0, APPLICANT_NOTE_MAX);
}

/** Strip XSS-prone content while typing (preserves trailing spaces). */
export function sanitizeApplicantNoteDraft(input: unknown): string {
  if (input == null) return "";
  if (typeof input !== "string") return "";
  return stripApplicantNoteUnsafe(input);
}

/** Strip XSS-prone content from application notes (plain text only). */
export function sanitizeApplicantNote(input: unknown): string {
  if (input == null) return "";
  if (typeof input !== "string") return "";
  return stripApplicantNoteUnsafe(input).trim();
}
