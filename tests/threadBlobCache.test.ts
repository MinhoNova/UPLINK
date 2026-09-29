import { describe, it, expect, beforeEach } from "vitest";
import {
  getThreadBlob,
  setThreadBlob,
  invalidateThreadBlobCache,
} from "@/lib/threadBlobCache";

/**
 * The offer thread reads the whole `lobbies` and `registeredUsers` blobs on
 * every open. Caching them per isolate is what keeps a burst of thread clicks
 * from tipping the worker into Error 1102 — but only if writes actually drop
 * the cache, otherwise a poster would read back their own stale edit.
 */
describe("threadBlobCache", () => {
  beforeEach(() => invalidateThreadBlobCache());

  it("returns undefined for a key that was never set", () => {
    expect(getThreadBlob("lobbies")).toBeUndefined();
  });

  it("returns a stored value within the ttl", () => {
    setThreadBlob("lobbies", [{ id: "1" }]);
    expect(getThreadBlob("lobbies")?.value).toEqual([{ id: "1" }]);
  });

  it("expires a value once the ttl has passed", () => {
    setThreadBlob("lobbies", [{ id: "1" }], 1);
    const now = Date.now();
    while (Date.now() <= now) { /* spin past the 1ms window */ }
    expect(getThreadBlob("lobbies", 1)).toBeUndefined();
  });

  it("drops a single key so a writer sees their own change", () => {
    setThreadBlob("lobbies", [{ id: "1" }]);
    setThreadBlob("registeredUsers", [{ id: "u1" }]);
    invalidateThreadBlobCache("lobbies");
    expect(getThreadBlob("lobbies")).toBeUndefined();
    expect(getThreadBlob("registeredUsers")?.value).toEqual([{ id: "u1" }]);
  });

  it("clears everything when no key is given", () => {
    setThreadBlob("lobbies", [{ id: "1" }]);
    setThreadBlob("registeredUsers", [{ id: "u1" }]);
    invalidateThreadBlobCache();
    expect(getThreadBlob("lobbies")).toBeUndefined();
    expect(getThreadBlob("registeredUsers")).toBeUndefined();
  });

  it("keeps a falsy stored value rather than re-reading", () => {
    setThreadBlob("lobbies", null);
    expect(getThreadBlob("lobbies")).toBeDefined();
    expect(getThreadBlob("lobbies")?.value).toBeNull();
  });
});
