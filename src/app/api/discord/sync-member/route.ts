import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { grantDiscordGuildRole } from "@/lib/discordGuild";

/** Grants the verified role if the signed-in user is already in the UPLINK Discord server. */
export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing user id" }, { status: 400 });
  }

  if (!process.env.DISCORD_BOT_TOKEN) {
    return NextResponse.json({ ok: false, reason: "DISCORD_BOT_TOKEN not configured" });
  }

  const granted = await grantDiscordGuildRole(userId);
  return NextResponse.json({ ok: true, granted });
}
