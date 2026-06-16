import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { setupDiscordGuildRoles } from "@/lib/discordGuild";

/** One-time admin setup: create Discord roles + assign Owner. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await setupDiscordGuildRoles();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(req: Request) {
  return GET(req);
}
