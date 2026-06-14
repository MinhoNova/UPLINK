/** Human-readable IP for admin panels. */
export function formatIpForAdmin(ip?: string | null): {
  text: string;
  isLocal: boolean;
  raw: string | null;
} {
  const raw = ip?.trim() || null;
  if (!raw || raw === "unknown") {
    return { text: "Not recorded yet", isLocal: false, raw: null };
  }
  if (raw === "::1" || raw === "127.0.0.1" || raw === "0:0:0:0:0:0:0:1") {
    return {
      text: "Localhost — real IPs appear on Cloudflare production",
      isLocal: true,
      raw,
    };
  }
  return { text: raw, isLocal: false, raw };
}
