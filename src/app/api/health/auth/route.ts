import { syncAuthEnvFromCloudflare, getAuthEnvStatus } from "@/lib/authEnv";
import { requireAdmin } from "@/lib/authz";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  await syncAuthEnvFromCloudflare();
  return Response.json(getAuthEnvStatus());
}
