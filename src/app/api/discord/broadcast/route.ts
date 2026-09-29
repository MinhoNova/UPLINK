import { NextRequest, NextResponse } from "next/server";
import { sendLobbyEmbed } from "@/lib/discord";
import { requireSession } from "@/lib/authz";
import { getKVCached } from "@/lib/kvCache";

export async function POST(req: NextRequest) {
   const auth = await requireSession(req);
   if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
   }

   if (!process.env.DISCORD_BOT_TOKEN) {
      return NextResponse.json({ ok: false, reason: "DISCORD_BOT_TOKEN not configured" });
   }

   try {
      const { lobby }: any = await req.json();
      if (!lobby?.id) {
         return NextResponse.json({ ok: false, reason: "Invalid lobby data" }, { status: 400 });
      }

      // Ownership has to come from the stored offer. The body's `ownerId` is
      // caller-controlled, so trusting it let any signed-in user push an
      // arbitrary "owned" embed into the announcement channel.
      const stored = ((await getKVCached("lobbies").catch(() => null)) || []) as any[];
      const real = stored.find((l) => String(l?.id) === String(lobby.id));
      if (!real) {
         return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      }
      if (String(real.ownerId) !== String(auth.user.id)) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await sendLobbyEmbed(real);
      return NextResponse.json({ ok: true });
   } catch (err) {
      console.error("discord broadcast error:", err);
      return NextResponse.json({ ok: false, reason: String(err) });
   }
}
