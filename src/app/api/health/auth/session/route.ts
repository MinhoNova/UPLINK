import { syncAuthEnvFromCloudflare, getAuthEnvStatus, getAppSession } from "@/lib/authEnv";
import { requireAdmin } from "@/lib/authz";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  await syncAuthEnvFromCloudflare();

  const cookieHeader = req.headers.get("cookie") ?? "";
  const hasSessionCookie =
    cookieHeader.includes("next-auth.session-token") ||
    cookieHeader.includes("__Secure-next-auth.session-token");

  const session = await getAppSession(req);

  return Response.json({
    ...getAuthEnvStatus(),
    hasSessionCookie,
    sessionOk: Boolean(session?.user),
    userId: (session?.user as { id?: string } | undefined)?.id ?? null,
    username: (session?.user as { username?: string } | undefined)?.username ?? null,
  });
}
