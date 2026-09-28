import { describe, it, expect, vi } from "vitest";

/**
 * The thread endpoint is the only place that decides whether a mission thread
 * may be read, so these tests pin the two things that matter: a member gets a
 * small family-scoped payload, and a stranger gets nothing.
 */

const OWNER = "711027724663128106";
const MEMBER = "member-1";
const STRANGER = "stranger-9";

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  getKV: vi.fn(async (key: string) => {
    if (key === "lobbies") return LOBBIES;
    if (key === "registeredUsers") return USERS;
    return null;
  }),
}));

const base = (over: Record<string, unknown> = {}): any => ({
  id: "900",
  ownerId: OWNER,
  parentId: null,
  status: "standby",
  messages: [],
  accepted: [],
  invited: [],
  applicants: [],
  history: [],
  ...over,
});

const LOBBIES: any[] = [
  base({ id: "900", messages: [{ id: 1, text: "hello" }] }),
  base({ id: "901", parentId: "900", messages: [{ id: 1, text: "hello" }] }),
  base({ id: "902", ownerId: "999-other", messages: [{ id: 5, text: "not yours" }] }),
];

const USERS = [
  { id: OWNER, username: "omarsaleh97", displayName: "Omar Saleh", email: "secret@example.com" },
  { id: MEMBER, username: "member1" },
  { id: "999-other", username: "someone" },
];

async function call(id: string, userId: string) {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({ ok: true, user: { id: userId, username: "whoever" } });
  const { GET } = await import("@/app/api/lobbies/thread/route");
  const res = await GET(new Request(`https://x/api/lobbies/thread?id=${id}`));
  return { status: res.status, body: (await res.json()) as any };
}

describe("GET /api/lobbies/thread", () => {
  it("lets the owner read their own thread and its split siblings", async () => {
    const { status, body } = await call("900", OWNER);
    expect(status).toBe(200);
    const ids = body.lobbies.map((l: any) => String(l.id)).sort();
    expect(ids).toEqual(["900", "901"]);
  });

  it("never returns another offer's thread", async () => {
    const { body } = await call("900", OWNER);
    const texts = JSON.stringify(body.lobbies);
    expect(texts).not.toContain("not yours");
  });

  it("refuses a stranger", async () => {
    const { status } = await call("900", STRANGER);
    expect(status).toBe(403);
  });

  it("refuses an applicant who never played the mission", async () => {
    LOBBIES[0].applicants = [{ applicantId: STRANGER }];
    try {
      const { status } = await call("900", STRANGER);
      expect(status).toBe(403);
    } finally {
      LOBBIES[0].applicants = [];
    }
  });

  it("returns only the profiles on the thread, and no private fields", async () => {
    const { body } = await call("900", OWNER);
    const ids = body.registeredUsers.map((u: any) => String(u.id));
    expect(ids).not.toContain("999-other");
    const owner = body.registeredUsers.find((u: any) => String(u.id) === OWNER);
    expect(owner.email).toBeUndefined();
  });

  it("resolves a split sibling by suffix and checks the right record", async () => {
    const { status, body } = await call("901", OWNER);
    expect(status).toBe(200);
    expect(body.lobbies.length).toBe(2);
  });

  it("404s an unknown id", async () => {
    const { status } = await call("does-not-exist", OWNER);
    expect(status).toBe(404);
  });

  it("400s a missing id", async () => {
    const { requireSession } = await import("@/lib/authz");
    (requireSession as any).mockResolvedValue({ ok: true, user: { id: OWNER, username: "x" } });
    const { GET } = await import("@/app/api/lobbies/thread/route");
    const res = await GET(new Request("https://x/api/lobbies/thread"));
    expect(res.status).toBe(400);
  });

  it("401s without a session", async () => {
    const { requireSession } = await import("@/lib/authz");
    (requireSession as any).mockResolvedValue({ ok: false, error: "Unauthorized", status: 401 });
    const { GET } = await import("@/app/api/lobbies/thread/route");
    const res = await GET(new Request("https://x/api/lobbies/thread?id=900"));
    expect(res.status).toBe(401);
  });
});
