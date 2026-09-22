import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { resolveCharacterFromShareUrl } from "@/lib/aion2GameApi";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = await rateLimitByIp(getClientIp(req), "aion2:resolve", 20, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const link = String(body?.link || "").trim().slice(0, 500);
  if (!link) {
    return NextResponse.json({ error: "Character page link required" }, { status: 400 });
  }

  try {
    const character = await resolveCharacterFromShareUrl(link);
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    return NextResponse.json({ character });
  } catch (e: any) {
    const msg =
      e?.message === "invalid-character-link"
        ? "That link is not a valid official Aion 2 character page (tw.ncsoft.com or aion2.plaync.com)."
        : e?.message || "Could not reach NCSoft for this character";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}