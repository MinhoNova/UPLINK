import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getKV, initTables } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ access: false, reason: "unauthorized" });

  const userId = (session.user as any).id;
  await initTables();
  const registeredUsers = (await getKV("registeredUsers")) || [];

  if (userId === "1497295886223544471") return NextResponse.json({ access: true, user: { name: session.user.name, image: session.user.image, id: userId } });

  const user = registeredUsers.find((u: any) => String(u.id) === String(userId));
  if (!user?.subscription) return NextResponse.json({ access: false, reason: "not_subscribed" });
  if (user.subscription.tier !== "secret_club") return NextResponse.json({ access: false, reason: "not_secret_club" });
  if (user.subscription.endDate && Date.now() > user.subscription.endDate) return NextResponse.json({ access: false, reason: "expired" });

  return NextResponse.json({ access: true, user: { name: session.user.name, image: session.user.image, id: userId } });
}
