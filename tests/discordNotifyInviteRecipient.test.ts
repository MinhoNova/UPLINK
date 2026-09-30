import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The site's bot is a shared identity. Every outbound DM it sends is a message
 * from UPLINK to a stranger, and a shared identity is the cheapest thing on the
 * internet to borrow: one call to `/api/discord/notify-invite` with someone
 * else's snowflake turned the bot into a spam cannon pointed at whoever the
 * caller felt like.
 *
 * Owning an offer is not permission to DM people who are not on it. The
 * recipient is resolved from the roster — applicants, invitees, accepted
 * members — and nowhere else.
 */
const { getKVPairsMock, initTablesMock, inviteDMMock, confirmedDMMock, rateLimitMock } = vi.hoisted(() => ({
  getKVPairsMock: vi.fn(),
  initTablesMock: vi.fn(async () => {}),
  inviteDMMock: vi.fn(async () => true),
  confirmedDMMock: vi.fn(async () => true),
  rateLimitMock: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/db", () => ({
  getKVPairs: getKVPairsMock as any,
  initTables: initTablesMock as any,
}));
vi.mock("@/lib/rateLimit", () => ({ rateLimitByUser: rateLimitMock as any }));
vi.mock("@/lib/discord", () => ({
  sendDiscordInviteDM: inviteDMMock as any,
  sendDiscordConfirmedDM: confirmedDMMock as any,
}));
// `requireSession` is exercised through the route's own auth call. The session
// is built inside the factory so the hoisted mock never reads module state that
// has not been initialised yet.
vi.mock("@/lib/authz", () => ({
  requireSession: vi.fn(async () => ({ ok: true, user: { id: "owner-1", username: "owner" } })),
}));

import { POST } from "@/app/api/discord/notify-invite/route";

const OWNER = "owner-1";
const VICTIM_DISCORD = "999999999999999999";

const lobby = (over: Record<string, any> = {}) => ({
  id: "lobby-1",
  ownerId: OWNER,
  applicants: [],
  invited: [],
  accepted: [],
  history: [],
  ...over,
});

const data = (l: any) => ({ lobbies: [l], registeredUsers: [{ id: OWNER, username: "owner" }] });

const call = (body: any) =>
  POST(
    new Request("http://localhost/api/discord/notify-invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as any
  );

const session = { user: { id: OWNER, username: "owner" } };
void session;

describe("POST /api/discord/notify-invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockResolvedValue({ ok: true } as any);
    getKVPairsMock.mockResolvedValue(data(lobby()));
  });

  it("refuses to DM a Discord id that is not on the offer", async () => {
    getKVPairsMock.mockResolvedValue(data(lobby()));
    const res = await call({ lobbyId: "lobby-1", applicantDiscordId: VICTIM_DISCORD, notifId: "n1" });
    expect(res.status).toBe(403);
    expect(inviteDMMock).not.toHaveBeenCalled();
  });

  it("still DMs a real applicant on the offer", async () => {
    getKVPairsMock.mockResolvedValue(
      data(lobby({ applicants: [{ id: "a1", discordId: VICTIM_DISCORD, userName: "someone" }] }))
    );
    const res = await call({ lobbyId: "lobby-1", applicantDiscordId: VICTIM_DISCORD, notifId: "n1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(inviteDMMock).toHaveBeenCalledTimes(1);
  });

  it("DMs an accepted member in confirmed mode", async () => {
    getKVPairsMock.mockResolvedValue(
      data(lobby({ accepted: [{ id: "m1", discordId: VICTIM_DISCORD }] }))
    );
    const res = await call({ lobbyId: "lobby-1", applicantDiscordId: VICTIM_DISCORD, mode: "confirmed" });
    expect(res.status).toBe(200);
    expect(confirmedDMMock).toHaveBeenCalledTimes(1);
  });

  it("stops the caller from spending the bot's DM budget", async () => {
    rateLimitMock.mockResolvedValue({ ok: false, retryAfterMs: 1000 } as any);
    const res = await call({ lobbyId: "lobby-1", applicantDiscordId: VICTIM_DISCORD, mode: "confirmed" });
    expect(res.status).toBe(429);
    expect(confirmedDMMock).not.toHaveBeenCalled();
  });

  it("rejects an id similar to, but not, a roster entry", async () => {
    getKVPairsMock.mockResolvedValue(
      data(lobby({ accepted: [{ id: "m1", discordId: "111" }] }))
    );
    const res = await call({ lobbyId: "lobby-1", applicantDiscordId: "11", mode: "confirmed" });
    expect(res.status).toBe(403);
  });
});
