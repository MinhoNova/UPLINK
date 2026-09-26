import { getAppSession } from "@/lib/authEnv";

/** Public: report the caller's own session identity (id/username/name). */
export async function GET(req: Request) {
  const session = await getAppSession(req);
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => { const [k, ...v] = c.trim().split("="); return [k, v.join("=")]; }).filter(([k]) => k)
  );
  const authNames = Object.keys(cookies).filter((k) => /(session-token|authjs|\.session|credentials)/i.test(k));
  return Response.json({
    loggedIn: Boolean(session?.user),
    id: session?.user?.id ?? null,
    username: session?.user?.username ?? null,
    name: session?.user?.name ?? null,
    hasSessionCookie: authNames.length > 0,
    authCookieNames: authNames,
  });
}