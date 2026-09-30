import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The Discord interactions endpoint is the only way to act on a Discord button,
 * and it trusts nothing but the Ed25519 signature on the request.
 *
 * `verifyKey` from `discord-interactions` is async, so the original
 *
 *   if (!verifyKey(body, signature, timestamp, publicKey)) → 401
 *
 * evaluated `!Promise` → `false` and never rejected anything. The endpoint was
 * open to the whole internet: a forged `role_*` interaction granted real
 * Discord roles, `discord_accept_*` accepted invites on another user's behalf,
 * and `apply_*` wrote into the site's offers blob. It was also exempt from rate
 * limiting, so each forged call also burned the shared bot token's budget.
 */
const { verifyKeyMock, toggleRoleMock, applyMock, acceptMock } = vi.hoisted(() => ({
  verifyKeyMock: vi.fn(),
  toggleRoleMock: vi.fn(),
  applyMock: vi.fn(),
  acceptMock: vi.fn(),
}));

vi.mock("discord-interactions", () => ({ verifyKey: verifyKeyMock }));
vi.mock("@/lib/authEnv", () => ({ syncAuthEnvFromCloudflare: vi.fn(async () => {}) }));
vi.mock("@/lib/lobbyDiscord", () => ({
  applyToLobbyFromDiscord: applyMock,
  confirmInviteFromDiscord: acceptMock,
  declineInviteFromDiscord: vi.fn(),
}));
vi.mock("@/lib/discordGuild", () => ({
  getMemberEntryRoles: vi.fn(async () => ["role-a"]),
  toggleEntryRole: toggleRoleMock,
}));

import { POST } from "@/app/api/discord/interactions/route";

const forgedRoleGrant = {
  type: 3,
  data: { custom_id: "role_arabicChat" },
  member: { user: { id: "attacker-snowflake" } },
};

function request(headers: Record<string, string> = {}) {
  return new Request("https://aion2lfg.com/api/discord/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(forgedRoleGrant),
  });
}

describe("POST /api/discord/interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DISCORD_PUBLIC_KEY = "test-public-key";
    // The real `verifyKey` is async. Reproduce that shape exactly: if the route
    // ever stops awaiting it again, this test fails.
    verifyKeyMock.mockResolvedValue(false);
  });

  it("rejects a request with no signature at all", async () => {
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(verifyKeyMock).toHaveBeenCalled();
    // Nothing may act on the payload: no role change, no offer write.
    expect(toggleRoleMock).not.toHaveBeenCalled();
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("rejects a request whose signature fails verification", async () => {
    verifyKeyMock.mockResolvedValue(false);
    const res = await POST(
      request({ "X-Signature-Ed25519": "deadbeef", "X-Signature-Timestamp": "1700000000" })
    );
    expect(res.status).toBe(401);
    expect(toggleRoleMock).not.toHaveBeenCalled();
  });

  it("fails closed when verification itself throws", async () => {
    verifyKeyMock.mockRejectedValue(new Error("malformed key"));
    const res = await POST(
      request({ "X-Signature-Ed25519": "deadbeef", "X-Signature-Timestamp": "1700000000" })
    );
    expect(res.status).toBe(401);
    expect(toggleRoleMock).not.toHaveBeenCalled();
  });

  it("only acts once verification resolves true", async () => {
    verifyKeyMock.mockResolvedValue(true);
    const res = await POST(
      request({ "X-Signature-Ed25519": "good", "X-Signature-Timestamp": "1700000000" })
    );
    expect(res.status).toBe(200);
    expect(toggleRoleMock).toHaveBeenCalled();
  });
});
