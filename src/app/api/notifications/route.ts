import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKVPairs, setKV, initTables } from "@/lib/db";
import { validateDataWrites } from "@/lib/secureDataWrite";
import { rateLimitByUser } from "@/lib/rateLimit";
import { isUserBanned, bannedResponse } from "@/lib/banCheck";

export async function PUT(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (await isUserBanned(auth.user.username, auth.user.id)) {
    return bannedResponse();
  }

  const rl = await rateLimitByUser(auth.user.id, "notifications_put", 30, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many notification updates", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const body = await req.json();
  if (!Array.isArray(body?.notifications)) {
    return NextResponse.json({ error: "Invalid notifications" }, { status: 400 });
  }

  await initTables();
  const existing = await getKVPairs();
  const validation = await validateDataWrites(
    { notifications: body.notifications },
    existing,
    auth.user.id,
    auth.user.username
  );
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 403 });

  await setKV("notifications", validation.sanitized.notifications);
  return NextResponse.json({ success: true });
}
