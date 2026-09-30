import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The KV-backed scam-report store. Reports are evidence for the moderation
 * queue only — filing one must never ban anyone by itself.
 */

const { getKVMock, setKVMock, initTablesMock } = vi.hoisted(() => {
  const getKV = vi.fn();
  const setKV = vi.fn();
  const initTables = vi.fn();
  return { getKVMock: getKV, setKVMock: setKV, initTablesMock: initTables };
});

vi.mock("@/lib/db", () => ({
  getKV: getKVMock as any,
  setKV: setKVMock as any,
  initTables: initTablesMock as any,
}));

import { fileLobbyReport, getLobbyReports, dismissLobbyReport } from "@/lib/lobbyReports";

describe("lobby reports store", () => {
  beforeEach(() => {
    getKVMock.mockReset();
    setKVMock.mockReset();
  });

  it("starts empty when the blob is missing", async () => {
    getKVMock.mockResolvedValue(null);
    expect(await getLobbyReports()).toEqual([]);
  });

  it("files a report and persists it", async () => {
    getKVMock.mockResolvedValue([]);
    const r = await fileLobbyReport({
      lobbyId: "lobby-1",
      reporterId: "u2",
      reporterHandle: "h",
      reason: "took payment",
    });
    expect(setKVMock).toHaveBeenCalledTimes(1);
    const stored = (setKVMock as any).mock.calls[0][1];
    expect(stored).toHaveLength(1);
    expect(stored[0].reason).toBe("took payment");
    expect(stored[0].lobbyId).toBe("lobby-1");
    expect(stored[0].reporterId).toBe("u2");
    expect(r.id).toBeTruthy();
  });

  it("dismisses only the matching report", async () => {
    getKVMock.mockResolvedValue([
      { id: "a", lobbyId: "1" },
      { id: "b", lobbyId: "2" },
    ]);
    expect(await dismissLobbyReport("a")).toBe(true);
    expect((setKVMock as any).mock.calls[0][1]).toHaveLength(1);
    expect(await dismissLobbyReport("zz")).toBe(false);
  });
});