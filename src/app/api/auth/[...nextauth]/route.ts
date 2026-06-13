import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { syncAuthEnvFromCloudflare } from "@/lib/authEnv";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

async function handler(req: Request, context: RouteContext) {
  await syncAuthEnvFromCloudflare();
  return NextAuth(getAuthOptions())(req, context);
}

export { handler as GET, handler as POST };
