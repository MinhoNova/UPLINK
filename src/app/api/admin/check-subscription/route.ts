import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import { getSubscriptionDaysLeft } from "@/lib/userProfile";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || "";
  const userId = searchParams.get("userId") || "";
  if (!username && !userId) {
    return NextResponse.json({ error: "Provide ?username= or ?userId=" }, { status: 400 });
  }

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const user = users.find(
    (u) =>
      String(u.id) === userId ||
      String(u.username).toLowerCase() === username.toLowerCase()
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    name: user.name,
    subscription: user.subscription || null,
    daysLeft: getSubscriptionDaysLeft(user),
  });
}
