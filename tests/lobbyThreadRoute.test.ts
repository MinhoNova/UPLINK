import { describe, it, expect, vi } from "vitest";

/**
 * The thread endpoint is the only place that decides whether a mission thread
 * may be read, so these tests pin the two things that matter: a member gets a
 * small family-scoped payload, and a stranger gets nothing.
 */

const OWNER = "711027724663128106";
const MEMBER = "member-1";
const STRANGER = "stranger-9";

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn(), isAdminUser: vi.fn(async () => false) }));
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

async function call(id: string, userId: string, admin = false) {
  const { requireSession, isAdminUser } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({ ok: true, user: { id: userId, username: "whoever" } });
  (isAdminUser as any).mockResolvedValue(admin);
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

  it("lets a site admin open any thread, even one they do not own", async () => {
    // The client always allowed admins in, so the server has to agree or the
    // thread page falls back to /api/data for every moderator.
    const { status, body } = await call("902", "admin-1", true);
    expect(status).toBe(200);
    expect(body.lobbies.map((l: any) => String(l.id))).toContain("902");
  });

  it("still refuses a non-admin stranger even when the id exists", async () => {
    const { status } = await call("902", STRANGER, false);
    expect(status).toBe(403);
  });

  it("keeps inline base64 media out of a media-free seed", async () => {
    // A server-rendered thread inlines the payload into the HTML; pasted chat
    // images ride along as data URLs and pushed the worker past its limits.
    const { loadOfferThread } = await import("@/lib/offerThread");
    LOBBIES[0].messages = [
      { id: 1, text: "hi", image: `data:image/png;base64,${"A".repeat(200000)}` },
    ];
    try {
      const lite = await loadOfferThread(
        "900",
        { id: OWNER, username: "whoever" },
        false,
        { omitMedia: true }
      );
      expect(lite.ok).toBe(true);
      if (lite.ok) {
        expect(lite.data.mediaOmitted).toBe(true);
        expect(lite.data.lobbies[0].messages[0].image).toBeNull();
        expect(lite.data.lobbies[0].messages[0].text).toBe("hi");
        expect(JSON.stringify(lite.data).length).toBeLessThan(5000);
      }
    } finally {
      LOBBIES[0].messages = [{ id: 1, text: "hello" }];
    }
  });

  it("still returns the full media to an API client that can take it", async () => {
    const { loadOfferThread } = await import("@/lib/offerThread");
    const dataUrl = `data:image/png;base64,${"B".repeat(1000)}`;
    LOBBIES[0].messages = [{ id: 1, text: "pic", image: dataUrl }];
    try {
      const full = await loadOfferThread("900", { id: OWNER, username: "whoever" }, false);
      expect(full.ok).toBe(true);
      if (full.ok) {
        expect(full.data.mediaOmitted).toBe(false);
        expect(full.data.lobbies[0].messages[0].image).toBe(dataUrl);
      }
    } finally {
      LOBBIES[0].messages = [{ id: 1, text: "hello" }];
    }
  });

  it("ships the admin verdict so the client cannot second-guess it", async () => {
    // The payload has to carry `admin`. The client gate reads it, and without
    // it the page redacts a thread the server just released — which is the
    // whole bug this test is here for.
    const { clientCanViewOfferThread } = await import("@/lib/threadAccess");
    const { status, body } = await call("902", "admin-1", true);
    expect(status).toBe(200);
    expect(body.admin).toBe(true);

    const seed = body.lobbies.find((l: any) => String(l.id) === "902");
    const clientSaysYes = clientCanViewOfferThread(seed, "admin-1", "admin-1", [], {
      serverAdmin: body.admin,
      sessionHandle: "admin-1",
      sessionRole: "",
    });
    expect(clientSaysYes).toBe(true);
  });

  it("tells the client no for a refused read, so the gate agrees with the 403", async () => {
    const { clientCanViewOfferThread } = await import("@/lib/threadAccess");
    const { getKV } = await import("@/lib/db");
    const { status, body } = await call("902", STRANGER, false);
    expect(status).toBe(403);
    expect(body.admin).toBeUndefined();
    const lobbies = (await (getKV as any)("lobbies")) as any[];
    const refused = lobbies.find((l: any) => String(l.id) === "902");
    expect(
      clientCanViewOfferThread(refused, STRANGER, STRANGER, [], { serverAdmin: false })
    ).toBe(false);
  });
});
