import { describe, it, expect } from "vitest";
import { filterDataForUser, scopeOfferPrivateFields } from "@/lib/dataAccess";

/**
 * `/api/data` hands every signed-in account the whole `lobbies` blob, so anything
 * left on a lobby row is readable by every player on the site.
 *
 * `paymentProof` was already scoped down to the offer's own participants. The
 * bookkeeping fields are the same class of data and were not: `votes` and
 * `history` name who was on the mission and who was removed from it, and
 * `dmThread` / `modThread` are the members' private conversations. None of it is
 * needed to render an offer card.
 *
 * The rule is unchanged in shape — the same `userCanViewOfferThread` check that
 * gates the chat — so a participant and an admin still see everything they did
 * before, and `/api/history` (which reads D1 directly) is unaffected.
 */

const OWNER = "owner-1";
const MEMBER = "member-9";
const BYSTANDER = "bystander-3";

function lobby(over: Record<string, unknown> = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    ownerDiscordName: "Owner",
    title: "Powerleveling",
    status: "in_progress",
    applicants: [],
    accepted: [],
    history: [],
    messages: [],
    ...over,
  } as any;
}

const USERS = [
  { id: OWNER, username: "owner", displayName: "Owner" },
  { id: MEMBER, username: "member", displayName: "Member" },
  { id: BYSTANDER, username: "bystander", displayName: "Bystander" },
];

function withAllSecrets() {
  return lobby({
    accepted: [{ applicantId: MEMBER, status: "confirmed" }],
    paymentProof: "data:image/png;base64,SECRET",
    votes: [{ userId: MEMBER, at: 1 }],
    failVotes: [{ userId: MEMBER, at: 2 }],
    history: [{ applicantId: "left-member", runsAtExit: 3, reason: "kicked" }],
    dmThread: [{ from: OWNER, text: "private" }],
    modThread: [{ from: "admin", text: "moderation" }],
    messages: [{ id: 1, text: "chat" }],
  });
}

describe("offer bookkeeping is scoped to the offer's participants", () => {
  it("hides every private field from a signed-in bystander", () => {
    const out = scopeOfferPrivateFields([withAllSecrets()], BYSTANDER, "bystander") as any[];
    const row = out[0];
    expect(row.paymentProof).toBeUndefined();
    expect(row.votes).toBeUndefined();
    expect(row.failVotes).toBeUndefined();
    expect(row.history).toBeUndefined();
    expect(row.dmThread).toBeUndefined();
    expect(row.modThread).toBeUndefined();
  });

  it("leaves the offer itself intact for a bystander", () => {
    const out = scopeOfferPrivateFields([withAllSecrets()], BYSTANDER, "bystander") as any[];
    expect(out[0].id).toBe("lobby-1");
    expect(out[0].title).toBe("Powerleveling");
    expect(out[0].ownerId).toBe(OWNER);
  });

  it("shows everything to the owner", () => {
    const out = scopeOfferPrivateFields([withAllSecrets()], OWNER, "owner") as any[];
    const row = out[0];
    expect(row.paymentProof).toBeDefined();
    expect(row.votes).toHaveLength(1);
    expect(row.history).toHaveLength(1);
    expect(row.dmThread).toHaveLength(1);
  });

  it("shows everything to a member who was on the mission", () => {
    const out = scopeOfferPrivateFields([withAllSecrets()], MEMBER, "member") as any[];
    const row = out[0];
    expect(row.votes).toHaveLength(1);
    expect(row.dmThread).toHaveLength(1);
  });

  it("shows everything to a member who left but recorded runs", () => {
    const out = scopeOfferPrivateFields(
      [lobby({ history: [{ applicantId: "former", runsAtExit: 2 }] })],
      "former",
      "former"
    ) as any[];
    expect(out[0].history).toHaveLength(1);
  });

  it("hides the chat on the composed read path, so bookkeeping is not the only gap", () => {
    // Chat is stripped by `scopeLobbyMessages`, bookkeeping by
    // `scopeOfferPrivateFields`; `filterDataForUser` is what runs both.
    const data = filterDataForUser(
      { lobbies: [withAllSecrets()], registeredUsers: USERS } as any,
      BYSTANDER,
      "bystander"
    );
    expect((data.lobbies as any[])[0].messages).toBeUndefined();
  });
});

describe("filterDataForUser applies the same scoping", () => {
  it("strips a bystander's view of another player's mission bookkeeping", () => {
    const data = filterDataForUser(
      { lobbies: [withAllSecrets()], registeredUsers: USERS } as any,
      BYSTANDER,
      "bystander"
    );
    const row = (data.lobbies as any[])[0];
    expect(row.votes).toBeUndefined();
    expect(row.history).toBeUndefined();
    expect(row.paymentProof).toBeUndefined();
  });

  it("does not strip it from a participant's own read", () => {
    const data = filterDataForUser(
      { lobbies: [withAllSecrets()], registeredUsers: USERS } as any,
      MEMBER,
      "member"
    );
    const row = (data.lobbies as any[])[0];
    expect(row.votes).toHaveLength(1);
    expect(row.paymentProof).toBeDefined();
  });

  it("still leaves the owner able to settle their own offer", () => {
    const data = filterDataForUser(
      { lobbies: [withAllSecrets()], registeredUsers: USERS } as any,
      OWNER,
      "owner"
    );
    const row = (data.lobbies as any[])[0];
    expect(row.votes).toHaveLength(1);
    expect(row.history).toHaveLength(1);
  });
});
