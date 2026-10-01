import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The per-account and per-address limiters share one `rateLimits` row, and they
 * write it with two different strategies:
 *
 *   - `rateLimitByUser` goes through `updateKVAtomic`: compare-and-swap
 *     (`UPDATE ... WHERE key = ? AND value = ?`) with a bounded retry count.
 *   - `rateLimitByIp` does a bare `SELECT` and then an unconditional
 *     `INSERT ... ON CONFLICT DO UPDATE SET value = excluded.value`.
 *
 * The blind write is the problem. Every signed-in `GET /api/data` runs both, in
 * that order, on the same row. The per-address write lands on top of whatever
 * the per-account write just committed, so the account counter it incremented is
 * simply gone. The per-account write then has to win its own compare-and-swap
 * against a value that keeps moving underneath it, and when it exhausts
 * `maxAttempts` the helper reports failure — which the caller cannot tell apart
 * from "you are over the limit", so it answers 429.
 *
 * That is load-bearing well beyond the counter being wrong. `touchUserLastIp`
 * runs *after* both checks, so a 429 means the request never reaches the line
 * that stamps `lastSeenAt`. A player whose reads get throttled stops being
 * reported as present and silently drops off the Online Now list, which is the
 * exact symptom of "my second account on the same machine is not in the list".
 *
 * The fake below models D1's actual semantics — `ON CONFLICT DO NOTHING` reports
 * 0 changes, and `UPDATE ... WHERE value = ?` only reports 1 when the row still
 * holds the value the writer read — so the interleaving is real rather than
 * assumed.
 */

/**
 * `vi.hoisted`, not a plain const: the mocks below are registered above the
 * imports, and the fake D1 has to exist before either mocked module reads it.
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
    if (sql.includes("ON CONFLICT(key) DO UPDATE")) {
      const [key, value] = args as [string, string];
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
    throw new Error(`unexpected SQL: ${sql}`);
  }

  const d1 = {
    prepare(sql: string) {
      const stmt: any = {
        bind(...args: unknown[]) {
          return {
            async first<T>() {
              // D1 reads and writes are separate round trips. Yielding here lets
              // concurrent callers observe the same value before any of them
              // commits, which is what makes compare-and-swap actually contend.
              await new Promise<void>((r) => setTimeout(r, 0));
              const row = store.get(String(args[0]));
              return row ? ({ value: row.value } as T) : null;
            },
            async run() {
              await new Promise<void>((r) => setTimeout(r, 0));
              return { meta: { changes: runStatement(sql, args) } };
            },
          };
        },
      };
      return stmt;
    },
  };

  return { store, d1 };
});

const store = h.store;
const d1 = h.d1;

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { DB: d1 } }),
}));

vi.mock("@/lib/d1", () => ({
  // `initTables` treats a falsy return as "no D1" and reaches for the local
  // SQLite file, which db.ts refuses while the Cloudflare mock is in place.
  ensureD1Schema: vi.fn(async () => d1),
  getD1: vi.fn(async () => d1),
  KV_SCHEMA_SQL: "",
}));

vi.mock("@/lib/cloudflareBindings", () => ({
  invalidatePublicDataCache: vi.fn(async () => {}),
  invalidateThreadBlobCache: vi.fn(async () => {}),
}));

import { rateLimitByIp } from "@/lib/rateLimitDistributed";
import { rateLimitByUser } from "@/lib/rateLimit";

const LIMIT = 10;
const WINDOW = 60_000;

/** Resolves once the timer queue drains, standing in for a network hop. */
const hop = () => new Promise<void>((r) => setTimeout(r, 0));

function readBuckets(): Record<string, { count: number }> {
  const raw = store.get("rateLimits")?.value;
  return raw ? (JSON.parse(raw) as Record<string, { count: number }>) : {};
}

function seedIpBucket(count: number) {
  store.set("rateLimits", {
    value: JSON.stringify({ "ip:1.2.3.4:/api/data": { count, windowStart: Date.now() } }),
  });
}

beforeEach(() => {
  store.clear();
});

