import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * An admin saving any roster-scoped setting was deleting every other player's
 * presence.
 *
 * `filterDataForUser` computes an `online` boolean for each account and then
 * deletes `lastSeenAt` from their row before the payload leaves the server —
 * that is deliberate, it is how presence stops being spoofable from the client.
 * But `validateRegisteredUsers` short-circuits for admins:
 *
 *     if (isAdmin) return { ok: true, value: incoming };
 *
 * so the admin's client payload — which never carried another account's
 * timestamp in the first place — is written back verbatim. The ownership
 * restore that follows for everyone else is never reached, and
 * `PROTECTED_SELF_FIELDS`, which blocks `lastSeenAt` from client writes, is
 * bypassed along with it.
 *
 * The result is asymmetric in a way the general limit is not: the admin's own
 * row keeps its timestamp (`filterDataForUser` returns the caller's row
 * unchanged), so the account doing the saving still reads as online while every
 * other account's presence is erased. "My account is online, theirs is not" is
 * the signature of this, and it is why the admin path needs restoring the
 * server-owned fields rather than trusting the payload.
 */

const h = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return {
    store,
    initTables: vi.fn(async () => {}),
    getKV: vi.fn(async (key: string) => (key in store ? store[key] : null)),
    setKV: vi.fn(async (key: string, value: unknown) => {
      store[key] = value;
    }),
  };
});

vi.mock("@/lib/db", () => h);

import { validateRegisteredUsers } from "@/lib/secureDataWrite";
import { filterDataForUser, isUserOnline, ONLINE_WINDOW_MS } from "@/lib/dataAccess";

const ADMIN = "711027724663128106";
const PLAYER = "1472005392849703025";

/**
 * An admin roster save froze every other player's presence in place.
 *
 * `filterDataForUser` has two exits. For everyone else it walks `registeredUsers`
 * and, for each account, computes an `online` flag and then deletes `lastSeenAt`
 * and `lastKnownIp` — that strip is how presence stops being spoofable from a
 * client, and it is why a non-admin's payload never carries another account's
 * timestamp. But admins return at `dataAccess.ts:147`, above that walk, with the
 * roster untouched.
 *
 * So an admin's payload does carry every account's `lastSeenAt` — a copy taken
 * when the page loaded. `validateRegisteredUsers` then short-circuited:
 *
 *     if (isAdmin) return { ok: true, value: incoming };
 *
 * and wrote that snapshot back verbatim. Presence moves — it is stamped on every
 * poll by `touchUserLastIp` — so persisting a snapshot an admin happens to be
 * holding rewinds everyone else's `lastSeenAt` to whenever they loaded the page.
 * An account that was online then reads as offline, and stays that way, because
 * every subsequent save rewinds it again.
 *
 * The signature is asymmetric in a way that made it hard to spot: the admin's own
 * row is never stale — their own poll keeps it fresh — so the account doing the
 * saving stays green while the rest of the roster goes dark, in the DM list and
 * in Online Now alike, since both render the same server-computed flag.
 *
 * The fix restores the server-observed fields from the stored row on every
 * privileged write, and drops the derived `online` boolean so it cannot be
 * persisted as though it were a fact.
 */

/** A server-side roster where both accounts are currently present. */
function liveRoster() {
  const now = Date.now();
  return [
    { id: ADMIN, username: "omarsaleh97", lastKnownIp: "1.1.1.1", lastSeenAt: now, subscription: "pro" },
    { id: PLAYER, username: "leonknox1", lastKnownIp: "2.2.2.2", lastSeenAt: now, subscription: "free" },
  ];
}

/** Build the payload the admin's browser would actually hold. */
function adminPayloadFrom(roster: any[]) {
  return filterDataForUser({ registeredUsers: roster } as any, ADMIN, "omarsaleh97")
    .registeredUsers as any[];
}

beforeEach(() => {
  for (const key of Object.keys(h.store)) delete h.store[key];
});

