import { describe, it, expect, vi } from "vitest";

/**
 * The uploads take a `multipart/form-data` body, and `req.formData()` buffers
 * all of it into worker memory before anything is inspected. Both routes used to
 * check the size *after* that read, so the advertised "max 15MB" / "max 8MB"
 * was enforced only once the payload was already resident — the same shape of
 * bug as the out-of-memory crash (Error 1102) this site has already suffered.
 *
 * These tests assert the ordering that matters: on an oversized declared length
 * the body parser is never reached.
 */
const { authzMock, rateLimitMock, vfxDbMock } = vi.hoisted(() => ({
  authzMock: vi.fn(async () => ({ ok: true, user: { id: "u1", username: "u" } })),
  rateLimitMock: vi.fn(async () => ({ ok: true })),
  vfxDbMock: vi.fn(async () => [{ id: "u1", username: "u", lobbyVfx: null }]),
}));

vi.mock("@/lib/authz", () => ({ requireSession: authzMock as any }));
// lobby-vfx resolves its session through authEnv's helper rather than authz's.
vi.mock("@/lib/authEnv", () => ({
  getActiveSession: vi.fn(async () => ({
    session: { user: { id: "u1", username: "u" } },
  })),
}));
vi.mock("@/lib/rateLimit", () => ({ rateLimitByUser: rateLimitMock as any }));
vi.mock("@/lib/db", () => ({
  getKV: vfxDbMock as any,
  initTables: vi.fn(async () => {}),
  setKV: vi.fn(async () => {}),
  storeUserMediaFile: vi.fn(async () => ({ ok: true, key: "k" })),
  readUserMediaFile: vi.fn(async () => ({ ok: false })),
  getImageMetadata: vi.fn(async () => ({ width: 10, height: 10 })),
  normalizeLobbyVfx: vi.fn(async () => "data:image/webp;base64,AA"),
  isAnimatedImageUrl: vi.fn(async () => false),
  fetchExternalImageBuffer: vi.fn(async () => null),
  isSecretClubTier: vi.fn(() => true),
}));

import { POST as videoUpload } from "@/app/api/community/video-upload/route";
import { POST as lobbyVfx } from "@/app/api/user/lobby-vfx/route";

/**
 * A Request whose body reader records whether anything tried to read it. If the
 * route refuses on the declared length, this stays untouched — which is the
 * whole point of the fix.
 */
function trackedRequest(contentLength: number) {
  const state = { bodyRead: false };
  const req = new Request("http://localhost/upload", {
    method: "POST",
    headers: {
      "content-type": "multipart/form-data; boundary=x",
      "content-length": String(contentLength),
    },
    body: "--x--",
    // @ts-expect-error node's Request takes a duplex for streaming bodies
    duplex: "half",
  });
  const realText = req.text.bind(req);
  req.text = async () => {
    state.bodyRead = true;
    return realText();
  };
  const realForm = req.formData.bind(req);
  req.formData = async () => {
    state.bodyRead = true;
    return realForm();
  };
  return { req, state };
}

describe("upload size checks happen before the body is read", () => {
  it("video-upload refuses a 500MB body without reading it", async () => {
    const { req, state } = trackedRequest(500 * 1024 * 1024);
    const res = await videoUpload(req as any);
    expect(res.status).toBe(413);
    expect(state.bodyRead).toBe(false);
  });

  it("lobby-vfx refuses a 500MB body without reading it", async () => {
    const { req, state } = trackedRequest(500 * 1024 * 1024);
    const res = await lobbyVfx(req as any);
    expect(res.status).toBe(413);
    expect(state.bodyRead).toBe(false);
  });
});
