import { describe, it, expect, vi } from "vitest";

/**
 * Two accounts, one machine, one address — the shape that produced "my second
 * account is not in the Online Now list".
 *
 * Presence is a server-side `lastSeenAt` stamp on the caller's own row, written
 * by `touchUserLastIp` on every read of `/api/data`, and read back by
 * `isUserOnline` in the scoped payload. So the two things that can break it are
 * (a) the stamp not landing, and (b) the stamp landing but the other account not
 * being told about it.
 *
 * This drives the real `touchUserLastIp` and the real `updateKVAtomic` against a
 * fake D1 with D1's actual compare-and-swap semantics, so a lost update is a
 * lost update rather than something the mock papers over.
 */

const h = vi.hoisted(() => {
  const store = new Map<string, { value: string }>();

  function runStatement(sql: string, args: unknown[]): number {
    if (sql.includes("ON CONFLICT(key) DO NOTHING")) {
      const [key, value] = args as [string, string];
      if (store.has(key)) return 0;
      store.set(key, { value });
      return 1;
    }
    if (sql.includes("WHERE key = ? AND value = ?")) {
      const [value, key, expected] = args as [string, string, string];
      const row = store.get(key);
      if (!row || row.value !== expected) return 0;
      row.value = value;
      return 1;
    }
    if (sql.includes("ON CONFLICT(key) DO UPDATE")) {
      const [key, value] = args as [string, string];
      store.set(key, { value });
      return 1;
    }
    throw new Error(`unexpected SQL: ${sql}`);
  }

  const d1 = {
    prepare(sql: string) {
      const stmt: any = {
        bind(...args: unknown[]) {
          return {
            async first<T>() {
              // Reads and writes are separate round trips on D1; yielding here is
              // what lets two concurrent writers collide on the same row.
              await new Promise<void>((r) => setTimeout(r, 0));
              const row = store.get(String(args[0]));
              return row ? ({ value: row.value } as T) : null;
            },
            async run() {
              await new Promise<void>((r) => setTimeout(r, 0));
              return { meta: { changes: runStatement(sql, args) } };
            },
            async all<T>() {
              return { results: [...store.entries()].map(([key, r]) => ({ key, value: r.value })) as T[] };
            },
          };
        },
      };
      return stmt;
    },
  };

  return { store, d1 };
});

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { DB: h.d1 } }),
}));
vi.mock("@/lib/d1", () => ({
  ensureD1Schema: vi.fn(async () => h.d1),
  getD1: vi.fn(async () => h.d1),
  KV_SCHEMA_SQL: "",
}));
vi.mock("@/lib/cloudflareBindings", () => ({
  invalidatePublicDataCache: vi.fn(async () => {}),
  invalidateThreadBlobCache: vi.fn(async () => {}),
}));

import { touchUserLastIp } from "@/lib/userLastIp";
import { isUserOnline, ONLINE_WINDOW_MS } from "@/lib/dataAccess";

const A = "111111111111111111";
const B = "222222222222222222";
const SHARED_IP = "203.0.113.7";

function seedRoster() {
  h.store.set("registeredUsers", {
    value: JSON.stringify([
      { id: A, username: "alpha", lastKnownIp: null, lastSeenAt: 0 },
      { id: B, username: "bravo", lastKnownIp: null, lastSeenAt: 0 },
    ]),
  });
}

function roster(): any[] {
  return JSON.parse(h.store.get("registeredUsers")!.value);
}

function online(id: string, now = Date.now()): boolean {
  return isUserOnline(roster().find((u) => u.id === id) as any, now);
}

describe("two accounts on one machine both read as present", () => {
  it("stamps both rows when the same address polls", async () => {
    seedRoster();
    await Promise.all([touchUserLastIp(A, SHARED_IP), touchUserLastIp(B, SHARED_IP)]);

    expect(online(A)).toBe(true);
    expect(online(B)).toBe(true);
  });

  it("stamps both rows under repeated concurrent polling", async () => {
    seedRoster();
    // Several panels on each account all hit /api/data on their own cadence, so
    // the two accounts interleave repeatedly rather than once.
    for (let round = 0; round < 8; round++) {
      await Promise.all([
        touchUserLastIp(A, SHARED_IP),
        touchUserLastIp(B, SHARED_IP),
        touchUserLastIp(A, SHARED_IP),
      ]);
    }

    expect(online(A)).toBe(true);
    expect(online(B)).toBe(true);
  });

  it("keeps the second account fresh across the whole presence window", async () => {
    seedRoster();
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);

    // The first poll establishes presence for both.
    await Promise.all([touchUserLastIp(A, SHARED_IP), touchUserLastIp(B, SHARED_IP)]);
    expect(online(B, start)).toBe(true);

    // The stamp is throttled to once a minute. Sit just inside the window and
    // poll again: account B must still be reported present.
    const later = start + ONLINE_WINDOW_MS - 1_000;
    vi.spyOn(Date, "now").mockReturnValue(later);
    await Promise.all([touchUserLastIp(A, SHARED_IP), touchUserLastIp(B, SHARED_IP)]);

    expect(online(B, later)).toBe(true);
    vi.restoreAllMocks();
  });

  it("does not report the second account present on a stale stamp alone", async () => {
    // The control: if the stamp genuinely never lands, the account is offline.
    // This is what makes the tests above meaningful rather than vacuous.
    seedRoster();
    const now = Date.now() + ONLINE_WINDOW_MS + 1_000;
    expect(online(A, now)).toBe(false);
    expect(online(B, now)).toBe(false);
  });

  it("does not let one account's touch disturb the other's row", async () => {
    seedRoster();
    await touchUserLastIp(A, SHARED_IP);
    const bRow = roster().find((u) => u.id === B)!;

    expect(bRow.lastSeenAt).toBe(0);
    expect(bRow.lastKnownIp).toBeNull();
  });
});
