import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import { userCanViewOfferThread } from "@/lib/lobbyLifecycle";

export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const lobbies = (await getKV("lobbies")) || [];
  const history = lobbies.filter((lobby: any) =>
    lobby.status === "completed" &&
    lobby.payoutStatus === "paid" &&
    Boolean(lobby.paymentProof) &&
    userCanViewOfferThread(lobby, auth.user.id, auth.user.username)
  );
  const ownerIds = new Set(history.map((lobby: any) => String(lobby.ownerId)));
  const users = ((await getKV("registeredUsers")) || [])
    .filter((user: any) => ownerIds.has(String(user.id)))
    .map((user: any) => ({
      id: user.id,
      activeVfx: user.activeVfx,
      profileGif: user.profileGif,
      vfxSettings: user.vfxSettings,
    }));

  return NextResponse.json({ lobbies: history, registeredUsers: users });
}
