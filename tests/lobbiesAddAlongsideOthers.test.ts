import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression: a player could not add their own offer at all.
 *
 * The client PUTs the whole lobby array it holds, so the payload always contains
 * other people's offers. The server merges that snapshot over the store and then
 * ran `validateLobbies` on the merged result. Any lobby the writer did not own
 * compared unequal to the stored copy — because the client's copy comes from a
 * different read path and lacks private fields like `messages` — and the
 * validator answered "Cannot modify lobby you are not part of". That rejected
 * the whole request, so the new offer was never created and the player was left
 * with no way to submit one.
 *
 * The fix drops the caller's copy of any lobby they may not modify and keeps the
 * stored version. A foreign offer stays untouchable — more strictly than before,
 * since even a byte-identical forgery is now ignored — while the write the player
 * actually made goes through.
 */

const ME = "1472005392849703025";
const OTHER = "711027724663128106";

const { LOBBIES, atomicMock, getKVMock } = vi.hoisted(() => {
  const lobbies = [
    // Someone else's live offer, carrying private chat the caller never sees.
    { id: "1790139137329", ownerId: "711027724663128106", status: "standby", accepted: [], applicants: [], messages: [{ id: 1, text: "private" }] },
  ];
  const mock = vi.fn(async (_key: string, mutator: (c: any[] | null) => any) => {
    const next = mutator(lobbies.map((l) => ({ ...l })));
    if (next === undefined) return { ok: false };
    lobbies.length = 0;
    lobbies.push(...next);
    return { ok: true, value: next };
  });
  const getKV = vi.fn(async (_key: string) => null as any);
  return { LOBBIES: lobbies, atomicMock: mock, getKVMock: getKV };
});

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  getKV: (key: string) => getKVMock(key),
  updateKVAtomic: (key: string, mutator: (c: any[] | null) => any) => atomicMock(key, mutator),
}));
vi.mock("@/lib/banCheck", () => ({ addUserBan: vi.fn(async () => {}) }));
vi.mock("@/lib/auditLog", () => ({ logAudit: vi.fn(async () => {}) }));
// Covered by tests/posterApproval.test.ts; stubbed so this file stays focused on
// the merge behaviour it was written to protect.
vi.mock("@/lib/posterApproval", () => ({
  getPosterStanding: vi.fn(async () => ({ allowed: true, reason: "approved" })),
}));
vi.mock("@/lib/offerDailyLimit", () => ({
  checkAndRecordOfferCreate: vi.fn(async () => ({ ok: true })),
  offerCreateLimitError: () => "limit",
}));

async function put(asUser: string, lobbies: any[], role = "user") {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({
    ok: true,
    user: { id: asUser, username: asUser, role },
  });
  const { PUT } = await import("@/app/api/lobbies/route");
  const res = await PUT(
    new Request("https://x/api/lobbies", {
      method: "PUT",
      body: JSON.stringify({ lobbies }),
      headers: { "Content-Type": "application/json" },
    }) as any
  );
  return { status: res.status, body: (await res.json()) as any };
}

/** The class offer the player is trying to submit. */
const myClassOffer = {
  id: "1790140999999",
  ownerId: ME,
  ownerHandle: "leonknox1",
  className: "Spiritmaster",
  status: "standby",
  accepted: [],
  applicants: [],
  messages: [],
};

/** Another player's offer as the client holds it: no `messages`, no chat. */
const theirOfferAsClientSeesIt = {
  id: "1790139137329",
  ownerId: OTHER,
  status: "standby",
  accepted: [],
  applicants: [],
};

beforeEach(() => {
  LOBBIES.length = 0;
  LOBBIES.push({
    id: "1790139137329",
    ownerId: "711027724663128106",
    status: "standby",
    accepted: [],
    applicants: [],
    messages: [{ id: 1, text: "private" }],
  });
  atomicMock.mockClear();
});

describe("adding an offer alongside other players' offers", () => {
  it("creates the offer instead of failing the whole save", async () => {
    const { status } = await put(ME, [theirOfferAsClientSeesIt, myClassOffer]);

    expect(status).toBe(200);
    expect(LOBBIES.some((l: any) => l.id === myClassOffer.id)).toBe(true);
  });

  it("keeps the stored version of the other player's offer", async () => {
    await put(ME, [theirOfferAsClientSeesIt, myClassOffer]);

    const stored = LOBBIES.find((l: any) => l.id === "1790139137329") as any;
    expect(stored.messages).toEqual([{ id: 1, text: "private" }]);
  });

  it("still refuses to let the caller rewrite a foreign offer", async () => {
    await put(ME, [
      { ...theirOfferAsClientSeesIt, ownerId: ME },
      myClassOffer,
    ]);

    const stored = LOBBIES.find((l: any) => l.id === "1790139137329") as any;
    // Silently ignored rather than honoured.
    expect(stored.ownerId).toBe(OTHER);
  });

  it("never drops the other player's offer when the caller's copy omits it", async () => {
    // The PUT route merges over the store, so a lobby missing from the payload
    // is re-added from storage rather than deleted. Deletion has its own route;
    // what matters here is that omitting a foreign offer cannot remove it.
    const { status } = await put(ME, [myClassOffer]);

    expect(status).toBe(200);
    expect(LOBBIES.some((l: any) => l.id === "1790139137329")).toBe(true);
  });

  it("still lets the owner edit their own offer", async () => {
    const { status } = await put(OTHER, [{ ...theirOfferAsClientSeesIt, status: "completed" }]);

    expect(status).toBe(200);
    expect((LOBBIES.find((l: any) => l.id === "1790139137329") as any).status).toBe("completed");
  });
});