describe("the per-account and per-address limiters share one row", () => {
  it("does not use a blind overwrite, which is what destroys the other counter", async () => {
    const calls: string[] = [];
    const original = d1.prepare.bind(d1);
    vi.spyOn(d1, "prepare").mockImplementation((sql: string) => {
      if (sql.includes("ON CONFLICT(key) DO UPDATE SET value = excluded.value")) {
        calls.push(sql);
      }
      return original(sql);
    });

    await rateLimitByIp("1.2.3.4", "/api/data", LIMIT, WINDOW);

    expect(calls).toEqual([]);
    expect(calls.join(" ")).not.toMatch(/excluded\.value/);
  });

  it("keeps the account counter that the address check just ran against it", async () => {
    // The account is nowhere near its ceiling, so a correct implementation
    // counts every call and permits every one.
    const results: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      results.push((await rateLimitByUser("acct-1", "data-read", LIMIT, WINDOW)).ok);
    }

    expect(readBuckets()["user:acct-1:data-read"].count).toBe(6);
    expect(results.every(Boolean)).toBe(true);
  });

  it("survives the address limiter rewriting the row between the two checks", async () => {
    // Exactly the order the data route uses: per-account, then per-address.
    // Both write the same row, so the second write has to preserve the first.
    for (let i = 0; i < 5; i++) {
      await rateLimitByUser("acct-1", "data-read", LIMIT, WINDOW);
      await rateLimitByIp("1.2.3.4", "/api/data", LIMIT, WINDOW);
    }

    const saved = readBuckets();
    expect(saved["user:acct-1:data-read"].count).toBe(5);
    expect(saved["ip:1.2.3.4:/api/data"].count).toBe(5);
  });

  it("does not report a phantom 429 when only the row moved under it", async () => {
    // A single account polling, with a concurrent writer on the same row. The
    // account is at 1 of 10 — it must never be told to slow down.
    await rateLimitByUser("acct-1", "data-read", LIMIT, WINDOW);

    const noise = (async () => {
      for (let i = 0; i < 6; i++) {
        await rateLimitByIp("9.9.9.9", "/api/community/posts", LIMIT, WINDOW);
      }
    })();

    const mine: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      mine.push((await rateLimitByUser("acct-1", "data-read", LIMIT, WINDOW)).ok);
      await hop();
    }
    await noise;

    expect(mine.every(Boolean)).toBe(true);
  });

  it("does not throttle an account that is nowhere near its ceiling", async () => {
    // Two accounts behind one address, both polling — the exact shape of a
    // player signed in twice on one machine. The ceilings here are far above
    // what this traffic costs, so every call must be permitted and every counter
    // must survive.
    const perAccount = 90;
    const perAddress = 240;
    const rounds = 12;

    const denied: string[] = [];
    const poll = async (acct: string) => {
      for (let i = 0; i < rounds; i++) {
        const byUser = await rateLimitByUser(acct, "data-read", perAccount, WINDOW);
        const byIp = await rateLimitByIp("1.2.3.4", "/api/data", perAddress, WINDOW);
        if (!byUser.ok) denied.push(`${acct}:user`);
        if (!byIp.ok) denied.push(`${acct}:ip`);
        // Yield so the two accounts genuinely interleave on the shared row.
        await hop();
      }
    };

    await Promise.all([poll("acct-1"), poll("acct-2")]);

    expect(denied).toEqual([]);
    const saved = readBuckets();
    expect(saved["user:acct-1:data-read"].count).toBe(rounds);
    expect(saved["user:acct-2:data-read"].count).toBe(rounds);
    expect(saved["ip:1.2.3.4:/api/data"].count).toBe(rounds * 2);
  });

  it("never turns a lost write race into a 429", async () => {
    // `updateKVAtomic` reports `ok: false` both for "you are over the limit" and
    // for "I lost the compare-and-swap three times running", and `checkKvBucket`
    // cannot tell them apart. Sustained churn on the shared row is enough to
    // make a caller at 1 of 90 be told to slow down — and on `/api/data` that
    // 429 is returned *before* the line that stamps `lastSeenAt`, so the account
    // silently stops being reported as present and drops off the Online Now list.
    const perAccount = 90;

    // Keep the row moving for the whole run: a second writer committing
    // constantly, exactly as the per-address limiter does.
    let churning = true;
    const churn = (async () => {
      let n = 0;
      while (churning) {
        await rateLimitByIp("9.9.9.9", `/churn/${n++}`, 1_000_000, WINDOW);
      }
    })();

    const denied: boolean[] = [];
    for (let i = 0; i < 20; i++) {
      denied.push((await rateLimitByUser("acct-1", "data-read", perAccount, WINDOW)).ok);
    }
    churning = false;
    await churn;

    expect(denied.filter((ok) => !ok)).toEqual([]);
  });

  it("still refuses a caller that really is over the ceiling", async () => {
    seedIpBucket(LIMIT);
    const res = await rateLimitByIp("1.2.3.4", "/api/data", LIMIT, WINDOW);
    expect(res.ok).toBe(false);
  });
});
