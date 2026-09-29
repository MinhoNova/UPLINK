import { describe, it, expect } from "vitest";
import { validateLobbies } from "@/lib/secureDataWrite";

/** Narrow the result union so the assertions below read cleanly. */
function ok(res: ReturnType<typeof validateLobbies>): any[] {
  if (!res.ok) throw new Error(`expected the write to be accepted, got: ${res.error}`);
  return res.value as any[];
}

/**
 * "Start Mission" and every other owner action on the thread page.
 *
 * The client always PUTs the whole `lobbies` array it holds, not just the lobby
 * it touched. So this is the shape of a real request from the thread page: the
 * owner's own lobby, plus everybody else's offers that the client can also see.
 *
 * The page reads lobbies through the thread endpoint, which returns a *scoped*
 * copy, so the owner's copy of a foreign offer legitimately differs from the
 * stored one. That used to fail the whole request.
 */

const OWNER = "711027724663128106";
const STRANGER = "1472005392849703025";

const mine = (over: Record<string, unknown> = {}) => ({
  id: "1790139137329",
  ownerId: OWNER,
  ownerDiscordName: "omarsaleh97",
  status: "standby",
  accepted: [],
  invited: [],
  applicants: [],
  messages: [],
  ...over,
});

const theirs = (over: Record<string, unknown> = {}) => ({
  id: "1790139313194",
  ownerId: STRANGER,
  ownerDiscordName: "leonknox1",
  status: "standby",
  accepted: [],
  invited: [],
  applicants: [],
  messages: [],
  ...over,
});

describe("owner actions on the thread page", () => {
  it("saves a Start Mission transition on the owner's own lobby", () => {
    const stored = [mine()];
    const incoming = [mine({ status: "in_progress" })];
    const res = validateLobbies(stored, incoming, OWNER, false);
    expect(res.ok).toBe(true);
    expect((ok(res))[0].status).toBe("in_progress");
  });

  it("saves the transition while a foreign offer sits in the same payload", () => {
    // The client holds both lobbies and PUTs the array whole.
    const stored = [mine(), theirs()];
    const incoming = [mine({ status: "in_progress" }), theirs()];
    const res = validateLobbies(stored, incoming, OWNER, false);
    expect(res.ok).toBe(true);
  });

  it("saves the transition when the client's copy of a foreign offer has extra fields", () => {
    // The thread endpoint returns a scoped copy, so a field the owner cannot
    // see (or a field the browser added) makes the two differ byte for byte.
    const stored = [mine(), theirs()];
    const incoming = [mine({ status: "in_progress" }), theirs({ clientOnlyField: true, status: "standby" })];
    const res = validateLobbies(stored, incoming, OWNER, false);
    expect(res.ok).toBe(true);
    // ...and the stored copy is what survives.
    const kept = (ok(res)).find((l) => l.id === "1790139313194");
    expect(kept.clientOnlyField).toBeUndefined();
    expect(kept.ownerId).toBe(STRANGER);
  });

  it("saves the transition when the foreign offer is missing messages the owner read", () => {
    // `messages` is stripped for non-members, so the owner's client copy has an
    // empty array where the store has the real chat.
    const stored = [mine(), theirs({ messages: [{ id: 1, text: "secret" }] })];
    const incoming = [mine({ status: "in_progress" }), theirs({ messages: [] })];
    const res = validateLobbies(stored, incoming, OWNER, false);
    expect(res.ok).toBe(true);
    const kept = (ok(res)).find((l) => l.id === "1790139313194");
    expect(kept.messages).toHaveLength(1);
  });

  it("still applies the owner's own edit rather than the stored copy", () => {
    const stored = [mine()];
    const incoming = [mine({ status: "in_progress", serviceName: "updated name" })];
    const res = validateLobbies(stored, incoming, OWNER, false);
    const saved = (ok(res))[0];
    expect(saved.status).toBe("in_progress");
    expect(saved.serviceName).toBe("updated name");
  });

  it("still refuses to let the owner change someone else's offer", () => {
    const stored = [mine(), theirs()];
    const incoming = [mine(), theirs({ serviceName: "hijacked", status: "in_progress" })];
    const res = validateLobbies(stored, incoming, OWNER, false);
    expect(res.ok).toBe(true);
    const kept = (ok(res)).find((l) => l.id === "1790139313194");
    expect(kept.serviceName).not.toBe("hijacked");
    expect(kept.status).toBe("standby");
  });

  it("carries a foreign offer over instead of deleting it when the caller omits it", () => {
    const stored = [mine(), theirs()];
    const res = validateLobbies(stored, [mine()], OWNER, false);
    expect(res.ok).toBe(true);
    const ids = (ok(res)).map((l) => String(l.id)).sort();
    expect(ids).toEqual(["1790139137329", "1790139313194"]);
  });
});

/**
 * The thread page saves a scoped array, not the whole site.
 *
 * `loadOfferThread` deliberately returns only the offer's family — the thread
 * page must not be able to read every other lobby. But the client has always
 * POSTed that scoped array to `/api/data` as if it were the complete set, so
 * every lobby the caller does not own looked deleted and the server rejected the
 * write. That is why pressing "Start Mission" appeared to do nothing: the status
 * change was never stored, and the page showed a success toast regardless.
 */
describe("saving from the thread page, which only holds one offer's family", () => {
  const otherOffers = [
    { ...theirs({ id: "a" }) },
    { ...theirs({ id: "b", ownerDiscordName: "someone-else" }) },
    { ...mine({ id: "c", ownerId: "another-of-mine" }) },
  ];

  it("accepts a partial array that omits offers the caller does not own", () => {
    const stored = [mine(), ...otherOffers];
    const res = validateLobbies(stored, [mine({ status: "in_progress" })], OWNER, false);
    expect(res.ok).toBe(true);
    expect((ok(res))[0].status).toBe("in_progress");
  });

  it("does not delete the omitted offers", () => {
    const stored = [mine(), ...otherOffers];
    const res = validateLobbies(stored, [mine({ status: "in_progress" })], OWNER, false);
    expect(res.ok).toBe(true);
    // The returned array is what gets written, so it must still carry them.
    const ids = (ok(res)).map((l) => String(l.id)).sort();
    expect(ids).toEqual(["1790139137329", "a", "b", "c"]);
  });

  it("still refuses when an own lobby with a squad is dropped", () => {
    // Deleting your own offer is still a delete: a live squad means no.
    const stored = [mine(), mine({ id: "c", accepted: [{ applicantId: "someone" }] }), theirs()];
    const res = validateLobbies(stored, [mine()], OWNER, false);
    expect(res.ok).toBe(false);
  });

  it("still allows deleting an own empty standby offer", () => {
    const stored = [mine()];
    const res = validateLobbies(stored, [], OWNER, false);
    expect(res.ok).toBe(true);
    expect(ok(res)).toEqual([]);
  });
});

