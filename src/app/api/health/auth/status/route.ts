import { getAuthHealthStatus } from "@/lib/authHealth";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getAuthHealthStatus();
  if (!status) {
    return Response.json({ ok: null, message: "no checks yet" });
  }
  return Response.json(status);
}