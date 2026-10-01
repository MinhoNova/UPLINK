import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * End-to-end over the real `/api/data` write path: a member applying to an
 * offer has to leave behind server-owned proof, because that proof — not
 * anything on the lobby row — is what lets them be credited run rank when the
 * owner settles the payout.
 *
 * The unit tests in `rankRosterProof.test.ts` cover the rule. What only shows up
 * here is the wiring: the proof is stamped from the caller's own session, it
 * survives into the stored blob where the client cannot reach it, and an owner
 * cannot mint one for a stranger in the same request that settles the payout.
 */

const OWNER = "owner-1";
const MEMBER = "member-real";
const BYSTANDER = "bystander-id";

const store = vi.hoisted(() => ({
  kv: {} as Record<string, any>,
  lobbies: [] as any[],
  users: [] as any[],
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimitByIp: vi.fn(async () => ({ ok: true })),
  rateLimitByUser: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/rateLimitHttp", () => ({ rateLimitResponse: () => new Response("{}", { status: 429 }) }));
vi.mock("@/lib/authz", () => ({ requireSession: vi.fn() }));
/**
 * `getKVPairs` has to answer from the same store `setKV` writes, the way D1
 * does. Returning a frozen fixture instead would let a replay recompute the
 * award from pre-award stats and roll the counters back, which the real server
 * cannot do.
 */
vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  getKVPairs: vi.fn(async () => ({
    lobbies: store.kv.lobbies ?? store.lobbies,
    registeredUsers: store.kv.registeredUsers ?? store.users,
  })),
  getKV: vi.fn(async (k: string) => store.kv[k] ?? null),
  setKV: vi.fn(async (k: string, v: any) => {
    store.kv[k] = v;
  }),
  // The daily-apply counter is checked and recorded through the atomic helper
  // on every application; without a faithful one the apply is rejected as if
  // the limit had been hit. Returning `undefined` from the updater is how the
  // real helper reports "abort, cap reached".
  updateKVAtomic: vi.fn(async (k: string, updater: (cur: any) => any) => {
    const next = updater(store.kv[k] ?? null);
    if (next === undefined) return { ok: false };
    store.kv[k] = next;
    return { ok: true, value: next };
  }),
}));
vi.mock("@/lib/identitySync", () => ({ repairIdentity: vi.fn(async () => ({ me: { username: "x" } })) }));
vi.mock("@/lib/banCheck", () => ({
  isUserBanned: vi.fn(async () => false),
  getBanInfo: vi.fn(async () => null),
  bannedResponse: () => new Response("banned", { status: 403 }),
}));
vi.mock("@/lib/ipBan", () => ({ rejectIfIpBannedUnlessAdmin: vi.fn(async () => null) }));
vi.mock("@/lib/userLastIp", () => ({ touchUserLastIp: vi.fn(async () => {}) }));
vi.mock("@/lib/auditLog", () => ({ logAudit: vi.fn(async () => {}) }));
vi.mock("@/lib/paymentFraud", () => ({ recordPaymentFraudAttempt: vi.fn(async () => null) }));
vi.mock("@/lib/marketPrice", () => ({
  recordMarketCompletion: vi.fn(async () => {}),
  getMarketAverageByService: vi.fn(() => ({})),
}));
vi.mock("@/lib/cloudflareBindings", () => ({
  getPublicDataCached: vi.fn(async () => null),
  setPublicDataCached: vi.fn(async () => {}),
  FULL_DATA_CACHE_KEY: "full",
}));
vi.mock("@/lib/dataAccess", () => ({ filterDataForUser: (d: any) => d }));

async function as(uid: string, role = "user") {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({ ok: true, user: { id: uid, username: uid, role } });
}

/**
 * The client PUTs the whole blob it holds, so that is what a save looks like.
 * It reads `registeredUsers` back from storage rather than from the fixture,
 * because the real client's copy is refreshed on every poll — replaying a stale
 * one would roll the awarded stats back and hide what is being tested.
 */
