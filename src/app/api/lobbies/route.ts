import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKVPairs, setKV, initTables } from "@/lib/db";
import { validateDataWrites } from "@/lib/secureDataWrite";

export async function PATCH(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const lobbyId = body?.lobbyId;
  const customBg = body?.customBg;
  if (!lobbyId || typeof customBg !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const existing = await getKVPairs();
  const lobbies = Array.isArray(existing.lobbies) ? [...existing.lobbies] : [];
  const idx = lobbies.findIndex((l: { id?: string }) => String(l.id) === String(lobbyId));
  if (idx === -1) return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  const lobby = lobbies[idx] as { ownerId?: string };
  const isAdmin = auth.user.role === "admin";
  if (String(lobby.ownerId) !== String(auth.user.id) && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = lobbies.map((l, i) => (i === idx ? { ...l, customBg } : l));
  const validation = await validateDataWrites(
    { lobbies: updated },
    existing,
    auth.user.id,
    auth.user.username
  );
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 403 });

  await setKV("lobbies", validation.sanitized.lobbies);
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  if (!Array.isArray(body?.lobbies)) {
    return NextResponse.json({ error: "Invalid lobbies" }, { status: 400 });
  }

  await initTables();
  const existing = await getKVPairs();
  const validation = await validateDataWrites(
    { lobbies: body.lobbies },
    existing,
    auth.user.id,
    auth.user.username
  );
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 403 });

  await setKV("lobbies", validation.sanitized.lobbies);
  return NextResponse.json({ success: true });
}
