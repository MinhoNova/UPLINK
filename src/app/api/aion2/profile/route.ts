import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { fetchCharacterDetails } from "@/lib/aion2GameApi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rl = await rateLimitByIp(getClientIp(req), "aion2:profile", 20, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  const link = String(new URL(req.url).searchParams.get("u") || "").trim().slice(0, 500);
  if (!link) {
    return NextResponse.json({ error: "Character page link required" }, { status: 400 });
  }

  try {
    const details = await fetchCharacterDetails(link);
    if (!details) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    return NextResponse.json({ details });
  } catch (e: any) {
    const msg =
      e?.message === "invalid-character-link"
        ? "That link is not a valid official Aion 2 character page (tw.ncsoft.com or aion2.plaync.com)."
        : e?.message || "Could not reach NCSoft for this character";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}