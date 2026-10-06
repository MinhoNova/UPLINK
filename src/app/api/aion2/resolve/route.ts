import { NextResponse } from "next/server";
import { aion2RegionFromGameRegion } from "@/lib/aion2ClassIds";
import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { requireSession } from "@/lib/authz";
import { fetchGameCharacterProfile, resolveCharacterFromShareUrl } from "@/lib/aion2GameApi";
import { findCharacterLink } from "@/lib/aion2Uniqueness";
import { signCharacterStats } from "@/lib/characterStatsSig";

export const dynamic = "force-dynamic";

/**
 * Pair a freshly verified character with a signature over its stats.
 *
 * This is the only moment the site sees the real numbers: the server is holding
 * NCSoft's answer inside `fetchGameCharacterProfile`. Signing here, on the way
 * out, is what lets the requirement check on an offer trust these numbers later
 * even though they travel back through a client-writable roster.
 *
 * A null signature (no signing key configured) is passed through rather than
 * faked, so the row lands unsigned and simply cannot satisfy a requirement. See
 * `characterStatsSig.ts`.
 */
async function signedCharacter(
  character: any,
  userId: string
): Promise<{ character: any; statsSig: string | null }> {
  const statsSig = await signCharacterStats(character, userId);
  return { character, statsSig };
}

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

  // The stored shard, so a re-check hits the same live region the character
  // verified on. Without it an EU character is re-checked against `nae`, which
  // answers 200 with an empty profile — the exact "Character not found" this
  // control is supposed to be able to fix. Omitting it is fine: the fetch falls
  // back to the other global shard.
  const region = aion2RegionFromGameRegion(body?.region);

  const auth = await requireSession(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const character = await fetchGameCharacterProfile(characterId, serverId, region);
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
    return NextResponse.json(await signedCharacter(character, uid));
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
    // Signed on the way out here too, not only on PUT: linking a character goes
    // through POST, so this is the path a new roster row actually takes. Without
    // it a freshly linked character is stored unsigned and is refused by every
    // offer that asks for gear, until the player runs an Update. Signed in is
    // required to mint, because the signature binds the row to this account; an
    // anonymous preview is returned unsigned and cannot be applied with.
    return NextResponse.json(uid ? await signedCharacter(character, uid) : { character });
  } catch (e: any) {
    const msg =
      e?.message === "invalid-character-link"
        ? "That link is not a valid official Aion 2 Global character page (aion2.plaync.com)."
        : e?.message || "Could not reach NCSoft for this character";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}