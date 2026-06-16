import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, initTables } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getAppSession(req);
  const userId = (session?.user as any)?.id;

  await initTables();
  const registeredUsers = (await getKV("registeredUsers")) || [];
  const user = registeredUsers.find((u: any) => String(u.id) === String(userId));

  return NextResponse.json({
    access: true,
    user: userId
      ? { name: session!.user.name, image: session!.user.image, id: userId }
      : null,
    subscription: user?.subscription || null,
  });
}