function save(lobbies: any[], users = store.kv.registeredUsers || store.users) {
  return import("@/app/api/data/route").then((m) =>
    m.POST(
      new Request("https://x/api/data", {
        method: "POST",
        body: JSON.stringify({ lobbies, registeredUsers: users }),
        headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
      }) as any
    )
  );
}

function user(id: string) {
  return { id, username: id, stats: { total: 0, postCount: 0 } };
}

/** A fixed cutover well before the fixture offer, so the strict gate applies. */
const CUTOVER = 1_000_000;
const CREATED = 2_000_000;

function offer(over: any = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    category: "dungeon",
    keyLevel: "+10",
    serviceName: "Powerleveling",
    pricePerRun: 0,
    title: "Powerleveling",
    status: "standby",
    payoutStatus: "unpaid",
    // Created after the cutover, so its members need server-stamped proof. Left
    // undated, the offer would fall into the legacy window instead.
    createdAt: CREATED,
    accepted: [],
    applicants: [],
    invited: [],
    messages: [],
    ...over,
  } as any;
}

/** What is actually stored, as the client would read it back. */
function storedLobby(id = "lobby-1") {
  return (store.kv.lobbies || store.lobbies).find((l: any) => String(l.id) === id);
}

/**
 * The route writes the awarded accounts back through the same blob the client
 * reads, so the stats to assert on are the ones in `kv_store` — not the fixture
 * array the request was built from.
 */
function storedUser(id: string) {
  return (store.kv.registeredUsers || []).find((u: any) => String(u.id) === id);
}

beforeEach(async () => {
  store.kv = { rankProofCutover: CUTOVER };
  store.lobbies = [offer()];
  store.users = [user(OWNER), user(MEMBER), user(BYSTANDER)];
  vi.clearAllMocks();
});

describe("a real application leaves proof the client cannot forge", () => {
  it("records proof when the member applies from their own session", async () => {
    await as(MEMBER);
    const res = await save([offer({ applicants: [{ applicantId: MEMBER, applicantNote: "me" }] })]);
    if (res.status !== 200) throw new Error(`status ${res.status}: ${await res.clone().text()}`);
    expect(res.status).toBe(200);
    expect(store.kv.rankRosterProof).toEqual({ "lobby-1": [MEMBER] });
  });

  it("stamps the cutover once, so the legacy window has a fixed start", async () => {
    await as(MEMBER);
    await save([offer({ applicants: [{ applicantId: MEMBER }] })]);
    const first = store.kv.rankProofCutover;
    expect(typeof first).toBe("number");
    await save([offer({ applicants: [{ applicantId: MEMBER }] })]);
    expect(store.kv.rankProofCutover).toBe(first);
  });

  it("keeps the proof out of the payload the client reads back", async () => {
    await as(MEMBER);
    await save([offer({ applicants: [{ applicantId: MEMBER }] })]);
    expect(storedLobby()!.rankRosterProof).toBeUndefined();
    expect(storedLobby()!.rankProofCutover).toBeUndefined();
  });
});

