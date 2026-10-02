import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression: characters linked before the portrait feature kept a blank face
 * forever.
 *
 * `toStoredCharacter` is the only writer of `portraitUrl`, it only runs from
 * `saveVerifiedCharacterEntry`, and that only runs when someone pastes a
 * character link. A row saved with `portraitUrl: ""` therefore never picks one
 * up — so fixing the upstream mapping fixed new links only, and every
 * pre-existing character kept rendering the class crest on My Profile, My
 * Characters and in every squad card.
 *
 * The fix needs two halves: a way to re-verify a stored character from its
 * own `characterId`/`serverId`, and a control that triggers it.
 */

const root = join(process.cwd(), "src");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("stored character portrait backfill", () => {
  it("the resolve route can re-verify from stored ids, not just a pasted link", () => {
    const route = read("app/api/aion2/resolve/route.ts");
    expect(route).toMatch(/export async function PUT/);
    expect(route).toMatch(/fetchGameCharacterProfile/);
    // A link is a per-account claim; a refresh must not hand back a character
    // that belongs to somebody else.
    expect(route).toMatch(/findCharacterLink/);
  });

  it("re-verifying requires a session", () => {
    const route = read("app/api/aion2/resolve/route.ts");
    const put = route.slice(route.indexOf("export async function PUT"));
    expect(put).toMatch(/requireSession/);
  });

  it("My Characters exposes the refresh control for portrait-less rows", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/refreshChar/);
    expect(client).toMatch(/method: "PUT"/);
    // Guarded on the missing portrait so it is not just permanent UI noise.
    expect(client).toMatch(/\{!c\.portraitUrl &&/);
  });

  it("the refresh uses the stored game character id, not the row id", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/characterId: gameCharIdOf\(c\), serverId: Number\(c\.serverId\)/);
  });

  it("an empty portrait never becomes a non-empty proxy path", () => {
    expect(read("lib/characterStore.ts")).toMatch(
      /portraitUrl: portraitProxyPath\(vc\.portraitUrl \|\| ""\)/
    );
  });
});
