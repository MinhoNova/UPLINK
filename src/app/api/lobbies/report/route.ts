import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/authEnv";
import { rateLimitByUser } from "@/lib/rateLimit";
import { getKV } from "@/lib/db";
import { fileLobbyReport } from "@/lib/lobbyReports";

async function findLobby(id: string): Promise<any | undefined> {
  try {
    const lobbies: any[] = (await getKV("lobbies")) || [];
    return lobbies.find((l) => String(l?.id) === String(id));
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  const { session, error, status } = await getActiveSession(req);
  if (!session) return NextResponse.json({ error }, { status });

  const userId = String((session.user as any).id);

  const rl = await rateLimitByUser(userId, "lobby_report", 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Slow down." }, { status: 429 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { lobbyId, reason, details } = body || {};
  if (!lobbyId || typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json({ error: "lobbyId and reason are required" }, { status: 400 });
  }
  if (reason.trim().length > 500) {
    return NextResponse.json({ error: "Reason is too long" }, { status: 400 });
  }
  if (details && typeof details === "string" && details.length > 1000) {
    return NextResponse.json({ error: "Details are too long" }, { status: 400 });
  }

  const lobby = await findLobby(String(lobbyId));
  if (!lobby) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (String(lobby.ownerId) === userId) {
    return NextResponse.json({ error: "You cannot report your own offer" }, { status: 400 });
  }

  const report = await fileLobbyReport({
    lobbyId: String(lobbyId),
    reporterId: userId,
    reporterHandle: String((session.user as any).username || ""),
    reason: reason.trim(),
    details: typeof details === "string" && details.trim() ? details.trim() : undefined,
  });

  return NextResponse.json({ success: true, reportId: report.id });
}