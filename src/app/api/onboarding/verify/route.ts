import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getClientIp } from "@/lib/requestIp";
import { banIpAutomatic, rejectIfIpBannedUnlessAdmin } from "@/lib/ipBan";
import { validateBattleTag, parseRaiderProfileUrl } from "@/lib/battleTagValidation";
import { isBanExempt } from "@/lib/banCheck";

async function rejectAndBan(
  req: Request,
  userId: string,
  handle: string,
  reason: string,
  message: string
) {
  if (!isBanExempt(handle, userId)) {
    const ip = getClientIp(req);
    await banIpAutomatic(ip, reason, userId);
  }
  return NextResponse.json({ error: message, banned: true }, { status: 403 });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ipBlock = await rejectIfIpBannedUnlessAdmin(req, auth.user.id, auth.user.username);
  if (ipBlock) return ipBlock;

  const body = await req.json().catch(() => ({}));
  const battleTag = String(body?.battleTag || "").trim();
  const raiderLink = String(body?.raiderLink || "").trim();

  const tagCheck = validateBattleTag(battleTag);
  if (!tagCheck.valid) {
    return rejectAndBan(
      req,
      auth.user.id,
      auth.user.username,
      `invalid_battletag:${battleTag.slice(0, 24)}`,
      tagCheck.error || "Invalid Battle.net ID"
    );
  }

  const profile = parseRaiderProfileUrl(raiderLink);
  if (!profile) {
    return rejectAndBan(
      req,
      auth.user.id,
      auth.user.username,
      "invalid_raider_link",
      "Invalid Raider.io link format"
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
      return rejectAndBan(
        req,
        auth.user.id,
        auth.user.username,
        `raider_not_found:${profile.name}`,
        "Character not found on Raider.io"
      );
    }

    const data = await res.json();
    if (Number(data.level || 0) < 90) {
      return rejectAndBan(
        req,
        auth.user.id,
        auth.user.username,
        "raider_under_level",
        "Level 90+ character required"
      );
    }

    return NextResponse.json({ ok: true, profile: data, battleTag });
  } catch {
    return NextResponse.json({ error: "Raider.io connection failed" }, { status: 502 });
  }
}
