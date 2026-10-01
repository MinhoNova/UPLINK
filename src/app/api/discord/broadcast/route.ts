import { NextRequest, NextResponse } from "next/server";
import { sendLobbyEmbed } from "@/lib/discord";
import { requireSession } from "@/lib/authz";
import { getKVCached } from "@/lib/kvCache";
import { rateLimitByIp, rateLimitByUser } from "@/lib/rateLimit";
import { rateLimitResponse } from "@/lib/rateLimitHttp";
import { getClientIp } from "@/lib/requestIp";

export async function POST(req: NextRequest) {
   const auth = await requireSession(req);
   if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
   }

   // This writes to a public Discord channel, so a replay loop is a spam
   // problem for everyone who reads that channel, not just for this site.
   // Throttled per account as well as per address: the request is cheap to
   // repeat and the same one can be re-sent from a fresh IP.
   const ipRl = await rateLimitByIp(getClientIp(req), "/api/discord/broadcast", 10, 60_000);
   if (!ipRl.ok) return rateLimitResponse(ipRl);

   const userRl = await rateLimitByUser(String(auth.user.id), "discord-broadcast", 5, 60_000);
   if (!userRl.ok) return rateLimitResponse(userRl);

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
