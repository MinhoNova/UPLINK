import { runAuthHealthCheck } from "@/lib/authHealth";
import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { getAppSession } from "@/lib/authEnv";
import { isAdminUser } from "@/lib/secureDataWrite";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // This endpoint is unauthenticated on purpose (uptime probes), but the work
  // it triggers is not free: it calls Discord and writes a record to the store.
  // `?force=1` bypasses the 5 minute throttle, so without a limit any visitor
  // could loop it and turn it into a write amplifier.
  const rl = await rateLimitByIp(getClientIp(request), "health:auth", 6, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // Throttle-bypass stays admin-only: a forced re-check is a debugging action.
  const forceRequested = new URL(request.url).searchParams.get("force") === "1";
  const session = await getAppSession(request).catch(() => null);
  const uid = (session?.user as { id?: string } | undefined)?.id || "";
  const handle = (session?.user as { username?: string } | undefined)?.username || "";
  const force = forceRequested && Boolean(uid) && isAdminUser(uid, handle);

  try {
    const status = await runAuthHealthCheck({ force });
    return Response.json(status);
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}