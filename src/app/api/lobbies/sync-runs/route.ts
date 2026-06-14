import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKVPairs, initTables, setKV } from "@/lib/db";
import { rateLimitByUser } from "@/lib/rateLimit";
import { syncLobbyDetectedRuns, userCanTriggerRunSync } from "@/lib/raiderSync";

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await rateLimitByUser(auth.user.id, "sync_runs", 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sync requests", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const lobbyId = String(body?.lobbyId || "");
  if (!lobbyId) return NextResponse.json({ error: "Missing lobbyId" }, { status: 400 });

  await initTables();
  const data = await getKVPairs();
  const lobbies = Array.isArray(data.lobbies) ? [...data.lobbies] : [];
  const idx = lobbies.findIndex((l: { id?: string }) => String(l.id) === lobbyId);
  if (idx === -1) return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  const lobby = lobbies[idx] as any;
  if ((lobby.status || "standby") !== "in_progress") {
    return NextResponse.json({ error: "Mission is not in progress" }, { status: 403 });
  }

  if (!userCanTriggerRunSync(lobby, auth.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const detectedRuns = await syncLobbyDetectedRuns(lobby);
  const updatedLobby = { ...lobby, detectedRuns };
  lobbies[idx] = updatedLobby;
  await setKV("lobbies", lobbies);

  return NextResponse.json({ ok: true, lobby: updatedLobby, detectedRuns });
}
