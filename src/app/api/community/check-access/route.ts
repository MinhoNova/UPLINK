import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, initTables } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ access: false, reason: "unauthorized" });

  const userId = (session.user as any).id;
  await initTables();
  const registeredUsers = (await getKV("registeredUsers")) || [];

  if (userId === "1497295886223544471") return NextResponse.json({ access: true, user: { name: session.user.name, image: session.user.image, id: userId } });

  return NextResponse.json({ access: true, user: { name: session.user.name, image: session.user.image, id: userId } });
}
