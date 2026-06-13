import { syncAuthEnvFromCloudflare, getAuthEnvStatus } from "@/lib/authEnv";

export async function GET() {
  await syncAuthEnvFromCloudflare();
  return Response.json(getAuthEnvStatus());
}
