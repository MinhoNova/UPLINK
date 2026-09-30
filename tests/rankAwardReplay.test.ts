import { describe, it, expect } from "vitest";
import { applyRankAwards, awardedLobbyIds } from "@/lib/rankAwards";

/**
 * Rank counters are the site's reputation, and they are the one number here
 * that is worth money. The "already counted" marker used to be a field on the
 * lobby itself — supplied by the same request that claimed the payout — so the
 * whole award was replayable by hand:
 *
 *   request 1: status=completed, payoutStatus=paid, rankAwardedBooster=false
 *              → +1 run
 *   request 2: status=standby,  payoutStatus=unpaid, rankAwardedBooster=false
 *   request 3: status=completed, payoutStatus=paid, rankAwardedBooster=false
 *              → +1 run  …forever, with no second party in the room
 *
 * The fix is that the "counted" set lives in server storage the caller never
 * writes, so a lobby is credited once for the lifetime of the site. These tests
 * drive the exact replay loop, not a paraphrase of it.
 */
const OWNER = "owner-1";
const BOOSTER = "booster-1";

const users = () => [
  { id: OWNER, username: "poster", stats: { total: 0, postCount: 0 } },
  { id: BOOSTER, username: "booster", stats: { total: 0, postCount: 0 } },
];

const lobby = (over: Record<string, any> = {}) => ({
  id: "L1",
  ownerId: OWNER,
  accepted: [{ applicantId: BOOSTER }],
  status: "completed",
  payoutStatus: "paid",
  keyLevel: "+20",
  category: "dungeon",
  rankAwardedBooster: false,
  ...over,
});

/** An offer as it sits in the feed before it is run. */
const open = (over: Record<string, any> = {}) =>
  lobby({ status: "standby", payoutStatus: "unpaid", rankAwardedBooster: false, ...over });

const run = (existing: any[], incoming: any[], usrs: any[], already: Set<string>) =>
  applyRankAwards(existing, incoming, usrs, OWNER, already);

const totalOf = (out: any, id: string) => out.users.find((u: any) => u.id === id)?.stats?.total;

describe("rank awards cannot be replayed", () => {
  it("credits a genuine completed+paid lobby once", () => {
    // The offer existed and was open, then paid out. That transition is the award.
    const out = run([open()], [lobby()], users(), new Set());
    expect(totalOf(out, BOOSTER)).toBe(1);
  });

  it("ignores a cleared rankAwardedBooster on a lobby already in the ledger", () => {
    const ledger = awardedLobbyIds(["L1"]);
    // The offer is still completed+paid, but the caller has reset the marker it
    // is supposed to be unable to control.
    const out = run([open()], [lobby({ rankAwardedBooster: false })], users(), ledger);
    expect(totalOf(out, BOOSTER)).toBe(0);
    expect(out.awarded.boosterRuns).toBe(0);
  });

  it("survives the full flip-flop replay loop", () => {
    const ledger = new Set<string>();
    let stored = users();
    const storedLobbies: any[] = [open()];

    const cycle = (next: any) => {
      const out = applyRankAwards(storedLobbies, [next], stored, OWNER, ledger);
      stored = out.users;
      storedLobbies.length = 0;
      storedLobbies.push(...out.lobbies);
      for (const l of out.lobbies) if (l?.rankAwardedBooster) ledger.add(String(l.id));
      return totalOf(out, BOOSTER) ?? 0;
    };

    // Claim the payout.
    expect(cycle(lobby())).toBe(1);
    // Reset it back to open — clears the client-visible marker too.
    expect(cycle(open())).toBe(1);
    // Claim again. This is the step that used to pay out a second time.
    expect(cycle(lobby())).toBe(1);
    expect(cycle(open())).toBe(1);
    expect(cycle(lobby())).toBe(1);
    // The ledger is what held the line, not the marker.
    expect(ledger.has("L1")).toBe(true);
  });

  it("still credits a different lobby that has not been counted", () => {
    const ledger = awardedLobbyIds(["L1"]);
    const out = run(
      [lobby(), open({ id: "L2" })],
      [lobby(), lobby({ id: "L2" })],
      users(),
      ledger
    );
    expect(totalOf(out, BOOSTER)).toBe(1);
  });

  it("tolerates a corrupt or absent ledger", () => {
    expect(awardedLobbyIds(null).size).toBe(0);
    expect(awardedLobbyIds("nonsense").size).toBe(0);
    expect(awardedLobbyIds([null, "", 7]).has("7")).toBe(true);
  });
});
