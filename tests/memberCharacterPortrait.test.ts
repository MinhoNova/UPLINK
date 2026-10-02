import { describe, it, expect } from "vitest";
import {
  applyCharacterSnapshots,
  memberCharacterSnapshot,
  pickMemberCharacter,
} from "@/lib/memberCharacter";

/**
 * Regression: no squad member ever showed their in-game portrait.
 *
 * `ManageModal` renders the character block only when `occupant.portraitUrl` is
 * set, but nothing in the apply / accept / invite paths ever wrote that field.
 * `portraitUrl`, `itemLevel`, `serverName` live only on the `characters` rows, so
 * the guard was always false and the thread showed a blank where the official
 * client shows a face — and `—` where it shows Item Lv.
 *
 * These are the shapes the thread relies on.
 */

const CHAR_ID = "A1pIWbd0UKoTYJ2XbL_Cw57uCNxoM4sk4CUqtC5yJ0E=";
const OTHER_CHAR_ID = "Z9othercharidnotrealbutstableAAAAAAAAAAAAAAAA=";

const PORTRAIT =
  "/api/aion2/portrait?u=https%3A%2F%2Fprofileimg.plaync.com%2Fa.jpg&v=2";

/** The `characters` row, as `toStoredCharacter` writes it. */
function charactersRow(over: Record<string, any> = {}) {
  return {
    id: `game:${CHAR_ID}`,
    userId: "u1",
    name: "Zerath",
    gameClassLabel: "Warlord",
    level: 65,
    itemLevel: 720,
    serverId: "1234",
    serverName: "Kpq",
    raceName: "Asmodians",
    genderName: "Female",
    portraitUrl: PORTRAIT,
    verifiedAt: 1_700_000_000_000,
    region: "global",
    ...over,
  };
}

describe("member character snapshot", () => {
  it("copies portrait and ilevel onto a member row", () => {
    const snap = memberCharacterSnapshot([charactersRow()], { applicantId: "u1" });
    expect(snap.portraitUrl).toBe(PORTRAIT);
    expect(snap.itemLevel).toBe(720);
    expect(snap.gameCharacterId).toBe(CHAR_ID);
    expect(snap.serverName).toBe("Kpq");
  });

  it("matches the row's own claimed character over the user's newest one", () => {
    // Player linked a second character after joining; the row still names the
    // character they actually joined with.
    const rows = [
      charactersRow({ id: `game:${CHAR_ID}`, verifiedAt: 5 }),
      charactersRow({ id: `game:${OTHER_CHAR_ID}`, verifiedAt: 9, portraitUrl: "/other.webp", itemLevel: 999 }),
    ];
    const picked = pickMemberCharacter(rows, { applicantId: "u1", gameCharacterId: CHAR_ID });
    expect(picked?.id).toBe(`game:${CHAR_ID}`);
    expect(memberCharacterSnapshot(rows, { applicantId: "u1", gameCharacterId: CHAR_ID }).itemLevel).toBe(720);
  });

  it("accepts a `game:`-prefixed id on the row", () => {
    const snap = memberCharacterSnapshot([charactersRow()], { applicantId: "u1", id: `game:${CHAR_ID}` });
    expect(snap.gameCharacterId).toBe(CHAR_ID);
  });

  it("falls back to the member's most recently verified character", () => {
    const rows = [
      charactersRow({ id: "game:old", verifiedAt: 1, itemLevel: 600 }),
      charactersRow({ id: "game:new", verifiedAt: 99, itemLevel: 720 }),
    ];
    expect(memberCharacterSnapshot(rows, { applicantId: "u1" }).gameCharacterId).toBe("new");
  });

  it("never takes another account's character", () => {
    const snap = memberCharacterSnapshot([charactersRow({ userId: "someone-else" })], { applicantId: "u1" });
    expect(snap).toEqual({});
  });

  it("produces nothing for a member with no linked character", () => {
    expect(memberCharacterSnapshot([charactersRow()], { applicantId: "nobody" })).toEqual({});
    expect(memberCharacterSnapshot([], { applicantId: "u1" })).toEqual({});
  });
});

describe("applyCharacterSnapshots", () => {
  const lobby = () => ({
    id: "L1",
    accepted: [
      { applicantId: "u1", applicantName: "Zerath", status: "confirmed" },
      { applicantId: "u2", applicantName: "Guest" },
    ],
    applicants: [{ applicantId: "u3", applicantName: "Pending" }],
  });

  it("fills the roster and applicant list", () => {
    const [out] = applyCharacterSnapshots([lobby()], [charactersRow()]);
    expect(out.accepted[0].portraitUrl).toBe(PORTRAIT);
    expect(out.accepted[0].itemLevel).toBe(720);
    // Untouched member without a linked character.
    expect(out.accepted[1].portraitUrl).toBeUndefined();
    expect(out.applicants[0].portraitUrl).toBeUndefined();
  });

  it("refreshes a stale ilevel rather than keeping the old one", () => {
    const stale = {
      ...lobby(),
      accepted: [{ applicantId: "u1", applicantName: "Zerath", portraitUrl: "/old.webp", itemLevel: 600 }],
    };
    const [out] = applyCharacterSnapshots([stale], [charactersRow()]);
    expect(out.accepted[0].portraitUrl).toBe(PORTRAIT);
    expect(out.accepted[0].itemLevel).toBe(720);
  });

  it("keeps an existing portrait when the character is no longer on file", () => {
    // Unlinking a character must not blank what the squad already sees.
    const known = {
      ...lobby(),
      accepted: [{ applicantId: "u1", applicantName: "Zerath", portraitUrl: "/kept.webp", itemLevel: 700 }],
    };
    const [out] = applyCharacterSnapshots([known], []);
    expect(out.accepted[0].portraitUrl).toBe("/kept.webp");
    expect(out.accepted[0].itemLevel).toBe(700);
  });

  it("is a no-op when nothing changes", () => {
    const input = [lobby()];
    const before = applyCharacterSnapshots(input, [charactersRow()]);
    expect(applyCharacterSnapshots(before, [charactersRow()])).toBe(before);
  });

  it("survives malformed input", () => {
    const nullRows = applyCharacterSnapshots([{ id: "L", accepted: null, applicants: undefined }], [charactersRow()]);
    expect(nullRows[0].accepted).toBe(null);
    expect(nullRows[0].applicants).toBe(undefined);

    // No character table at all: leave the lobbies exactly as they came in.
    const lobbies = [lobby()];
    expect(applyCharacterSnapshots(lobbies, null as any)).toBe(lobbies);
  });
});
