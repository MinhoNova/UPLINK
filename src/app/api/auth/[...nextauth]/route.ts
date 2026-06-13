import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

async function handler(
  req: Request,
  context: RouteContext
) {
  return NextAuth(getAuthOptions())(req, context);
}

export { handler as GET, handler as POST };
