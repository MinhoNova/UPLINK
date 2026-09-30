import { describe, it, expect, vi } from "vitest";

/**
 * Removing a member from an offer that is already finished.
 *
 * Kicks used to be hidden in the UI for `completed` / `unpaid` /
 * `payment_pending` / `cancelled` offers, which locked the owner out of a
 * correction they genuinely need: a scammer still sitting on the roster, or a
 * member who was never really on it, and the very common case of an old
 * completed offer whose only member has to come off so the owner can settle the
 * payment proof alone.
 *
 * The block existed for a real reason, and it is not the roster. A member exit
 * that carries completed runs splits the offer and republishes the remainder
 * as a new active offer — on an already-paid offer that chains one payout into
 * endless fresh ones, and on an unpaid one it dodges paying for runs already
 * played. So the roster edit is allowed and the run count is pinned to zero,
 * here on the server, which is the real boundary.
 */

const OWNER = "owner-1";
const MEMBER = { id: 1, userId: "mate-7", aionClass: "healer", status: "confirmed" };

const { LOBBIES, atomicMock } = vi.hoisted(() => {
  const lobbies: any[] = [
    {
      id: "700",
      ownerId: "owner-1",
      status: "completed",
      payoutStatus: "paid",
      runsCount: 3,
      selectedDungeons: { Necropolis: 3 },
      goldPerRun: 100,
      roles: { healer: 1, tank: 1 },
      accepted: [{ id: 1, userId: "mate-7", aionClass: "healer", applicantId: "mate-7", status: "confirmed" }],
      applicants: [],
      history: [],
      messages: [],
    },
    {
      id: "800",
      ownerId: "owner-1",
      status: "in_progress",
      runsCount: 3,
      selectedDungeons: { Necropolis: 3 },
      goldPerRun: 100,
      roles: { healer: 1, tank: 1 },
      accepted: [{ id: 2, userId: "mate-7", aionClass: "healer", applicantId: "mate-7", status: "confirmed" }],
      applicants: [],
      history: [],
      messages: [],
    },
  ];
  const mock = vi.fn(async (_key: string, mutator: (c: any[] | null) => any) => {
    const next = mutator(JSON.parse(JSON.stringify(lobbies)));
    if (next === undefined) return { ok: false };
    return { ok: true, value: next };
  });
  return { LOBBIES: lobbies, atomicMock: mock };
});

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  getKV: vi.fn(async () => null as any),
  updateKVAtomic: (key: string, mutator: (c: any[] | null) => any) => atomicMock(key, mutator),
}));

async function kick(lobbyId: string, completed: number, asUser = OWNER, role = "user") {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({
    ok: true,
    user: { id: asUser, username: asUser, role },
  });
  const { POST } = await import("@/app/api/lobbies/split-exit/route");
  const res = await POST(
    new Request("https://x/api/lobbies/split-exit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lobbyId,
        member: { ...MEMBER },
        completed,
        isKick: true,
        leaveMsg: { id: 9, fromId: asUser, text: "removed", time: "now" },
        historySnapshot: completed > 0 ? { ...MEMBER, runsAtExit: completed, leftAt: 1, reason: "kicked" } : undefined,
      }),
    })
  );
  return { status: res.status, body: (await res.json()) as any };
}

describe("member exit on a finished offer", () => {
  it("lets the owner take the member off a completed offer (roster correction)", async () => {
    const res = await kick("700", 0);
    expect(res.status).toBe(200);
    const lobby = res.body.lobbies.find((l: any) => String(l.id) === "700");
    expect(lobby.accepted).toHaveLength(0);
    // The correction is auditable: the removal is written into the thread.
    expect(String(lobby.messages.at(-1).text)).toContain("removed");
  });

  it("refuses to attribute runs to a member on a completed offer (no resurrection)", async () => {
    const res = await kick("700", 2);
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/already finished/i);
    // Nothing was written, and no new offer was published.
    const still = LOBBIES.find((l) => l.id === "700")!;
    expect(still.accepted).toHaveLength(1);
    expect(LOBBIES.map((l) => String(l.id))).toEqual(["700", "800"]);
  });

  it("still allows a real run-bearing exit while the mission is live", async () => {
    const res = await kick("800", 1);
    expect(res.status).toBe(200);
    const parent = res.body.lobbies.find((l: any) => String(l.id) === "800");
    expect(parent.status).toBe("unpaid");
    // The runs that were not played are republished as a new child offer.
    const child = res.body.childLobby;
    expect(child).toBeTruthy();
    expect(child.runsCount).toBe(2);
    expect(child.parentId).toBe("800");
  });

  it("a stranger still cannot kick on a finished offer", async () => {
    const res = await kick("700", 0, "stranger-9");
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/not allowed/i);
  });
});
