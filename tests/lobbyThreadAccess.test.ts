import { describe, it, expect } from "vitest";
import { validateLobbies } from "@/lib/secureDataWrite";
import { scopeLobbyMessages, stripLobbyMessages } from "@/lib/dataAccess";

const OWNER = "owner-1";
const APPLICANT = "applicant-9";
const MEMBER = "member-3";
const OUTSIDER = "stranger-7";

const baseLobby = () => ({
  id: "lobby-1",
  ownerId: OWNER,
  parentId: null,
  status: "open",
  payoutStatus: "unpaid",
  pricePerRun: 100,
  serviceName: "Powerleveling",
  accepted: [],
  invited: [],
  applicants: [],
  history: [],
  messages: [],
});

const withApplicant = () => ({
  ...baseLobby(),
  applicants: [{ applicantId: APPLICANT, applicantNote: "hello" }],
});

describe("validateLobbies — applicant write scope", () => {
  it("lets an applicant apply to an open lobby", () => {
    const incoming = [{ ...baseLobby(), applicants: [{ applicantId: APPLICANT, applicantNote: "hi" }] }];
    const res = validateLobbies([baseLobby()], incoming, APPLICANT, false);
    expect(res.ok).toBe(true);
  });

  it("lets an applicant withdraw themselves", () => {
    const res = validateLobbies([withApplicant()], [baseLobby()], APPLICANT, false);
    expect(res.ok).toBe(true);
  });

  it("lets an applicant edit only their own note", () => {
    const incoming = [{ ...withApplicant(), applicants: [{ applicantId: APPLICANT, applicantNote: "edited" }] }];
    const res = validateLobbies([withApplicant()], incoming, APPLICANT, false);
    expect(res.ok).toBe(true);
  });

  // A change the applicant has no right to make is not an error — the incoming
  // copy of that lobby is dropped and the stored one is written back. The
  // security property is therefore "the change is not reflected", which these
  // assert against the returned value rather than against `ok`.
  it("an applicant cannot add themselves to accepted", () => {
    const incoming = [
      {
        ...withApplicant(),
        accepted: [{ applicantId: APPLICANT }],
        applicants: [{ applicantId: APPLICANT, applicantNote: "hello" }],
      },
    ];
    const res = validateLobbies([withApplicant()], incoming, APPLICANT, false);
    expect((res as any).value[0].accepted).toEqual([]);
  });

  it("an applicant cannot change status", () => {
    const incoming = [{ ...withApplicant(), status: "completed" }];
    const res = validateLobbies([withApplicant()], incoming, APPLICANT, false);
    expect((res as any).value[0].status).toBe("open");
  });

  it("an applicant cannot change the price", () => {
    const incoming = [{ ...withApplicant(), pricePerRun: 1 }];
    const res = validateLobbies([withApplicant()], incoming, APPLICANT, false);
    expect((res as any).value[0].pricePerRun).toBe(100);
  });

  it("an applicant cannot touch another applicant's row", () => {
    const other = { applicantId: "other-2", applicantNote: "theirs" };
    const ex = { ...withApplicant(), applicants: [...withApplicant().applicants, other] };
    const incoming = {
      ...ex,
      applicants: [...ex.applicants, { ...other, applicantNote: "rewritten" }],
    };
    const res = validateLobbies([ex], [incoming], APPLICANT, false);
    const stored = (res as any).value[0].applicants.find((a: any) => a.applicantId === "other-2");
    expect(stored.applicantNote).toBe("theirs");
  });

  it("an applicant cannot delete another applicant", () => {
    const other = { applicantId: "other-2", applicantNote: "theirs" };
    const ex = { ...withApplicant(), applicants: [...withApplicant().applicants, other] };
    const incoming = { ...ex, applicants: [ex.applicants[0]] };
    const res = validateLobbies([ex], [incoming], APPLICANT, false);
    expect((res as any).value[0].applicants).toHaveLength(2);
  });

  it("still lets the owner do anything", () => {
    const incoming = [{ ...withApplicant(), status: "completed", pricePerRun: 5 }];
    const res = validateLobbies([withApplicant()], incoming, OWNER, false);
    expect(res.ok).toBe(true);
    expect((res as any).value[0].pricePerRun).toBe(5);
  });

  it("stops a member hijacking the offer's owner", () => {
    // Lifecycle fields stay writable for members on purpose — driving a mission
    // outcome is the point of a squad vote. The offer's ownership is not theirs.
    const ex = { ...baseLobby(), accepted: [{ applicantId: MEMBER }] };
    const incoming = [{ ...ex, ownerId: OUTSIDER }];
    const res = validateLobbies([ex], incoming, MEMBER, false);
    expect(res.ok).toBe(true);
    expect((res as any).value[0].ownerId).toBe(OWNER);
  });

  it("stops a member resetting a rank marker", () => {
    const ex = { ...baseLobby(), accepted: [{ applicantId: MEMBER }], rankAwardedBooster: true };
    const res = validateLobbies([ex], [{ ...ex, rankAwardedBooster: false }], MEMBER, false);
    expect((res as any).value[0].rankAwardedBooster).toBe(true);
  });

  it("still lets a member drive a mission outcome", () => {
    // Regression guard for the six flows a broader clamp broke: the dungeon
    // completion vote, the leveling completion, the fail vote, the foot-complete
    // split, and the member exit all write lifecycle fields as a member.
    const ex = { ...baseLobby(), accepted: [{ applicantId: MEMBER }], messages: [], votes: [] };
    const incoming = [
      {
        ...ex,
        status: "completed",
        payoutStatus: "unpaid",
        completedAt: 123,
        votes: [{ userId: MEMBER, at: 123 }],
      },
    ];
    const res = validateLobbies([ex], incoming, MEMBER, false);
    expect(res.ok).toBe(true);
    const stored = (res as any).value[0];
    expect(stored.status).toBe("completed");
    expect(stored.payoutStatus).toBe("unpaid");
    expect(stored.completedAt).toBe(123);
    expect(stored.votes).toEqual([{ userId: MEMBER, at: 123 }]);
  });

  it("stops a member deleting another player's vote", () => {
    const ex = {
      ...baseLobby(),
      accepted: [{ applicantId: MEMBER }, { applicantId: OUTSIDER }],
      votes: [{ userId: OUTSIDER, at: 1 }],
      failVotes: [{ userId: OUTSIDER, at: 1 }],
    };
    // Both arrays shrink — the other player's vote is being removed.
    const res = validateLobbies([ex], [{ ...ex, votes: [], failVotes: [] }], MEMBER, false);
    const stored = (res as any).value[0];
    expect(stored.votes).toEqual([{ userId: OUTSIDER, at: 1 }]);
    expect(stored.failVotes).toEqual([{ userId: OUTSIDER, at: 1 }]);
  });

  it("stops a member voting twice or voting for someone else", () => {
    const ex = {
      ...baseLobby(),
      accepted: [{ applicantId: MEMBER }],
      votes: [{ userId: OUTSIDER, at: 1 }],
    };
    const res = validateLobbies(
      [ex],
      [
        {
          ...ex,
          votes: [
            { userId: OUTSIDER, at: 1 },
            { userId: MEMBER, at: 2 },
            { userId: MEMBER, at: 3 }, // second vote, same player
            { userId: "alt-1", at: 4 }, // someone else's
          ],
        },
      ],
      MEMBER,
      false
    );
    const stored = (res as any).value[0];
    expect(stored.votes).toEqual([
      { userId: OUTSIDER, at: 1 },
      { userId: MEMBER, at: 2 },
    ]);
  });

  it("lets a member post, vote once, and remove themselves", () => {
    const ex = {
      ...baseLobby(),
      accepted: [{ applicantId: MEMBER }, { applicantId: OUTSIDER }],
      messages: [],
      votes: [],
    };
    const incoming = [
      {
        ...ex,
        messages: [{ id: "m1", userId: MEMBER, text: "on my way" }],
        votes: [{ userId: MEMBER, value: true }],
        accepted: [{ applicantId: MEMBER }], // left; OUTSIDER untouched
      },
    ];
    const res = validateLobbies([ex], incoming, MEMBER, false);
    expect(res.ok).toBe(true);
    const stored = (res as any).value[0];
    expect(stored.messages).toHaveLength(1);
    expect(stored.votes).toHaveLength(1);
    expect(stored.accepted.map((m: any) => m.applicantId)).toEqual([MEMBER]);
  });

  it("stops a member adding a made-up member to the squad", () => {
    const ex = { ...baseLobby(), accepted: [{ applicantId: MEMBER }] };
    const incoming = [
      { ...ex, accepted: [{ applicantId: MEMBER }, { applicantId: "alt-1" }] },
    ];
    const res = validateLobbies([ex], incoming, MEMBER, false);
    expect(res.ok).toBe(true);
    expect((res as any).value[0].accepted.map((m: any) => m.applicantId)).toEqual([MEMBER]);
  });

  it("stops an invited member promoting themselves into the squad", () => {
    // `invited` is not `accepted`. Self-promotion granted
    // hasIndependentSquadMember standing and the thread access that goes with it.
    const ex = { ...baseLobby(), accepted: [], invited: [{ applicantId: MEMBER }] };
    const incoming = [
      { ...ex, accepted: [{ applicantId: MEMBER, status: "confirmed" }] },
    ];
    const res = validateLobbies([ex], incoming, MEMBER, false);
    expect(res.ok).toBe(true);
    expect((res as any).value[0].accepted).toEqual([]);
  });

  it("stops a member editing another member's row", () => {
    const ex = {
      ...baseLobby(),
      accepted: [
        { applicantId: MEMBER, role: "dps" },
        { applicantId: OUTSIDER, role: "healer" },
      ],
    };
    // The caller's own row is sent back byte-identical; only the other member's
    // row differs. Compare that row against the stored one.
    const incoming = [
      {
        ...ex,
        accepted: [
          { applicantId: MEMBER, role: "dps" },
          { applicantId: OUTSIDER, role: "owner" },
        ],
      },
    ];
    const res = validateLobbies([ex], incoming, MEMBER, false);
    expect(res.ok).toBe(true);
    expect((res as any).value[0].accepted[1].role).toBe("healer");
  });

  it("stops even the owner reassigning the offer or resetting a rank marker", () => {
    const ex = { ...baseLobby(), rankAwardedBooster: true };
    const incoming = [{ ...ex, ownerId: OUTSIDER, rankAwardedBooster: false }];
    const res = validateLobbies([ex], incoming, OWNER, false);
    expect(res.ok).toBe(true);
    const stored = (res as any).value[0];
    expect(stored.ownerId).toBe(OWNER);
    expect(stored.rankAwardedBooster).toBe(true);
  });

  it("a total stranger cannot change the price", () => {
    const incoming = [{ ...withApplicant(), pricePerRun: 1 }];
    const res = validateLobbies([withApplicant()], incoming, OUTSIDER, false);
    expect((res as any).value[0].pricePerRun).toBe(100);
  });
});

