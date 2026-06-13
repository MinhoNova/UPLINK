/** Drop finished lobbies from history after 7 days and on each WoW US retail reset (Tuesday). */

const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TERMINAL_STATUSES = new Set(["completed", "unpaid", "failed", "cancelled"]);

/** US retail weekly reset: Tuesday 15:00 UTC */
export function getLastRetailResetMs(now = Date.now()): number {
  const d = new Date(now);
  const day = d.getUTCDay();
  const daysSinceTuesday = (day - 2 + 7) % 7;
  const reset = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 15, 0, 0, 0));
  reset.setUTCDate(reset.getUTCDate() - daysSinceTuesday);
  if (reset.getTime() > now) {
    reset.setUTCDate(reset.getUTCDate() - 7);
  }
  return reset.getTime();
}

export function getHistoryCutoffMs(now = Date.now()): number {
  return Math.max(now - HISTORY_TTL_MS, getLastRetailResetMs(now));
}

export function pruneTerminalLobbies(lobbies: any[]): { lobbies: any[]; removed: number } {
  const now = Date.now();
  const cutoff = getHistoryCutoffMs(now);
  const kept: any[] = [];
  let removed = 0;

  for (const l of lobbies) {
    const status = l.status || "";
    if (!TERMINAL_STATUSES.has(status)) {
      kept.push(l);
      continue;
    }
    if (status === "cancelled") {
      removed++;
      continue;
    }
    const finishedAt = Number(l.completedAt) || Number(l.failedAt) || 0;
    if (!finishedAt || finishedAt < cutoff) {
      removed++;
    } else {
      kept.push(l);
    }
  }

  return { lobbies: kept, removed };
}
