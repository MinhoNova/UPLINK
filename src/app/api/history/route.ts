import { NextResponse } from "next/server";
import { requireSession, isAdminUser } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import { userCanViewOfferThread } from "@/lib/lobbyLifecycle";
import { playerAliases } from "@/lib/playerIdentity";

export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const lobbies = (await getKV("lobbies")) || [];
  // `ownerDiscordName` is a snapshot from post time, so a renamed owner has to
  // be recognised through the account row's aliases — not the session handle.
  const allUsers = ((await getKV("registeredUsers")) || []) as any[];
  const meRow = allUsers.find((u: any) => String(u.id) === String(auth.user.id));
  const handle = String(meRow?.username || auth.user.username || "");
  const aliases = meRow ? playerAliases(meRow) : [];
  const isAdmin = await isAdminUser(auth.user.id, auth.user.username);
  const history = lobbies
    .filter((lobby: any) =>
      lobby.status === "completed" &&
      lobby.payoutStatus === "paid" &&
      Boolean(lobby.paymentProof) &&
      (isAdmin || userCanViewOfferThread(lobby, auth.user.id, handle, aliases))
    )
    .sort((a: any, b: any) => Number(b.completedAt || 0) - Number(a.completedAt || 0))
    .slice(0, 100);
  const ownerIds = new Set(history.map((lobby: any) => String(lobby.ownerId)));
  const users = allUsers
    .filter((user: any) => ownerIds.has(String(user.id)))
    .map((user: any) => ({
      id: user.id,
      name: user.name ?? null,
      username: user.username ?? null,
      displayName: user.displayName ?? null,
      avatar: user.avatar ?? null,
      customAvatar: user.customAvatar ?? null,
      profileGif: user.profileGif ?? null,
      activeVfx: user.activeVfx ?? null,
      vfxSettings: user.vfxSettings ?? null,
    }));

  return NextResponse.json({ lobbies: history, registeredUsers: users });
}