describe("an admin roster save does not freeze other players' presence", () => {
  it("restores the live timestamp instead of persisting the admin's stale copy", () => {
    // The roster as stored a minute ago, and the payload the admin's browser is
    // still holding. An admin exits `filterDataForUser` above the strip, so this
    // copy is real and it is already out of date.
    const stored = liveRoster();
    const payload = adminPayloadFrom(stored);

    const carried = payload.find((u) => u.id === PLAYER);
    expect(carried.lastSeenAt).toBeTypeOf("number");

    // Somebody polls in between: presence advances in the store.
    const advanced = Date.now() + 30_000;
    stored.find((u) => u.id === PLAYER)!.lastSeenAt = advanced;

    const res = validateRegisteredUsers(stored, payload, ADMIN, true);
    expect(res.ok).toBe(true);

    const saved = ((res as any).value as any[]).find((u) => u.id === PLAYER);
    // The stale copy must not be written back, or presence rewinds to whenever
    // the admin loaded the page.
    expect(saved.lastSeenAt).toBe(advanced);
    expect(isUserOnline(saved)).toBe(true);
  });

  it("keeps an account the admin's snapshot never had a timestamp for", () => {
    // A player who had never been seen when the roster was loaded. The stored
    // row has since been stamped by their first poll.
    const stored = liveRoster();
    const unseen = stored.find((u) => u.id === PLAYER)!;
    delete (unseen as Record<string, unknown>).lastSeenAt;
    delete (unseen as Record<string, unknown>).lastKnownIp;

    const payload = adminPayloadFrom(stored);
    const carried = payload.find((u) => u.id === PLAYER);
    expect(carried.lastSeenAt).toBeUndefined();

    const firstSeen = Date.now();
    stored.find((u) => u.id === PLAYER)!.lastSeenAt = firstSeen;
    stored.find((u) => u.id === PLAYER)!.lastKnownIp = "3.3.3.3";

    const res = validateRegisteredUsers(stored, payload, ADMIN, true);
    const saved = ((res as any).value as any[]).find((u) => u.id === PLAYER);
    expect(saved.lastSeenAt).toBe(firstSeen);
    expect(saved.lastKnownIp).toBe("3.3.3.3");
    expect(isUserOnline(saved)).toBe(true);
  });

  it("does not let an admin forge another account's timestamp", () => {
    // A client-supplied timestamp is a claim, not an observation. The server
    // stamps presence in touchUserLastIp and nowhere else.
    const stored = liveRoster();
    const real = stored.find((u) => u.id === PLAYER)!.lastSeenAt;

    const forged = Date.now() + 60 * 60_000;
    const payload = [
      { id: ADMIN, username: "omarsaleh97", subscription: "pro" },
      { id: PLAYER, username: "leonknox1", subscription: "free", lastSeenAt: forged, lastKnownIp: "6.6.6.6" },
    ];

    const res = validateRegisteredUsers(stored, payload, ADMIN, true);
    expect(res.ok).toBe(true);

    const saved = ((res as any).value as any[]).find((u) => u.id === PLAYER);
    expect(saved.lastSeenAt).toBe(real);
    expect(saved.lastKnownIp).not.toBe("6.6.6.6");
    expect(isUserOnline(saved)).toBe(true);
  });

  it("does not persist the derived online flag as if it were a fact", () => {
    // `online` is recomputed from `lastSeenAt` on every read. Storing the
    // client's copy would leave a boolean that can disagree with the timestamp
    // it was derived from.
    const stored = liveRoster();
    const payload = adminPayloadFrom(stored);
    payload.find((u) => u.id === PLAYER)!.online = true;
    payload.find((u) => u.id === PLAYER)!.online = false;

    const res = validateRegisteredUsers(stored, payload, ADMIN, true);
    const saved = ((res as any).value as any[]).find((u) => u.id === PLAYER);
    expect(saved["online"]).toBeUndefined();
    expect(isUserOnline(saved)).toBe(true);
  });

  it("still lets an admin edit the fields they are meant to own", () => {
    // The restore must be narrow. An admin manages subscriptions, approvals and
    // bans, and none of that may be taken away by this fix.
    const stored = liveRoster();
    const payload = [
      { id: ADMIN, username: "omarsaleh97", subscription: "pro" },
      {
        id: PLAYER,
        username: "leonknox1",
        subscription: "pro",
        posterApprovedAt: 1_700_000_000_000,
        rankOverride: 2500,
      },
    ];

    const res = validateRegisteredUsers(stored, payload, ADMIN, true);
    expect(res.ok).toBe(true);

    const saved = ((res as any).value as any[]).find((u) => u.id === PLAYER);
    expect(saved.subscription).toBe("pro");
    expect(saved.posterApprovedAt).toBe(1_700_000_000_000);
    expect(saved.rankOverride).toBe(2500);
  });

  it("leaves the admin's own row alone", () => {
    const stored = liveRoster();
    const payload = adminPayloadFrom(stored);

    const res = validateRegisteredUsers(stored, payload, ADMIN, true);
    const saved = ((res as any).value as any[]).find((u) => u.id === ADMIN);
    expect(saved.lastSeenAt).toBe(stored.find((u) => u.id === ADMIN)!.lastSeenAt);
    expect(isUserOnline(saved)).toBe(true);
  });

  it("keeps a player from touching anyone else, admin or not", () => {
    // The non-admin branch already restores other rows wholesale; confirm the
    // fix did not quietly weaken it.
    const stored = liveRoster();
    const payload = [
      { id: PLAYER, username: "leonknox1", subscription: "pro" },
      { id: ADMIN, username: "omarsaleh97", subscription: "pro", lastSeenAt: 1 },
    ];

    const res = validateRegisteredUsers(stored, payload, PLAYER, false);
    expect(res.ok).toBe(true);
    const saved = ((res as any).value as any[]).find((u) => u.id === ADMIN);
    expect(isUserOnline(saved)).toBe(true);
  });
});

describe("the two symptoms of a stale stamp", () => {
  it("reports offline past the window, online inside it", () => {
    const now = Date.now();
    expect(isUserOnline({ lastSeenAt: now })).toBe(true);
    expect(isUserOnline({ lastSeenAt: now - (ONLINE_WINDOW_MS - 1000) })).toBe(true);
    expect(isUserOnline({ lastSeenAt: now - (ONLINE_WINDOW_MS + 60_000) })).toBe(false);
    // A row that never got stamped at all is offline, not a crash.
    expect(isUserOnline({})).toBe(false);
    expect(isUserOnline(null)).toBe(false);
  });
});
