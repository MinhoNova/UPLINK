import { describe, it, expect, vi } from "vitest";

/**
 * Traffic counters are read by the admin panel. The read endpoint used to
 * answer any caller, so the site's traffic numbers were readable by anyone
 * with a network tab — no account, no session, no role. `POST` must stay open:
 * that is how a page view is counted at all.
 */
const { getAppSessionMock, getKVMock, setKVMock } = vi.hoisted(() => ({
  getAppSessionMock: vi.fn(),
  getKVMock: vi.fn(async (): Promise<any> => 0),
  setKVMock: vi.fn(async () => {}),
}));

vi.mock("@/lib/db", () => ({ getKV: getKVMock as any, setKV: setKVMock as any }));
vi.mock("@/lib/authEnv", () => ({ getAppSession: getAppSessionMock as any }));

import { GET, POST } from "@/app/api/analytics/view/route";

const asAdmin = () => getAppSessionMock.mockResolvedValue({ user: { id: "1", role: "admin" } } as any);
const asPlayer = () => getAppSessionMock.mockResolvedValue({ user: { id: "2", role: "" } } as any);
const asAnon = () => getAppSessionMock.mockResolvedValue(null as any);

describe("GET /api/analytics/view", () => {
  it("refuses an anonymous reader", async () => {
    asAnon();
    const res = await GET(new Request("http://localhost/api/analytics/view") as any);
    expect(res.status).toBe(403);
  });

  it("refuses a signed-in non-admin", async () => {
    asPlayer();
    const res = await GET(new Request("http://localhost/api/analytics/view") as any);
    expect(res.status).toBe(403);
  });

  it("still serves the admin panel", async () => {
    asAdmin();
    const res = await GET(new Request("http://localhost/api/analytics/view") as any);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/analytics/view", () => {
  it("stays open — a page view is counted without a session", async () => {
    getKVMock.mockResolvedValue(0);
    asAnon();
    const res = await POST(new Request("http://localhost/api/analytics/view", { method: "POST" }) as any);
    expect(res.status).toBe(200);
  });
});
