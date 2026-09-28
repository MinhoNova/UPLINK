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

  it("blocks an applicant from adding themselves to accepted", () => {
    const incoming = [
      {
        ...withApplicant(),
        accepted: [{ applicantId: APPLICANT }],
        applicants: [{ applicantId: APPLICANT, applicantNote: "hello" }],
      },
    ];
    const res = validateLobbies([withApplicant()], incoming, APPLICANT, false);
    expect(res.ok).toBe(false);
  });

  it("blocks an applicant from changing status", () => {
    const incoming = [{ ...withApplicant(), status: "completed" }];
    const res = validateLobbies([withApplicant()], incoming, APPLICANT, false);
    expect(res.ok).toBe(false);
  });

  it("blocks an applicant from changing the price", () => {
    const incoming = [{ ...withApplicant(), pricePerRun: 1 }];
    const res = validateLobbies([withApplicant()], incoming, APPLICANT, false);
    expect(res.ok).toBe(false);
  });

  it("blocks an applicant from touching another applicant's row", () => {
    const other = { applicantId: "other-2", applicantNote: "theirs" };
    const ex = { ...withApplicant(), applicants: [...withApplicant().applicants, other] };
    const incoming = {
      ...ex,
      applicants: [...ex.applicants, { ...other, applicantNote: "rewritten" }],
    };
    const res = validateLobbies([ex], [incoming], APPLICANT, false);
    expect(res.ok).toBe(false);
  });

  it("blocks an applicant from deleting another applicant", () => {
    const other = { applicantId: "other-2", applicantNote: "theirs" };
    const ex = { ...withApplicant(), applicants: [...withApplicant().applicants, other] };
    const incoming = { ...ex, applicants: [ex.applicants[0]] };
    const res = validateLobbies([ex], [incoming], APPLICANT, false);
    expect(res.ok).toBe(false);
  });

  it("still lets the owner do anything", () => {
    const incoming = [{ ...withApplicant(), status: "completed", pricePerRun: 5 }];
    const res = validateLobbies([withApplicant()], incoming, OWNER, false);
    expect(res.ok).toBe(true);
  });

  it("still lets an accepted member do anything", () => {
    const ex = { ...baseLobby(), accepted: [{ applicantId: MEMBER }] };
    const incoming = [{ ...ex, status: "completed" }];
    const res = validateLobbies([ex], incoming, MEMBER, false);
    expect(res.ok).toBe(true);
  });

  it("blocks a total stranger", () => {
    const incoming = [{ ...withApplicant(), pricePerRun: 1 }];
    const res = validateLobbies([withApplicant()], incoming, OUTSIDER, false);
    expect(res.ok).toBe(false);
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

  it("hides messages from a stranger and from a mere applicant", () => {
    const lobbies = [
      { ...baseLobby(), messages: [{ id: 1, text: "hi" }] },
      { ...withApplicant(), id: "lobby-2", messages: [{ id: 2, text: "hi" }] },
    ];
    const out = scopeLobbyMessages(lobbies, OUTSIDER, "stranger") as any[];
    expect(out[0].messages).toBeUndefined();
    const out2 = scopeLobbyMessages(lobbies, APPLICANT, "applicant") as any[];
    expect(out2[1].messages).toBeUndefined();
    expect(out2[1].messageCount).toBe(1);
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
