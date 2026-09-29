import { describe, it, expect } from "vitest";
import {
  userCanViewOfferThread,
  userParticipatedInThread,
  userIsOfferOwner,
} from "@/lib/lobbyLifecycle";

/**
 * Who may open a mission thread. This is the rule the site owner asked for:
 *
 *   - the admin may open any thread
 *   - the offer owner may open their own
 *   - anyone who applied to the offer may open it
 *   - anyone else may not
 *
 * Applicants were the gap: `userParticipatedInThread` only looked at `accepted`
 * and `history`, so someone who applied to an offer was told "Access Denied" on
 * the offer they had just applied to.
 */

const OWNER = "711027724663128106";
const APPLICANT = "1472005392849703025";
const STRANGER = "999888777666555444";

const offer = () => ({
  id: "1790139313194",
  ownerId: OWNER,
  ownerDiscordName: "omarsaleh97",
  status: "standby",
  accepted: [],
  invited: [],
  applicants: [],
  history: [],
  messages: [],
});

describe("mission thread access", () => {
  it("lets the offer owner open their own thread", () => {
    expect(userCanViewOfferThread(offer(), OWNER, "omarsaleh97")).toBe(true);
  });

  it("lets the owner in even when their handle has changed", () => {
    // The lobby keeps a snapshot of the name from when it was posted.
    expect(userIsOfferOwner(offer(), OWNER, "renamed_since", ["omarsaleh97"])).toBe(true);
  });

  it("lets someone who applied to the offer open it", () => {
    const l = { ...offer(), applicants: [{ applicantId: APPLICANT, applicantNote: "hi" }] };
    expect(userCanViewOfferThread(l, APPLICANT, "leonknox1")).toBe(true);
  });

  it("recognises an applicant by their other id fields", () => {
    const byUserId = { ...offer(), applicants: [{ userId: APPLICANT }] };
    const byId = { ...offer(), applicants: [{ id: APPLICANT }] };
    expect(userCanViewOfferThread(byUserId, APPLICANT)).toBe(true);
    expect(userCanViewOfferThread(byId, APPLICANT)).toBe(true);
  });

  it("lets a confirmed squad member open it", () => {
    const l = { ...offer(), accepted: [{ applicantId: APPLICANT, confirmed: true }] };
    expect(userCanViewOfferThread(l, APPLICANT)).toBe(true);
  });

  it("lets a former member with run history open it", () => {
    const l = { ...offer(), history: [{ id: APPLICANT, reason: "left", runsAtExit: 3 }] };
    expect(userCanViewOfferThread(l, APPLICANT)).toBe(true);
  });

  it("still blocks an unrelated player", () => {
    expect(userCanViewOfferThread(offer(), STRANGER, "someone")).toBe(false);
  });

  it("still blocks a player who merely left with no runs and no failure", () => {
    const l = { ...offer(), history: [{ id: APPLICANT, reason: "left", runsAtExit: 0 }] };
    expect(userCanViewOfferThread(l, APPLICANT)).toBe(false);
  });

  it("blocks an anonymous visitor", () => {
    expect(userCanViewOfferThread({ ...offer(), applicants: [{ applicantId: "x" }] }, "guest")).toBe(false);
    expect(userCanViewOfferThread(offer(), "")).toBe(false);
  });

  it("does not let an applicant on an offer they never applied to", () => {
    const l = { ...offer(), applicants: [{ applicantId: STRANGER }] };
    expect(userCanViewOfferThread(l, APPLICANT)).toBe(false);
  });

  it("counts an applicant as a participant", () => {
    const l = { ...offer(), applicants: [{ applicantId: APPLICANT }] };
    expect(userParticipatedInThread(l, APPLICANT)).toBe(true);
  });
});
