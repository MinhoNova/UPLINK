import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getClientIp } from "@/lib/requestIp";
import { rejectIfIpBannedUnlessAdmin } from "@/lib/ipBan";
import { validateBattleTag, parseRaiderProfileUrl } from "@/lib/battleTagValidation";
import { rateLimitByIp, rateLimitByUser, rateLimitResponse } from "@/lib/rateLimit";

const VERIFY_LIMIT_PER_USER = 40;
const VERIFY_LIMIT_PER_IP = 60;
const VERIFY_WINDOW_MS = 60 * 60_000;
/** Minimum character level on Raider.io to complete registration (no IO/rating requirement). */
const ONBOARDING_MIN_LEVEL = 80;

function rejectVerification(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ipBlock = await rejectIfIpBannedUnlessAdmin(req, auth.user.id, auth.user.username);
  if (ipBlock) return ipBlock;

  const ip = getClientIp(req);
  const userRl = await rateLimitByUser(auth.user.id, "onboarding_verify", VERIFY_LIMIT_PER_USER, VERIFY_WINDOW_MS);
  if (!userRl.ok) return rateLimitResponse(userRl);

  const ipRl = await rateLimitByIp(ip, "onboarding_verify", VERIFY_LIMIT_PER_IP, VERIFY_WINDOW_MS);
  if (!ipRl.ok) return rateLimitResponse(ipRl);

  const body = await req.json().catch(() => ({}));
  const battleTag = String(body?.battleTag || "").trim();
  const raiderLink = String(body?.raiderLink || "").trim();

  const tagCheck = validateBattleTag(battleTag);
  if (!tagCheck.valid) {
    return rejectVerification(tagCheck.error || "Invalid Battle.net ID");
  }

  const profile = parseRaiderProfileUrl(raiderLink);
  if (!profile) {
    return rejectVerification(
      "Invalid Raider.io link. Paste the full profile URL (e.g. https://raider.io/characters/us/area-52/character-name)."
    );
  }

  try {
    const url = new URL("https://raider.io/api/v1/characters/profile");
    url.searchParams.set("region", profile.region);
    url.searchParams.set("realm", profile.realm);
    url.searchParams.set("name", profile.name);
    url.searchParams.set("fields", "mythic_plus_scores_by_season:current,gear,mythic_plus_best_runs:all");

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      return rejectVerification(
        "Character not found on Raider.io. Check the link matches your character name and realm."
      );
    }

    const data = await res.json();
    const level = Number(data.level || 0);
    if (level < ONBOARDING_MIN_LEVEL) {
      return rejectVerification(
        `Level ${ONBOARDING_MIN_LEVEL}+ character required (yours is ${level || "unknown"}). Level up in Midnight, then try again.`
      );
    }

    return NextResponse.json({ ok: true, profile: data, battleTag });
  } catch {
    return NextResponse.json({ error: "Raider.io connection failed. Try again in a moment." }, { status: 502 });
  }
}
