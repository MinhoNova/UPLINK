/** Latest activity timestamp for a support ticket (new ticket or new message). */
export const TICKET_TTL_MS = 24 * 60 * 60 * 1000;

export function getTicketCreatedAt(ticket: {
  id?: string | number;
  createdAt?: number;
}): number {
  if (ticket.createdAt) return Number(ticket.createdAt);
  if (typeof ticket.id === "number") return ticket.id;
  const parsed = parseInt(String(ticket.id).split("_")[1] || "0", 10);
  return parsed || 0;
}

export function getTicketExpiresAt(ticket: { id?: string | number; createdAt?: number; expiresAt?: number }): number {
  if (ticket.expiresAt) return Number(ticket.expiresAt);
  return getTicketCreatedAt(ticket) + TICKET_TTL_MS;
}

export function isTicketExpired(
  ticket: { id?: string | number; createdAt?: number; expiresAt?: number },
  now = Date.now()
): boolean {
  const created = getTicketCreatedAt(ticket);
  if (!created) return false;
  return now >= getTicketExpiresAt(ticket);
}

export function getTicketHoursLeft(
  ticket: { id?: string | number; createdAt?: number; expiresAt?: number },
  now = Date.now()
): number {
  const left = getTicketExpiresAt(ticket) - now;
  if (left <= 0) return 0;
  return Math.ceil(left / (60 * 60 * 1000));
}

export function pruneExpiredTickets(tickets: unknown[], now = Date.now()) {
  const list = Array.isArray(tickets) ? tickets : [];
  const kept = list.filter((t) => !isTicketExpired(t as { createdAt?: number }, now));
  return { tickets: kept, removed: list.length - kept.length };
}

export function getTicketActivity(ticket: {
  id?: string | number;
  createdAt?: number;
  messages?: { id?: number }[];
}): number {
  const created = Number(ticket.createdAt) || 0;
  const msgMax = Math.max(0, ...(ticket.messages || []).map((m) => Number(m.id) || 0));
  const idNum =
    typeof ticket.id === "number"
      ? ticket.id
      : parseInt(String(ticket.id).split("_")[1] || "0", 10) || 0;
  return Math.max(created, msgMax, idNum);
}

export function ticketMatchesSearch(ticket: { id?: string | number; subject?: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const id = String(ticket.id).toLowerCase();
  return id.includes(q) || id.slice(-6).includes(q) || (ticket.subject || "").toLowerCase().includes(q);
}
