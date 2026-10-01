import { describe, expect, it, vi, afterEach } from "vitest";
import { validateLobbies } from "@/lib/secureDataWrite";
import { proofRequiredFor } from "@/lib/rankRosterProof";

/**
 * Offers older than the proof cutover are settled on the legacy roster marks,
 * because their members joined through paths that predate the ledger. That is a
 * deliberate hole, so the window has to be something the owner cannot choose.
 *
 * `createdAt` is the discriminator, which only holds if the server stamps it.
 * While the client supplied it, one field in the same request — `createdAt: 0` —
 * put a brand-new offer inside the legacy window, and the legacy marks are all
 * owner-writable. These tests pin the stamp.
 */

const OWNER = "owner-1";
const MEMBER = "member-real";

function lobby(over: any = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    title: "Powerleveling",
    status: "standby",
    payoutStatus: "unpaid",
    accepted: [],
    applicants: [],
    ...over,
  } as any;
}

afterEach(() => vi.useRealTimers());

describe("a new offer's creation time comes from the server", () => {
  it("ignores a creation date the request chose", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-04-05T06:07:08Z"));
    const res = validateLobbies([], [lobby({ createdAt: 0 })], OWNER, false);
    expect(res.ok).toBe(true);
    expect((res as any).value[0].createdAt).toBe(Date.now());
  });

  it("ignores a creation date in the distant past, which would buy the legacy window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-04-05T06:07:08Z"));
    const res = validateLobbies([], [lobby({ createdAt: 1 })], OWNER, false);
    expect((res as any).value[0].createdAt).toBe(Date.now());
  });

  it("overrides a forged future date too", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-04-05T06:07:08Z"));
    const res = validateLobbies([], [lobby({ createdAt: 9_999_999_999_999 })], OWNER, false);
    expect((res as any).value[0].createdAt).toBe(Date.now());
  });

  it("dates the offer now even when the request omits a timestamp entirely", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-04-05T06:07:08Z"));
    const res = validateLobbies([], [lobby()], OWNER, false);
    expect((res as any).value[0].createdAt).toBe(Date.now());
  });

  it("still refuses to create an offer for somebody else", () => {
    const res = validateLobbies([], [lobby({ ownerId: "someone-else" })], OWNER, false);
    expect(res.ok).toBe(false);
  });
});

describe("an existing offer keeps the creation time it was stored with", () => {
  it("does not restamp a live offer on every save", () => {
    const stored = lobby({ createdAt: 1_700_000_000_000, title: "Old title" });
    const res = validateLobbies([stored], [lobby({ createdAt: 1_700_000_000_000, title: "New title" })], OWNER, false);
    expect((res as any).value[0].createdAt).toBe(1_700_000_000_000);
  });

  it("refuses a request that tries to move an offer backwards", () => {
    const stored = lobby({ createdAt: 1_700_000_000_000 });
    const res = validateLobbies([stored], [lobby({ createdAt: 0, title: "Renamed" })], OWNER, false);
    expect((res as any).value[0].createdAt).toBe(1_700_000_000_000);
  });

  it("keeps an undated legacy offer undated, so it still settles", () => {
    const stored = lobby({ createdAt: undefined });
    delete (stored as any).createdAt;
    const res = validateLobbies([stored], [lobby({ createdAt: undefined, title: "Renamed" })], OWNER, false);
    expect((res as any).value[0].createdAt).toBeUndefined();
  });
});

describe("the stamped date is what the proof gate reads", () => {
  it("puts a freshly created offer on the strict side of the cutover", () => {
    const cutover = Date.now() - 1_000;
    const fresh = { ...lobby(), createdAt: Date.now() };
    expect(proofRequiredFor(fresh, cutover)).toBe(true);
  });

  it("leaves a genuinely old offer on the lenient side", () => {
    const cutover = Date.now();
    const old = { ...lobby(), createdAt: cutover - 60_000 };
    expect(proofRequiredFor(old, cutover)).toBe(false);
  });
});

describe("a forged roster is refused on a freshly created offer", () => {
  it("cannot reach the legacy marks by dating the offer to zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-04-05T06:07:08Z"));
    const created = validateLobbies([], [lobby({ createdAt: 0 })], OWNER, false);
    const stamped = (created as any).value[0];
    // The whole point: the forged date did not survive, so `proofRequiredFor`
    // is asking the real question rather than the one the owner supplied.
    expect(proofRequiredFor(stamped, Date.now() - 1)).toBe(true);
  });

  it("still lets the owner assemble a real squad from a real application", () => {
    const applied = lobby({ applicants: [{ applicantId: MEMBER }] });
    const res = validateLobbies([applied], [{ ...applied, accepted: [{ id: MEMBER, applicantId: MEMBER }] }], OWNER, false);
    expect(res.ok).toBe(true);
    expect((res as any).value[0].accepted).toHaveLength(1);
  });
});
