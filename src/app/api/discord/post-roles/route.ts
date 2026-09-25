import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { postEntryPickerMessage } from "@/lib/discordGuild";

/** Admin-only: post (once) the self-select channel picker into the Discord server. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await postEntryPickerMessage();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(req: Request) {
  return GET(req);
}