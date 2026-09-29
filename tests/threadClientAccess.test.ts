import { describe, it, expect } from "vitest";
import { clientCanViewOfferThread } from "@/lib/threadAccess";
import { isPrimaryAdmin, OMARSALEH_ADMIN_ID, OMARSALEH_ADMIN_HANDLE } from "@/lib/rolesConstants";

/**
 * The client half of thread access.
 *
 * The regression this file exists for: the page shell authorised an admin and
 * shipped the thread, and then the client re-derived "am I an admin" from the
 * session cookie and answered no. The account got a red "Access Denied" over a
 * thread the server had already released. These tests pin the client gate to
 * the server's verdict instead of a second guess at it.
 */

const OWNER = "owner-1";
const MEMBER = "member-1";
const STRANGER = "stranger-9";

const lobby = (over: Record<string, unknown> = {}): any => ({
  id: "900",
  ownerId: OWNER,
  status: "standby",
  messages: [],
  accepted: [],
  invited: [],
  applicants: [],
  history: [],
  ...over,
});

describe("client thread gate — the server's admin verdict is authoritative", () => {
  it("lets in an admin the server already released the thread to", () => {
    // The exact shape of the bug: `isAdminUser` returned true, `loadOfferThread`
    // returned the thread with `admin: true`, and the client still said no.
    const thread = lobby({ id: "902", ownerId: "someone-else" });
    const asPromotedAdmin = clientCanViewOfferThread(
      thread,
      "promoted-admin",
      "promoted-admin",
      [],
      { serverAdmin: true, sessionHandle: "promoted-admin", sessionRole: "" }
    );
    expect(asPromotedAdmin).toBe(true);
  });

  it("still refuses a stranger even when the thread exists", () => {
    const thread = lobby({ id: "902", ownerId: "someone-else" });
    expect(
      clientCanViewOfferThread(thread, STRANGER, STRANGER, [], {
        serverAdmin: false,
        sessionHandle: STRANGER,
        sessionRole: "user",
      })
    ).toBe(false);
  });

  it("does not treat a missing server verdict as permission", () => {
    // `undefined` must not read as "admin": the fallback is the session checks,
    // and nothing else.
    const thread = lobby({ id: "902", ownerId: "someone-else" });
    expect(
      clientCanViewOfferThread(thread, STRANGER, STRANGER, [], { serverAdmin: false })
    ).toBe(false);
  });

  it("keeps working before any payload arrives, off the session alone", () => {
    // First paint: no server verdict yet. A seeded admin must still get in.
    const thread = lobby({ id: "902", ownerId: "someone-else" });
    expect(
      clientCanViewOfferThread(thread, OMARSALEH_ADMIN_ID, OMARSALEH_ADMIN_HANDLE, [], {
        sessionHandle: OMARSALEH_ADMIN_HANDLE,
        sessionRole: "",
      })
    ).toBe(true);
  });
});

describe("client thread gate — every seeded admin, not just the first", () => {
  it("recognises the second admin by id", () => {
    // The old expression only ever knew `minhonovazen` / 1497295886223544471.
    // omarsaleh97 passed every server admin check and still hit Access Denied.
    const thread = lobby({ id: "902", ownerId: "someone-else" });
    expect(
      clientCanViewOfferThread(thread, OMARSALEH_ADMIN_ID, "some-renamed-handle", [], {
        serverAdmin: false,
        sessionHandle: "some-renamed-handle",
        sessionRole: "",
      })
    ).toBe(true);
  });

  it("recognises the second admin by handle", () => {
    const thread = lobby({ id: "902", ownerId: "someone-else" });
    expect(
      clientCanViewOfferThread(thread, "unmapped-id", OMARSALEH_ADMIN_HANDLE, [], {
        serverAdmin: false,
        sessionHandle: OMARSALEH_ADMIN_HANDLE,
        sessionRole: "",
      })
    ).toBe(true);
  });

  it("still recognises the original admin", () => {
    const thread = lobby({ id: "902", ownerId: "someone-else" });
    expect(
      clientCanViewOfferThread(thread, "1497295886223544471", "renamed-away", [], {
        serverAdmin: false,
        sessionHandle: "renamed-away",
        sessionRole: "",
      })
    ).toBe(true);
  });

  it("does not widen the bypass to a lookalike handle", () => {
    const thread = lobby({ id: "902", ownerId: "someone-else" });
    expect(
      clientCanViewOfferThread(thread, "random-id", "minhonovazen2", [], {
        serverAdmin: false,
        sessionHandle: "minhonovazen2",
        sessionRole: "",
      })
    ).toBe(false);
  });

  it("agrees with isPrimaryAdmin on who counts as admin", () => {
    for (const [id, handle] of [
      [OMARSALEH_ADMIN_ID, OMARSALEH_ADMIN_HANDLE],
      ["1497295886223544471", "minhonovazen"],
    ] as const) {
      expect(isPrimaryAdmin(id, handle)).toBe(true);
    }
    expect(isPrimaryAdmin("someone", "someone")).toBe(false);
  });
});

describe("client thread gate — owners and squad members", () => {
  it("lets the offer owner in", () => {
    expect(clientCanViewOfferThread(lobby(), OWNER, "owner", [], { serverAdmin: false })).toBe(true);
  });

  it("lets a confirmed squad member in", () => {
    const thread = lobby({ accepted: [{ applicantId: MEMBER, status: "confirmed" }] });
    expect(clientCanViewOfferThread(thread, MEMBER, "member", [], { serverAdmin: false })).toBe(true);
  });

  it("lets a bare applicant in", () => {
    const thread = lobby({ applicants: [{ applicantId: STRANGER }] });
    expect(clientCanViewOfferThread(thread, STRANGER, STRANGER, [], { serverAdmin: false })).toBe(true);
  });

  it("keeps a renamed owner in through their account-row aliases", () => {
    // `ownerDiscordName` is a snapshot from post time; the alias list is what
    // makes a rename survivable, and the gate has to receive it.
    const thread = lobby({ ownerId: "legacy-handle-id", ownerDiscordName: "Old Name" });
    expect(
      clientCanViewOfferThread(thread, OWNER, "new-name", ["new-name", "Old Name"], {
        serverAdmin: false,
      })
    ).toBe(true);
  });

  it("has no lobby to open", () => {
    expect(clientCanViewOfferThread(null, OWNER, "owner", [], { serverAdmin: true })).toBe(false);
  });
});
