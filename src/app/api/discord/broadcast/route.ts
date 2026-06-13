import { NextRequest, NextResponse } from "next/server";
import { sendLobbyEmbed } from "@/lib/discord";
import { requireSession } from "@/lib/authz";

export async function POST(req: NextRequest) {
   const auth = await requireSession();
   if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
   }

   if (!process.env.DISCORD_BOT_TOKEN) {
      return NextResponse.json({ ok: false, reason: "DISCORD_BOT_TOKEN not configured" });
   }

   try {
      const { lobby } = await req.json();
      if (!lobby?.id) {
         return NextResponse.json({ ok: false, reason: "Invalid lobby data" }, { status: 400 });
      }

      if (String(lobby.ownerId) !== String(auth.user.id)) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await sendLobbyEmbed(lobby);
      return NextResponse.json({ ok: true });
   } catch (err) {
      console.error("discord broadcast error:", err);
      return NextResponse.json({ ok: false, reason: String(err) });
   }
}
