import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The lobby is the open market: offers waiting for a squad. A finished run is a
 * record between the poster and the squad that played it, and it belongs on
 * /history, which scopes it to the offer's own participants. A history block
 * that grew back at the bottom of the lobby would publish every player's
 * completed offers — poster, price, paid or not — to anyone who registered, with
 * a Review button for rating a stranger's job, and the server would refuse the
 * click-through anyway. So the section is guarded, not just removed.
 */
const lobbyPage = readFileSync(
  join(process.cwd(), "src/components/aion2/LobbyPage.tsx"),
  "utf8"
);

describe("lobby page", () => {
  it("has no history list for finished offers", () => {
    expect(lobbyPage).not.toMatch(/historyOffers/);
    expect(lobbyPage).not.toMatch(/history_header/);
    expect(lobbyPage).not.toMatch(/history_review/);
  });

  it("does not render a squad review modal for offers it no longer lists", () => {
    expect(lobbyPage).not.toMatch(/SquadReviewModal/);
    expect(lobbyPage).not.toMatch(/setReviewOffer/);
  });

  it("never matches a finished offer to decide what the page shows", () => {
    // A stray `status === "completed"` in a lobby filter is how the section came
    // back the first time. The public feed's own rule is in lobbyLifecycle.
    expect(lobbyPage).not.toMatch(/status === "completed"/);
    expect(lobbyPage).not.toMatch(/status === 'completed'/);
  });

  it("keeps the public feed rule for open offers", () => {
    expect(lobbyPage).toMatch(/isLobbyListedInPublicFeed/);
  });
});
