import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";
import { extendSecretClubSubscription, getSubscriptionDaysLeft } from "@/lib/userProfile";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const userId = String(body.userId || "");
  const months = Number(body.months);
  if (!userId || ![1, 2, 3].includes(months)) {
    return NextResponse.json({ error: "Invalid userId or months" }, { status: 400 });
  }

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u) => String(u.id) === userId);
  if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  users[idx] = extendSecretClubSubscription(users[idx], months);
  await setKV("registeredUsers", users);

  return NextResponse.json({
    success: true,
    daysLeft: getSubscriptionDaysLeft(users[idx]),
    endDate: users[idx].subscription?.endDate,
  });
}
