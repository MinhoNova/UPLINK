import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Accepting an invite is the one way to join an offer without applying first, so
 * it is the one place the server has to vouch for a member on its own.
 *
 * It is also a separate route on purpose: `POST /api/lobbies/invite-respond`
 * resolves the member from the session, finds their row inside the stored blob,
 * and promotes it inside a single atomic rewrite. Nothing about that transition
 * is reachable from a normal data write — `clampMemberWrite` drops exactly the
 * self-promotion it performs, because an unaccepted invite confers squad
 * standing and thread access. So the proof has to be recorded here, where the
 * server already knows the member acted, rather than inferred from the roster
 * marks afterwards. Those marks are owner-writable.
 */

const OWNER = "owner-1";
const MEMBER = "member-real";
const STRANGER = "bystander-id";

const store = vi.hoisted(() => ({
  kv: {} as Record<string, any>,
  lobbies: [] as any[],
  auth: null as any,
}));

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn(async () => store.auth) }));
vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  getKV: vi.fn(async (k: string) => store.kv[k] ?? null),
  setKV: vi.fn(async (k: string, v: any) => {
    store.kv[k] = v;
  }),
  // Mirrors the real helper: the updater returns `undefined` to abort, and
  // either way the stored blob is left exactly as it was.
  updateKVAtomic: vi.fn(async (k: string, updater: (cur: any) => any) => {
    const next = updater(store.kv[k] ?? null);
    if (next === undefined) return { ok: false };
    store.kv[k] = next;
    return { ok: true, value: next };
  }),
}));

async function as(uid: string, role = "user") {
  store.auth = { ok: true, user: { id: uid, username: uid, role } };
}

function inviteRow(over: any = {}) {
  return { id: MEMBER, applicantId: MEMBER, name: "Real", status: "invited", inviteExpiresAt: Date.now() + 60_000, ...over };
}

function offer(over: any = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    title: "Powerleveling",
    category: "dungeon",
    status: "standby",
    payoutStatus: "unpaid",
    roles: {},
    accepted: [inviteRow()],
    applicants: [],
    ...over,
  } as any;
}

function respond(body: any) {
  return import("@/app/api/lobbies/invite-respond/route").then((m) =>
    m.POST(
      new Request("https://x/api/lobbies/invite-respond", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      })
    )
  );
}

function storedLobby(id = "lobby-1") {
  return (store.kv.lobbies || []).find((l: any) => String(l.id) === id);
}

beforeEach(() => {
  // The route reads the blob through `updateKVAtomic("lobbies", …)`, so the
  // fixture has to be in the KV store itself, not beside it.
  store.lobbies = [offer()];
  store.kv = { lobbies: store.lobbies };
  vi.clearAllMocks();
});

describe("accepting an invite is proof the server can vouch for", () => {
  it("records proof for the member who accepted", async () => {
    await as(MEMBER);
    const res = await respond({ lobbyId: "lobby-1", action: "accept" });
    expect(res.status).toBe(200);
    expect(store.kv.rankRosterProof).toEqual({ "lobby-1": [MEMBER] });
  });

  it("records no proof for a decline", async () => {
    await as(MEMBER);
    const res = await respond({ lobbyId: "lobby-1", action: "decline" });
    expect(res.status).toBe(200);
    expect(store.kv.rankRosterProof ?? {}).toEqual({});
  });

  it("keeps the proof out of the lobby row the client reads back", async () => {
    await as(MEMBER);
    await respond({ lobbyId: "lobby-1", action: "accept" });
    expect(storedLobby()!.rankRosterProof).toBeUndefined();
  });

  it("promotes the member out of the invited state", async () => {
    await as(MEMBER);
    await respond({ lobbyId: "lobby-1", action: "accept" });
    const row = (storedLobby()!.accepted || []).find((m: any) => m.id === MEMBER);
    expect(row.status).not.toBe("invited");
  });

  it("records nothing when somebody who was never invited tries to accept", async () => {
    await as(STRANGER);
    const res = await respond({ lobbyId: "lobby-1", action: "accept" });
    expect(res.status).toBe(409);
    expect(store.kv.rankRosterProof ?? {}).toEqual({});
  });

  it("records nothing when the owner tries to accept their own invite", async () => {
    store.lobbies = [offer({ ownerId: MEMBER })];
    store.kv.lobbies = store.lobbies;
    await as(MEMBER);    const res = await respond({ lobbyId: "lobby-1", action: "accept" });
    expect(res.status).toBe(409);
    expect(store.kv.rankRosterProof ?? {}).toEqual({});
  });

  it("refuses an unknown offer without recording anything", async () => {
    await as(MEMBER);
    const res = await respond({ lobbyId: "does-not-exist", action: "accept" });
    expect(res.status).toBe(409);
    expect(store.kv.rankRosterProof ?? {}).toEqual({});
  });

  it("refuses a malformed request outright", async () => {
    await as(MEMBER);
    expect((await respond({ lobbyId: "lobby-1", action: "delete" })).status).toBe(400);
    expect((await respond({ action: "accept" })).status).toBe(400);
  });

  it("rejects a member with no session at all", async () => {
    store.auth = { ok: false, error: "Not signed in", status: 401 };
    const res = await respond({ lobbyId: "lobby-1", action: "accept" });
    expect(res.status).toBe(401);
    expect(store.kv.rankRosterProof ?? {}).toEqual({});
  });

  it("is idempotent: a second accept cannot add the member twice", async () => {
    await as(MEMBER);
    await respond({ lobbyId: "lobby-1", action: "accept" });
    const second = await respond({ lobbyId: "lobby-1", action: "accept" });
    // The invite is gone, so the retry is refused — and either way the stored
    // list holds the member once.
    expect(second.status).toBe(409);
    expect(store.kv.rankRosterProof).toEqual({ "lobby-1": [MEMBER] });
  });

  it("keeps the proof of another offer that is still in flight", async () => {
    const other = { ...offer({ id: "other-lobby", ownerId: STRANGER }), accepted: [], applicants: [] };
    store.lobbies = [offer(), other];
    store.kv.lobbies = store.lobbies;
    store.kv.rankRosterProof = { "other-lobby": [STRANGER] };
    await as(MEMBER);
    await respond({ lobbyId: "lobby-1", action: "accept" });
    expect(store.kv.rankRosterProof["other-lobby"]).toEqual([STRANGER]);
    expect(store.kv.rankRosterProof["lobby-1"]).toEqual([MEMBER]);
  });

  it("drops proof for an offer that is no longer in the store", async () => {
    // The route reads the whole blob inside the atomic rewrite, so the prune
    // sees every live offer and can safely forget ones that are gone.
    store.kv.rankRosterProof = { "deleted-lobby": [STRANGER] };
    await as(MEMBER);
    await respond({ lobbyId: "lobby-1", action: "accept" });
    expect(store.kv.rankRosterProof["deleted-lobby"]).toBeUndefined();
  });

  it("does not lose proof when the store holds a corrupt blob", async () => {
    store.kv.rankRosterProof = "not-an-object";
    store.kv.lobbies = store.lobbies;
    await as(MEMBER);
    const res = await respond({ lobbyId: "lobby-1", action: "accept" });
    expect(res.status).toBe(200);
    expect(store.kv.rankRosterProof).toEqual({ "lobby-1": [MEMBER] });
  });
});
