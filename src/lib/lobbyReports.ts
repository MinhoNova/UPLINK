import { getKV, setKV } from "@/lib/db";

/**
 * Scam reports filed by players against an offer owner from inside a thread.
 *
 * Kept as a KV blob (like the lobbies and daily-limit counters) so no D1 schema
 * migration is needed. A report is just evidence destined for the moderation
 * queue — it does NOT and must not ban anyone by itself; a moderator reads the
 * thread, checks the payment-screenshot narrative, and acts from the admin
 * panel (where the owner can be banned or the offer removed).
 */
export type LobbyReport = {
  id: string;
  lobbyId: string;
  reporterId: string;
  reporterHandle: string;
  reason: string;
  details?: string;
  createdAt: number;
};

const KEY = "lobbyReports";

export async function getLobbyReports(): Promise<LobbyReport[]> {
  try {
    const raw = await getKV(KEY);
    return Array.isArray(raw) ? (raw as LobbyReport[]) : [];
  } catch {
    return [];
  }
}

export async function fileLobbyReport(
  report: Omit<LobbyReport, "id" | "createdAt">
): Promise<LobbyReport> {
  const reports = await getLobbyReports();
  const record: LobbyReport = {
    ...report,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  reports.push(record);
  await setKV(KEY, reports);
  return record;
}

export async function dismissLobbyReport(id: string): Promise<boolean> {
  const reports = await getLobbyReports();
  const next = reports.filter((r) => r.id !== id);
  if (next.length === reports.length) return false;
  await setKV(KEY, next);
  return true;
}