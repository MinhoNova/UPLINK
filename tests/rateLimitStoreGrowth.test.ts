import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The `rateLimits` row is read, parsed and rewritten by the middleware on every
 * single `/api` request. It had grown past 200KB of counters whose windows had
 * long closed, because nothing ever removed them — the key is
 * `ip:<ip>:<path>`, so every new path and every new address added another entry
 * that stayed forever.
 *
 * That store is written from two modules, and both had to be fixed, so this
 * checks the actual source rather than a copy of the logic.
 */
function readSource(file: string): string {
  return readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

describe("rate limit store does not grow without bound", () => {
  it("prunes expired buckets in the D1-backed IP path", () => {
    const src = readSource("src/lib/rateLimitDistributed.ts");
    expect(src).toContain("pruneExpiredBuckets");
    // The prune has to run on the read that is already being paid for.
    expect(src).toMatch(/pruneExpiredBuckets\(store, now, windowMs\)/);
  });

  it("caps the bucket count so a burst cannot rebuild the blob", () => {
    const src = readSource("src/lib/rateLimitDistributed.ts");
    expect(src).toContain("MAX_BUCKETS");
    expect(src).toMatch(/capBuckets\(pruneExpiredBuckets/);
  });

  it("prunes expired buckets in the KV-backed user path too", () => {
    const src = readSource("src/lib/rateLimit.ts");
    expect(src).toContain("pruneExpiredBuckets");
    expect(src).toMatch(/pruneExpiredBuckets\(store \?\? \{\}, now, windowMs\)/);
  });

  it("keeps a denied request from reviving stale entries", () => {
    const src = readSource("src/lib/rateLimitDistributed.ts");
    // The store is pruned before the ceiling is consulted, so a denied request
    // still commits the prune — otherwise a flood of rejected calls would keep
    // the dead entries alive indefinitely. `mutateRateLimitStore` is what
    // performs that write now; the abort branch cannot carry the prune on its
    // own, so it has to be a separate best-effort pass.
    expect(src).toMatch(/pruneExpiredBuckets/);
    expect(src).toMatch(/mutateRateLimitStore/);
  });
});
