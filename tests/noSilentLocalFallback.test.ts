import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The site's only durable store is D1. `src/lib/db.ts` also has a SQLite path
 * for `npm run dev`, and it used to be reachable in production: `getD1()` logs
 * and returns null on any failure, and every helper then quietly wrote to a
 * file under `process.cwd()`. On Workers that filesystem is read-only and
 * throwaway, so the write "succeeded" from the request's point of view, the
 * player was told it saved, and the data evaporated with the isolate.
 *
 * A Cloudflare plan lapsing takes D1 down with it. The site has to answer with
 * an error in that case, never with a false promise.
 */
const { getCloudflareContextMock, sqliteMock } = vi.hoisted(() => ({
  getCloudflareContextMock: vi.fn(),
  sqliteMock: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: getCloudflareContextMock }));
vi.mock("better-sqlite3", () => ({ default: sqliteMock }));
vi.mock("@/lib/cloudflareBindings", () => ({
  invalidatePublicDataCache: vi.fn(async () => {}),
  setPublicDataCached: vi.fn(async () => {}),
  getPublicDataCached: vi.fn(async () => null),
  publicDataCacheKey: (k: string | null) => k || "all",
  invalidateThreadBlobCache: vi.fn(),
}));

import { getKV, setKV } from "@/lib/db";

describe("local SQLite fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    sqliteMock.mockReset();
    getCloudflareContextMock.mockReset();
  });

  it("never opens a local database on Workers when the D1 binding is gone", async () => {
    // A lapsed Cloudflare plan leaves the worker running with no `DB` binding.
    getCloudflareContextMock.mockReturnValue({ env: {} });

    await expect(setKV("lobbies", [{ id: "l1" }])).rejects.toThrow(/unavailable on Cloudflare/i);
    await expect(getKV("lobbies")).rejects.toThrow(/unavailable on Cloudflare/i);
    // The whole point: not one byte was written to a local file.
    expect(sqliteMock).not.toHaveBeenCalled();
  });

  it("still allows a local database when D1 is genuinely absent off Cloudflare", async () => {
    // `npm run dev` has no Cloudflare context at all, and that is the one
    // place the SQLite path is meant to work.
    getCloudflareContextMock.mockImplementation(() => {
      throw new Error("not a Cloudflare runtime");
    });
    const run = vi.fn();
    sqliteMock.mockReturnValue({
      pragma: vi.fn(),
      exec: vi.fn(),
      prepare: vi.fn(() => ({ run, get: vi.fn(() => ({ value: "[]" })), all: vi.fn(() => []) })),
      transaction: (fn: any) => fn,
    });
    (await import("fs")).mkdirSync(`${process.cwd()}\\src\\data`, { recursive: true });

    await setKV("lobbies", [{ id: "l1" }]);
    expect(sqliteMock).toHaveBeenCalled();
  });
});
