import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { postSitePromo } from "@/lib/discordPromo";

export const dynamic = "force-dynamic";

/** Admin-only: posts + pins a site promo message in a public Discord channel. */
export async function POST(req: Request) {
   const auth = await requireAdmin(req);
   if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
   }
   if (!process.env.DISCORD_BOT_TOKEN) {
      return NextResponse.json({ error: "DISCORD_BOT_TOKEN not configured" }, { status: 503 });
   }

   const result = await postSitePromo();
   return NextResponse.json({ success: result.posted, ...result });
}