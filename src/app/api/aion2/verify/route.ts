import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { requireSession } from "@/lib/authz";
import { verifyGameCharacter } from "@/lib/aion2GameApi";
import { findCharacterLink } from "@/lib/aion2Uniqueness";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = await rateLimitByIp(getClientIp(req), "aion2:verify", 20, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = String(body?.name || "").trim().slice(0, 32);
  const serverId = body?.serverId ? Number(body.serverId) : undefined;
  const race = body?.race ? Number(body.race) : undefined;
  if (!name) return NextResponse.json({ error: "Character name required" }, { status: 400 });

  try {
    const character = await verifyGameCharacter(name, serverId, race);
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    const auth = await requireSession(req);
    const uid = auth.ok ? String(auth.user.id) : "";
    const linked = await findCharacterLink(character.characterId);
    if (linked && String(linked.userId) !== uid) {
      return NextResponse.json({ character, alreadyLinked: true }, { status: 200 });
    }
    return NextResponse.json({ character });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Verification failed" }, { status: 502 });
  }
}