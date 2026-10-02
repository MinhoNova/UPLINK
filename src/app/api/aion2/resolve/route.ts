import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { requireSession } from "@/lib/authz";
import { fetchGameCharacterProfile, resolveCharacterFromShareUrl } from "@/lib/aion2GameApi";
import { findCharacterLink } from "@/lib/aion2Uniqueness";

export const dynamic = "force-dynamic";

/**
 * Re-verify a character we already store, from its stored `characterId` +
 * `serverId` rather than a pasted link.
 *
 * Characters linked before portraits existed kept `portraitUrl: ""` forever:
 * `saveVerifiedCharacterEntry` is the only writer, it only runs when someone
 * pastes a link, and nothing backfilled the rows that were already saved. So
 * fixing the upstream mapping alone left every pre-existing character blank on
 * every screen. This gives the UI a way to refresh those rows in place.
 */
export async function PUT(req: Request) {
  const rl = await rateLimitByIp(getClientIp(req), "aion2:resolve", 20, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const characterId = String(body?.characterId || "").trim().slice(0, 200);
  const serverId = Number(body?.serverId);
  if (!characterId || !Number.isFinite(serverId) || serverId <= 0) {
    return NextResponse.json(
      { error: "characterId and serverId are required" },
      { status: 400 }
    );
  }

  const auth = await requireSession(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const character = await fetchGameCharacterProfile(characterId, serverId);
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    // A link is a per-account claim: refuse to hand someone else's character
    // back just because they guessed the id.
    const linked = await findCharacterLink(character.characterId);
    const uid = String(auth.user.id);
    if (linked && String(linked.userId) !== uid) {
      return NextResponse.json({ error: "That character is linked to another account" }, { status: 403 });
    }
    return NextResponse.json({ character });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Could not reach NCSoft for this character" },
      { status: 502 }
    );
  }
}

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
    const auth = await requireSession(req);
    const uid = auth.ok ? String(auth.user.id) : "";
    const linked = await findCharacterLink(character.characterId);
    if (linked && String(linked.userId) !== uid) {
      return NextResponse.json({ character, alreadyLinked: true }, { status: 200 });
    }
    return NextResponse.json({ character });
  } catch (e: any) {
    const msg =
      e?.message === "invalid-character-link"
        ? "That link is not a valid official Aion 2 Global character page (aion2.plaync.com)."
        : e?.message || "Could not reach NCSoft for this character";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}