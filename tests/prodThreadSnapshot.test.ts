import { describe, it, expect } from "vitest";
import { clientCanViewOfferThread } from "@/lib/threadAccess";
import { playerAliases } from "@/lib/playerIdentity";

/** Verbatim shape pulled from the live anonymous /api/data snapshot. */
const OMAR = {
  id: "711027724663128106",
  username: "omarsaleh97",
  name: "Omar Saleh",
  displayName: "OMAR SALEH",
  previousUsernames: ["leonknox1"],
  hiddenIdentity: false,
};
const LEON = { id: "1472005392849703025", username: "leonknox1", name: "Leon" };

const omarThread: any = {
  id: "1790139137329",
  ownerId: "711027724663128106",
  ownerDiscordName: "Omar Saleh",
  status: "standby",
  accepted: [],
  history: [],
  messages: [],
};
const leonThread: any = {
  id: "1790139313194",
  ownerId: "1472005392849703025",
  ownerDiscordName: "Leon",
  status: "standby",
  accepted: [],
  history: [],
  messages: [],
};

describe("production snapshot", () => {
  it("aliases for omarsaleh97 include the display name the lobby snapshotted", () => {
    const a = playerAliases(OMAR as any);
    expect(a.map((s) => s.toLowerCase())).toContain("omar saleh");
  });

  it("omarsaleh97 opens their own thread by id", () => {
    expect(
      clientCanViewOfferThread(omarThread, OMAR.id, OMAR.username, playerAliases(OMAR as any), {
        serverAdmin: false,
      })
    ).toBe(true);
  });

  it("omarsaleh97 opens their own thread by handle alone (id drift)", () => {
    // If the session ever carries a different id, the display-name snapshot is
    // the only thing left tying the owner to their own offer.
    expect(
      clientCanViewOfferThread(omarThread, "different-id", OMAR.username, playerAliases(OMAR as any), {
        serverAdmin: false,
      })
    ).toBe(true);
  });

  it("a non-member gets nothing from the other account's thread", () => {
    // NEON is neither an admin nor a squad member on that offer.
    const NEON = { id: "696697929985163334", username: "neoonii", name: "NEON" };
    expect(
      clientCanViewOfferThread(leonThread, NEON.id, NEON.username, playerAliases(NEON as any), {
        serverAdmin: false,
      })
    ).toBe(false);
  });

  it("omarsaleh97 is recognised as a seeded admin by id alone", () => {
    // The account the whole fix was for: an admin who the old gate refused.
    expect(
      clientCanViewOfferThread(leonThread, OMAR.id, "", [], { serverAdmin: false })
    ).toBe(true);
  });

  it("an accepted member is matched by the record's id field", () => {
    const withMember: any = { ...omarThread, accepted: [{ applicantId: "999", userId: "42" }] };
    expect(
      clientCanViewOfferThread(withMember, "42", "somenew", [], { serverAdmin: false })
    ).toBe(true);
  });

  it("an accepted member recorded by handle only is NOT matched", () => {
    // Production lobbies carry the human `name`; if a squad record ever stores
    // only a name, `memberMatchesUser` has no id to compare and the member is
    // refused. Pinned so this stays visible rather than silent.
    const byNameOnly: any = { ...omarThread, accepted: [{ name: "Leon" }] };
    expect(
      clientCanViewOfferThread(byNameOnly, LEON.id, LEON.username, playerAliases(LEON as any), {
        serverAdmin: false,
      })
    ).toBe(false);
  });
});
