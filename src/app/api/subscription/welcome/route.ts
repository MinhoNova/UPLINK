import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";
import { grantSecretClubSubscription, getSubscriptionDaysLeft } from "@/lib/userProfile";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "claim_free");

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u) => String(u.id) === String(auth.user.id));
  if (idx === -1) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 404 });
  }

  const user = users[idx];

  if (action === "dismiss") {
    users[idx] = { ...user, welcomePlansSeen: true };
    await setKV("registeredUsers", users);
    return NextResponse.json({ ok: true, dismissed: true });
  }

  if (action !== "claim_free") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const claims: Record<string, number> = (await getKV("welcomeFreeClaims")) || {};
  if (claims[String(auth.user.id)]) {
    return NextResponse.json({ error: "Welcome offer already claimed" }, { status: 409 });
  }

  if (user.welcomeFreeClaimed) {
    return NextResponse.json({ error: "Welcome offer already claimed" }, { status: 409 });
  }

  users[idx] = {
    ...grantSecretClubSubscription(user, 30),
    welcomePlansSeen: true,
    welcomeFreeClaimed: true,
  };
  claims[String(auth.user.id)] = Date.now();
  await setKV("welcomeFreeClaims", claims);
  await setKV("registeredUsers", users);

  return NextResponse.json({
    ok: true,
    daysLeft: getSubscriptionDaysLeft(users[idx]),
    endDate: users[idx].subscription?.endDate,
  });
}
