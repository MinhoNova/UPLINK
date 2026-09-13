import { runAuthHealthCheck } from "@/lib/authHealth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1";
  try {
    const status = await runAuthHealthCheck({ force });
    return Response.json(status);
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}