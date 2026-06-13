import { getKV, setKV, initTables } from "@/lib/db";

export type AuditEntry = {
  id: string;
  action: string;
  userId: string;
  handle?: string;
  target?: string;
  meta?: Record<string, unknown>;
  timestamp: number;
};

const MAX_LOGS = 2000;

export async function logAudit(entry: Omit<AuditEntry, "id" | "timestamp">): Promise<void> {
  try {
    await initTables();
    const logs: AuditEntry[] = (await getKV("auditLogs")) || [];
    logs.unshift({
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    });
    await setKV("auditLogs", logs.slice(0, MAX_LOGS));
  } catch (e) {
    console.error("audit log failed:", e);
  }
}

export async function getAuditLogs(limit = 100): Promise<AuditEntry[]> {
  await initTables();
  const logs: AuditEntry[] = (await getKV("auditLogs")) || [];
  return logs.slice(0, Math.min(limit, 500));
}
