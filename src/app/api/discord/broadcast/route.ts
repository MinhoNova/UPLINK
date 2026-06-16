import { NextRequest, NextResponse } from "next/server";
import { sendLobbyEmbed } from "@/lib/discord";
import { requireSession } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import { resolveDiscordEmbedIdentity } from "@/lib/profileImage";

export async function POST(req: NextRequest) {
   const auth = await requireSession(req);
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

      await initTables();
      const users: any[] = (await getKV("registeredUsers")) || [];
      const owner = users.find((u) => String(u.id) === String(auth.user.id));
      const { name, avatar } = resolveDiscordEmbedIdentity(owner, lobby);

      await sendLobbyEmbed(
         {
            ...lobby,
            ownerName: name,
            ownerImage: avatar,
         },
         owner
      );
      return NextResponse.json({ ok: true });
   } catch (err) {
      console.error("discord broadcast error:", err);
      return NextResponse.json({ ok: false, reason: String(err) });
   }
}