describe("an owner cannot mint rank for somebody who never joined", () => {
  it("gives no rank for a stranger pasted into accepted alongside applicants", async () => {
    await as(OWNER);
    const res = await save([
      offer({
        status: "completed",
        payoutStatus: "paid",
        accepted: [{ id: BYSTANDER, applicantId: BYSTANDER, status: "accepted" }],
        applicants: [{ applicantId: BYSTANDER }],
      }),
    ]);
    expect(res.status).toBe(200);
    // The owner is credited for their own run; the stranger is not credited at all.
    expect(storedUser(OWNER).stats.total).toBe(1);
    expect(storedUser(BYSTANDER).stats.total).toBe(0);
  });

  it("still credits the owner for settling a run a real member was on", async () => {
    await as(MEMBER);
    await save([offer({ applicants: [{ applicantId: MEMBER }] })]);
    await as(OWNER);
    const res = await save([
      offer({
        applicants: [{ applicantId: MEMBER }],
        accepted: [{ id: MEMBER, applicantId: MEMBER }],
        status: "completed",
        payoutStatus: "paid",
      }),
    ]);
    expect(res.status).toBe(200);
    expect(storedUser(OWNER).stats.total).toBe(1);
  });

  it("refuses a solo payout outright, before rank is ever considered", async () => {
    await as(OWNER);
    const res = await save([offer({ status: "completed", payoutStatus: "paid" })]);
    // An offer with no member and no mission record is rejected as suspected
    // fraud, and counted as an attempt. That gate is upstream of the award.
    if (res.status !== 403) throw new Error(`status ${res.status}: ${await res.clone().text()}`);
    expect(storedUser(OWNER)).toBeUndefined();
  });

  it("stamps no proof for anybody while the owner is the caller", async () => {
    await as(OWNER);
    await save([offer({ applicants: [{ applicantId: MEMBER }, { applicantId: BYSTANDER }] })]);
    expect(store.kv.rankRosterProof ?? {}).toEqual({});
  });
});

describe("a proved member is credited when the owner settles up", () => {
  it("counts the run for the owner and the member who applied", async () => {
    await as(MEMBER);
    await save([offer({ applicants: [{ applicantId: MEMBER }] })]);

    await as(OWNER);
    const res = await save([
      offer({
        applicants: [{ applicantId: MEMBER }],
        accepted: [{ id: MEMBER, applicantId: MEMBER }],
        status: "completed",
        payoutStatus: "paid",
      }),
    ]);
    expect(res.status).toBe(200);
    expect(storedUser(OWNER).stats.total).toBe(1);
    expect(storedUser(MEMBER).stats.total).toBe(1);
    expect(storedUser(MEMBER).stats.dungeonTotal).toBe(1);
  });

  it("drops the stranger pasted in beside the real member", async () => {
    await as(MEMBER);
    await save([offer({ applicants: [{ applicantId: MEMBER }] })]);

    await as(OWNER);
    await save([
      offer({
        applicants: [{ applicantId: MEMBER }],
        accepted: [
          { id: MEMBER, applicantId: MEMBER },
          { id: BYSTANDER, applicantId: BYSTANDER, status: "accepted" },
        ],
        status: "completed",
        payoutStatus: "paid",
      }),
    ]);
    expect(storedUser(MEMBER).stats.total).toBe(1);
    expect(storedUser(BYSTANDER).stats.total).toBe(0);
  });

  it("cannot pay the same run twice, even with proof behind it", async () => {
    await as(MEMBER);
    await save([offer({ applicants: [{ applicantId: MEMBER }] })]);

    const paid = offer({
      applicants: [{ applicantId: MEMBER }],
      accepted: [{ id: MEMBER, applicantId: MEMBER }],
      status: "completed",
      payoutStatus: "paid",
    });
    await as(OWNER);
    const first = await save([paid]);
    if (first.status !== 200) throw new Error(`first: ${first.status} ${await first.clone().text()}`);

    // Replay: clear the readable marker and try again.
    const replay = await save([{ ...paid, rankAwardedBooster: false }]);
    if (replay.status !== 200) throw new Error(`replay: ${replay.status} ${await replay.clone().text()}`);
    expect(storedUser(MEMBER).stats.total).toBe(1);
  });

  it("forgets the proof once the offer is settled, so the blob does not grow forever", async () => {
    await as(MEMBER);
    await save([offer({ applicants: [{ applicantId: MEMBER }] })]);
    expect(store.kv.rankRosterProof).toBeDefined();

    await as(OWNER);
    await save([
      offer({
        applicants: [{ applicantId: MEMBER }],
        accepted: [{ id: MEMBER, applicantId: MEMBER }],
        status: "completed",
        payoutStatus: "paid",
      }),
    ]);
    expect(store.kv.rankRosterProof).toEqual({});
  });
});
