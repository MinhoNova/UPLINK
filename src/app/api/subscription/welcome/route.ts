import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";

/**
 * The site is free for everyone — there are no paid subscriptions.
 * These endpoints are kept as no-ops so legacy clients/UI never error.
 */
export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "dismiss");

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u) => String(u.id) === String(auth.user.id));
  if (idx === -1) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 404 });
  }

  const user = users[idx];
  users[idx] = { ...user, welcomePlansSeen: true, welcomeFreeClaimed: true };
  await setKV("registeredUsers", users);

  return NextResponse.json({
    ok: true,
    free: true,
    daysLeft: null,
    endDate: null,
    message: "The site is free — all features are unlocked.",
  });
}