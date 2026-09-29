import { describe, it, expect, vi } from "vitest";
import { readUserMediaFile } from "@/lib/userMediaStorage";

/**
 * Media keys used to be `<userId>_<Date.now()>.<ext>`. The Discord id is
 * published in the public `registeredUsers` blob and the timestamp is easy to
 * sweep, so anyone could derive another user's media key. The random component
 * makes the key unguessable instead.
 */
describe("user media key shape", () => {
  it("refuses keys outside the media prefixes", async () => {
    await expect(readUserMediaFile("lobbies")).resolves.toBeNull();
    await expect(readUserMediaFile("directMessages")).resolves.toBeNull();
    await expect(readUserMediaFile("../secrets")).resolves.toBeNull();
    await expect(readUserMediaFile("")).resolves.toBeNull();
  });

  it("mints distinct keys even within the same millisecond", async () => {
    // Both calls run with a stubbed KV so the timestamp cannot differ.
    const put = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/cloudflareBindings", () => ({
      getKVBinding: vi.fn().mockResolvedValue({ put }),
    }));
    vi.resetModules();

    const mod = await import("@/lib/userMediaStorage");
    const a = await mod.storeUserMediaFile("111", Buffer.from("a"), "webp", "image/webp");
    const b = await mod.storeUserMediaFile("111", Buffer.from("b"), "webp", "image/webp");

    const keyOf = (url: string) => new URL(url, "https://x.test").searchParams.get("key")!;
    expect(keyOf(a)).not.toBe(keyOf(b));
    // Still the same shape, so nothing downstream has to change.
    expect(keyOf(a)).toMatch(/^user-media:111_\d+_[0-9a-f-]{36}\.webp$/);

    vi.doUnmock("@/lib/cloudflareBindings");
    vi.resetModules();
  });
});
