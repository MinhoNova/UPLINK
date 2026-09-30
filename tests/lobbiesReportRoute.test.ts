import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The player-facing report route. A player inside a thread flags the offer
 * owner as a scammer; the report lands in the moderation queue and nothing
 * else happens client-side any more.
 */

const { getActiveSessionMock, rateLimitMock, getKVMock, fileLobbyReportMock } = vi.hoisted(() => ({
  getActiveSessionMock: vi.fn(),
  rateLimitMock: vi.fn(),
  getKVMock: vi.fn(),
  fileLobbyReportMock: vi.fn(),
}));

vi.mock("@/lib/authEnv", () => ({ getActiveSession: getActiveSessionMock }));
vi.mock("@/lib/rateLimit", () => ({ rateLimitByUser: rateLimitMock }));
vi.mock("@/lib/db", () => ({ getKV: getKVMock as any }));
vi.mock("@/lib/lobbyReports", () => ({ fileLobbyReport: fileLobbyReportMock }));

import { POST } from "@/app/api/lobbies/report/route";

function post(body: any) {
  return new Request("https://aion2lfg.com/api/lobbies/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

const seeded = [{ id: "lobby-1", ownerId: "owner-1", title: "Xeptes run" }];
const authed = (id: string, name = "x") =>
  ({ session: { user: { id, username: name } }, error: null, status: null });

describe("POST /api/lobbies/report", () => {
  beforeEach(() => fileLobbyReportMock.mockClear());

  it("rejects unauthenticated callers", async () => {
    getActiveSessionMock.mockResolvedValue({ session: null, error: "Unauthorized", status: 401 });
    const res = await POST(post({ lobbyId: "lobby-1", reason: "scam" }));
    expect(res.status).toBe(401);
  });

  it("rejects reports about an offer that does not exist", async () => {
    getActiveSessionMock.mockResolvedValue(authed("u2"));
    rateLimitMock.mockResolvedValue({ ok: true });
    getKVMock.mockResolvedValue(seeded);
    const res = await POST(post({ lobbyId: "ghost", reason: "scam" }));
    expect(res.status).toBe(404);
  });

  it("rejects self-reports", async () => {
    getActiveSessionMock.mockResolvedValue(authed("owner-1"));
    rateLimitMock.mockResolvedValue({ ok: true });
    getKVMock.mockResolvedValue(seeded);
    const res = await POST(post({ lobbyId: "lobby-1", reason: "scam" }));
    expect(res.status).toBe(400);
  });

  it("requires a real reason", async () => {
    getActiveSessionMock.mockResolvedValue(authed("u2"));
    rateLimitMock.mockResolvedValue({ ok: true });
    getKVMock.mockResolvedValue(seeded);
    const res = await POST(post({ lobbyId: "lobby-1", reason: "   " }));
    expect(res.status).toBe(400);
  });

  it("files a valid report into the lobbyReports blob", async () => {
    getActiveSessionMock.mockResolvedValue(authed("u2", "bob"));
    rateLimitMock.mockResolvedValue({ ok: true });
    getKVMock.mockResolvedValue(seeded);
    fileLobbyReportMock.mockResolvedValue({ id: "rep-1", lobbyId: "lobby-1" });
    const res = await POST(post({ lobbyId: "lobby-1", reason: "took payment and vanished" }));
    expect(res.status).toBe(200);
    expect(fileLobbyReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        lobbyId: "lobby-1",
        reporterId: "u2",
        reason: "took payment and vanished",
      })
    );
    const json: any = await res.json();
    expect(json.success).toBe(true);
  });

  it("rate-limits report filing", async () => {
    getActiveSessionMock.mockResolvedValue(authed("u2"));
    rateLimitMock.mockResolvedValue({ ok: false });
    const res = await POST(post({ lobbyId: "lobby-1", reason: "scam" }));
    expect(res.status).toBe(429);
    expect(fileLobbyReportMock).not.toHaveBeenCalled();
  });
});