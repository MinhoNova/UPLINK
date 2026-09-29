import { describe, it, expect } from "vitest";
import { validateLobbies } from "@/lib/secureDataWrite";
import { MAX_INLINE_IMAGE_BYTES } from "@/lib/inlineImage";

/**
 * Error 1102: the worker exceeded its memory limit.
 *
 * Pasted chat images and payment proofs are stored as base64 data URLs on the
 * message objects, inside the one `lobbies` blob. A multi-megabyte screenshot
 * therefore made every subsequent read of that blob — the thread route, the
 * data route, every save — parse megabytes of base64 and tip the worker over.
 *
 * Two defences: the client downscales on paste, and the server refuses to
 * persist anything oversized even if a request arrives without that.
 */

const OWNER = "711027724663128106";

const lobby = (over: Record<string, unknown> = {}) => ({
  id: "1790139137329",
  ownerId: OWNER,
  ownerDiscordName: "omarsaleh97",
  status: "standby",
  accepted: [],
  invited: [],
  applicants: [],
  messages: [],
  ...over,
});

/** A data URL of roughly `kb` kilobytes once decoded. */
const bigDataUrl = (kb: number) => `data:image/png;base64,${"A".repeat(Math.round(kb * 1024 * 1.37))}`;

function ok(res: ReturnType<typeof validateLobbies>): any[] {
  if (!res.ok) throw new Error(`expected the write to be accepted, got: ${res.error}`);
  return res.value as any[];
}

describe("inline media in the lobbies blob", () => {
  it("keeps a normal-sized image", () => {
    const small = "data:image/jpeg;base64," + "A".repeat(2000);
    const stored = [lobby()];
    const res = validateLobbies(stored, [lobby({ messages: [{ id: 1, image: small }] })], OWNER, false);
    expect(ok(res)[0].messages[0].image).toBe(small);
  });

  it("refuses to persist an oversized pasted chat image", () => {
    const res = validateLobbies([lobby()], [lobby({ messages: [{ id: 1, text: "hi", image: bigDataUrl(3000) }] })], OWNER, false);
    const saved = ok(res)[0];
    const msg = saved.messages[0];
    // The message itself survives; only the giant image is dropped.
    expect(msg.text).toBe("hi");
    expect(msg.image).toBeUndefined();
  });

  it("refuses to persist an oversized payment proof", () => {
    const res = validateLobbies([lobby()], [lobby({ paymentProof: bigDataUrl(4000) })], OWNER, false);
    expect(ok(res)[0].paymentProof).toBeUndefined();
  });

  it("keeps an existing stored proof rather than dropping it on a later save", () => {
    const storedProof = "data:image/jpeg;base64," + "A".repeat(3000);
    const stored = [lobby({ paymentProof: storedProof })];
    const res = validateLobbies(stored, [lobby({ paymentProof: bigDataUrl(4000) })], OWNER, false);
    expect(ok(res)[0].paymentProof).toBe(storedProof);
  });

  it("leaves the rest of the save alone", () => {
    const res = validateLobbies([lobby()], [lobby({ status: "in_progress", messages: [{ id: 1, image: bigDataUrl(3000) }] })], OWNER, false);
    const saved = ok(res)[0];
    expect(saved.status).toBe("in_progress");
  });

  it("caps the stored size well under the client target", () => {
    // The server cap is the hard backstop; the client target is the soft one.
    expect(MAX_INLINE_IMAGE_BYTES).toBeLessThan(400 * 1024);
  });
});
