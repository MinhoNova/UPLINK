import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const discord = read("src/lib/discord.ts");
const lobbyDiscord = read("src/lib/lobbyDiscord.ts");
const applyPage = read("src/app/apply/[lobbyId]/page.tsx");
const interactions = read("src/app/api/discord/interactions/route.ts");

describe("discord offer embed", () => {
  it("puts class art in the embed corner", () => {
    // The Nitro guild has the art; the embed only ever carried the owner's
    // avatar, so every offer looked identical in the channel.
    expect(discord).toMatch(/thumbnail:\s*offerClassThumb\(lobby\)/);
    expect(discord).toMatch(/classThumbUrl/);
    // Discord only accepts png/jpg/gif/webp here, never svg.
    expect(discord).toMatch(/function offerClassThumb/);
  });

  it("only speaks up when a single class is in play", () => {
    // requiredClasses is usually a list; a thumbnail of a random member of it
    // would be worse than no thumbnail.
    const body = discord.slice(discord.indexOf("function offerClassThumb"));
    expect(body).toMatch(/clean\.length === 1/);
  });

  it("uses guild emoji when the server has them, unicode otherwise", () => {
    expect(discord).toMatch(/guilds\/\$\{cachedGuildId\}\/emojis/);
    expect(discord).toMatch(/<a?:\$\{hit\.name\}:\$\{hit\.id\}>/);
    // Still has to render on a server with no custom emoji uploaded.
    expect(discord).toMatch(/return custom \|\| byCategory \|\| "🎮"/);
  });

  it("sends the embed's Apply button at the apply page, not a dead query param", () => {
    // `?lobby=` was generated in five places and read in none, so every
    // "Open UPLINK" button landed on the homepage.
    expect(discord).not.toMatch(/\?lobby=\$\{/);
    expect(discord).toMatch(/const applyUrl = absoluteSiteUrl\(`\/apply\/\$\{lobby\.id\}`\)/);
  });

  it("keeps Apply a custom_id button so it still works without a link", () => {
    expect(discord).toMatch(/custom_id: `apply_\$\{lobby\.id\}`/);
  });
});

describe("applying from discord", () => {
  it("no longer grabs whichever character happens to be first", () => {
    // `characters.find(...)` handed the applicant an arbitrary row, so someone
    // with a level 20 alt and a level 80 main silently applied on the alt.
    expect(lobbyDiscord).not.toMatch(/const char =\s*\n?\s*characters\.find/);
    expect(lobbyDiscord).toMatch(/const eligible = owned\.filter/);
  });

  it("asks the player to choose when more than one character qualifies", () => {
    expect(lobbyDiscord).toMatch(/if \(eligible\.length > 1\)/);
    expect(lobbyDiscord).toMatch(/Pick the one you want to bring/);
  });

  it("sends unregistered and characterless players to the site", () => {
    // Both used to be bare prose with no way to act on it.
    expect(lobbyDiscord).toMatch(/Sign in with Discord on UPLINK and add your character/);
    expect(lobbyDiscord).toMatch(/You have no character on UPLINK yet/);
    expect(lobbyDiscord).toMatch(/const applyPage = `\$\{siteUrl\}\/apply\//);
  });

  it("still enforces the 45+ gate before anything is written", () => {
    expect(lobbyDiscord).toMatch(/Boosting offers require Level 45\+/);
  });

  it("still refuses suspended accounts on the discord path", () => {
    expect(lobbyDiscord).toMatch(/isUserBanned\(user\.username, user\.id\)/);
  });
});

describe("the apply page the buttons hand off to", () => {
  it("exists at /apply/[lobbyId] and is reachable as a page", () => {
    expect(applyPage).toMatch(/useParams<\{ lobbyId: string \}>/);
    // A modal could not be linked to, which is why Discord could not use the
    // site's own picker.
    expect(applyPage).not.toMatch(/if \(!isOpen\) return null/);
  });

  it("reuses the site's normal character picker and stat pill", () => {
    expect(applyPage).toMatch(/CharacterPortraitBadge/);
    expect(applyPage).toMatch(/CharacterPowerStats/);
    expect(applyPage).toMatch(/BOOST_MIN_LEVEL/);
  });

  it("posts the same payload the lobby page posts", () => {
    // Diverging here would reintroduce the dedupe bypass this route is meant to
    // close, so the game-keyed applicant id and the character fields are pinned.
    expect(applyPage).toMatch(/"\/api\/lobbies\/apply"/);
    expect(applyPage).toMatch(/id: gid \? `game:\$\{gid\}` : `\$\{meId\}-main`/);
    expect(applyPage).toMatch(/gameCharacterId: gid/);
    expect(applyPage).toMatch(/role: aionClassRole\(aionClass\)/);
  });

  it("offers a sign-in path for anonymous visitors", () => {
    expect(applyPage).toMatch(/signIn\("discord"\)/);
  });
});

describe("interactions endpoint", () => {
  it("still fails closed on an unverifiable request", () => {
    // Everything above hangs off this. An un-awaited verifyKey() was a real CVE
    // here: forged interactions could accept invites and write the offers blob.
    expect(interactions).toMatch(/await verifyKey/);
  });
});