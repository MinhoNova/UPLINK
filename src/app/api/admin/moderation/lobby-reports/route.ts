import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import { getLobbyReports, dismissLobbyReport } from "@/lib/lobbyReports";
import { resolveProfileDisplayName } from "@/lib/profileImage";

export async function GET(req: Request) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const reports = await getLobbyReports();
  if (reports.length === 0) return NextResponse.json({ reports: [] });

  await initTables();
  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];
  const lobbies: any[] = (await getKV("lobbies")) || [];

  const enriched = reports.map((r) => {
    const lobby = lobbies.find((l) => String(l?.id) === String(r.lobbyId));
    const owner = lobby
      ? registeredUsers.find((u) => String(u.id) === String(lobby.ownerId))
      : null;
    const reporter = registeredUsers.find((u) => String(u.id) === String(r.reporterId));
    return {
      ...r,
      lobbyTitle: lobby?.title || `Offer #${r.lobbyId}`,
      lobbyCategory: lobby?.category || "offer",
      lobbyOwnerHandle: lobby?.ownerHandle || lobby?.ownerDiscordName || null,
      ownerId: lobby?.ownerId || null,
      ownerName: owner ? resolveProfileDisplayName(owner) : lobby?.ownerHandle || "Unknown",
      reporterName: reporter ? resolveProfileDisplayName(reporter) : r.reporterHandle || "Unknown",
    };
  });

  return NextResponse.json({ reports: enriched });
}

export async function DELETE(req: Request) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { reportId } = (await req.json()) as { reportId?: string };
  if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

  const removed = await dismissLobbyReport(String(reportId));
  if (!removed) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}