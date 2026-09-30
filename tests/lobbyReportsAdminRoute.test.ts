import { describe, it, expect, vi } from "vitest";

/**
 * Moderation queue for offer scam reports. Moderators see the report enriched
 * with the owner/reporter identities so they can open the thread and judge the
 * payment-screenshot narrative, then dismiss it.
 */

const { requireModeratorMock, getKVMock, initTablesMock, getLobbyReportsMock, dismissLobbyReportMock } =
  vi.hoisted(() => {
    const requireModerator = vi.fn();
    const getKV = vi.fn();
    const initTables = vi.fn();
    const getLobbyReports = vi.fn();
    const dismissLobbyReport = vi.fn();
    return {
      requireModeratorMock: requireModerator,
      getKVMock: getKV,
      initTablesMock: initTables,
      getLobbyReportsMock: getLobbyReports,
      dismissLobbyReportMock: dismissLobbyReport,
    };
  });

vi.mock("@/lib/authz", () => ({ requireModerator: requireModeratorMock }));
vi.mock("@/lib/db", () => ({
  getKV: getKVMock as any,
  initTables: initTablesMock as any,
}));
vi.mock("@/lib/lobbyReports", () => ({
  getLobbyReports: getLobbyReportsMock,
  dismissLobbyReport: dismissLobbyReportMock,
}));
vi.mock("@/lib/profileImage", () => ({
  resolveProfileDisplayName: (u: any) => u?.username || "Unknown",
}));

import { GET, DELETE } from "@/app/api/admin/moderation/lobby-reports/route";

function req(url: string, init?: RequestInit) {
  return new Request(url, init) as any;
}

describe("GET /api/admin/moderation/lobby-reports", () => {
  it("requires a moderator", async () => {
    requireModeratorMock.mockResolvedValue({ ok: false, error: "Forbidden", status: 403 });
    const res = await GET(req("https://aion2lfg.com/api/admin/moderation/lobby-reports"));
    expect(res.status).toBe(403);
  });

  it("enriches reports with owner and reporter names", async () => {
    requireModeratorMock.mockResolvedValue({ ok: true, user: { id: "mod" } });
    getLobbyReportsMock.mockResolvedValue([
      {
        id: "rep-1",
        lobbyId: "lobby-1",
        reporterId: "u2",
        reporterHandle: "h",
        reason: "scam",
        createdAt: 100,
      },
    ]);
    getKVMock.mockImplementation(async (k: string) => {
      if (k === "registeredUsers")
        return [
          { id: "owner-1", username: "legit" },
          { id: "u2", username: "rip" },
        ];
      if (k === "lobbies") return [{ id: "lobby-1", ownerId: "owner-1", title: "Xeptes run", category: "dungeon" }];
      return null;
    });
    const res = await GET(req("https://aion2lfg.com/api/admin/moderation/lobby-reports"));
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.reports).toHaveLength(1);
    expect(json.reports[0].ownerName).toBe("legit");
    expect(json.reports[0].reporterName).toBe("rip");
    expect(json.reports[0].lobbyTitle).toBe("Xeptes run");
  });
});

describe("DELETE /api/admin/moderation/lobby-reports", () => {
  it("dismisses a report for a moderator", async () => {
    requireModeratorMock.mockResolvedValue({ ok: true, user: { id: "mod" } });
    dismissLobbyReportMock.mockResolvedValue(true);
    const res = await DELETE(
      req("https://aion2lfg.com/api/admin/moderation/lobby-reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: "rep-1" }),
      })
    );
    expect(res.status).toBe(200);
    expect(dismissLobbyReportMock).toHaveBeenCalledWith("rep-1");
  });

  it("404s when the report is already gone", async () => {
    requireModeratorMock.mockResolvedValue({ ok: true, user: { id: "mod" } });
    dismissLobbyReportMock.mockResolvedValue(false);
    const res = await DELETE(
      req("https://aion2lfg.com/api/admin/moderation/lobby-reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: "ghost" }),
      })
    );
    expect(res.status).toBe(404);
  });
});