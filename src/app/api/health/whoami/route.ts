import { getAppSession } from "@/lib/authEnv";

/** Public: report the caller's own session identity (id/username/name). */
export async function GET() {
  const session = await getAppSession();
  return Response.json({
    loggedIn: Boolean(session?.user),
    id: session?.user?.id ?? null,
    username: session?.user?.username ?? null,
    name: session?.user?.name ?? null,
  });
}