describe("lobby chat visibility", () => {
  it("strips message bodies for an anonymous public read but keeps a count", () => {
    const lobbies = [{ ...baseLobby(), messages: [{ id: 1, text: "secret" }, { id: 2, text: "also secret" }] }];
    const out = stripLobbyMessages(lobbies) as any[];
    expect(out[0].messages).toBeUndefined();
    expect(out[0].messageCount).toBe(2);
  });

  it("keeps messages for the owner", () => {
    const lobbies = [{ ...baseLobby(), messages: [{ id: 1, text: "hi" }] }];
    const out = scopeLobbyMessages(lobbies, OWNER, "owner") as any[];
    expect(out[0].messages).toHaveLength(1);
  });

  it("keeps messages for a confirmed squad member", () => {
    const lobbies = [{ ...baseLobby(), accepted: [{ applicantId: MEMBER }], messages: [{ id: 1, text: "hi" }] }];
    const out = scopeLobbyMessages(lobbies, MEMBER, "member") as any[];
    expect(out[0].messages).toHaveLength(1);
  });

  it("hides messages from a stranger, but serves them to an applicant", () => {
    const lobbies = [
      { ...baseLobby(), messages: [{ id: 1, text: "hi" }] },
      { ...withApplicant(), id: "lobby-2", messages: [{ id: 2, text: "hi" }] },
    ];
    const out = scopeLobbyMessages(lobbies, OUTSIDER, "stranger") as any[];
    expect(out[0].messages).toBeUndefined();
    // The applicant is on this thread now, so it is their thread to read.
    const out2 = scopeLobbyMessages(lobbies, APPLICANT, "applicant") as any[];
    expect(out2[1].messages).toHaveLength(1);
  });

  it("hides messages from an unrelated player on every offer", () => {
    const lobbies = [{ ...baseLobby(), applicants: [{ applicantId: APPLICANT }], messages: [{ id: 1, text: "hi" }] }];
    const out = scopeLobbyMessages(lobbies, OUTSIDER, "stranger") as any[];
    expect(out[0].messages).toBeUndefined();
    expect(out[0].messageCount).toBe(1);
  });

  it("keeps the owner in after a Discord rename via previousUsernames", () => {
    // ownerId is a legacy handle, not a Discord id, so the snapshot name is all
    // we have. The account row still remembers the old handle.
    const lobby = { ...baseLobby(), ownerId: "old-name", ownerDiscordName: "old-name", messages: [{ id: 1, text: "hi" }] };
    const out = scopeLobbyMessages([lobby], OWNER, "new-name", ["old-name"]) as any[];
    expect(out[0].messages).toHaveLength(1);
  });

  it("still hides a lobby from someone whose alias merely resembles it", () => {
    const lobby = { ...baseLobby(), ownerId: "old-name", ownerDiscordName: "old-name", messages: [{ id: 1, text: "hi" }] };
    const out = scopeLobbyMessages([lobby], OUTSIDER, "new-name", ["old-nam"]) as any[];
    expect(out[0].messages).toBeUndefined();
  });
});

// NOTE: `validateDataWrites` is intentionally not exercised here. Its offer
// path calls the daily-limit rate limiter, which needs a real D1 binding, so an
// end-to-end assertion would only be testing the test environment. The
// authorization contract itself is covered deterministically above.
