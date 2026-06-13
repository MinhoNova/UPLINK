import { getKV, setKV, initTables } from "@/lib/db";

const MAX_DAILY_UPLOADS = 25;

const MAGIC: [number[], string][] = [
  [[0xff, 0xd8, 0xff], "jpeg"],
  [[0x89, 0x50, 0x4e, 0x47], "png"],
  [[0x47, 0x49, 0x46], "gif"],
  [[0x52, 0x49, 0x46, 0x46], "webp"],
];

export function validateMagicBytes(buffer: Buffer): boolean {
  for (const [sig] of MAGIC) {
    if (sig.every((b, i) => buffer[i] === b)) return true;
  }
  if (buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return true;
  }
  return false;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export async function checkUploadQuota(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await initTables();
  const key = `uploadQuota_${userId}_${todayKey()}`;
  const count = (await getKV(key)) || 0;
  if (count >= MAX_DAILY_UPLOADS) {
    return { ok: false, error: "Daily upload limit reached" };
  }
  return { ok: true };
}

export async function incrementUploadQuota(userId: string): Promise<void> {
  await initTables();
  const key = `uploadQuota_${userId}_${todayKey()}`;
  const count = (await getKV(key)) || 0;
  await setKV(key, count + 1);
}
