import { describe, it, expect } from "vitest";
import { publicDataView, PUBLIC_DATA_KEYS } from "@/lib/publicDataView";

const fullStore = {
  lobbies: [
    {
      id: "l1",
      ownerId: "u1",
      status: "standby",
      messages: [
        { id: "m1", body: "private plan", images: ["data:image/png;base64,AAAA"] },
        { id: "m2", body: "another" },
      ],
    },
  ],
  registeredUsers: [
    { id: "u1", name: "Owner", email: "owner@example.com", lastKnownIp: "1.2.3.4", lastSeenAt: 123, blocked: ["u9"] },
    { id: "u2", name: "Other", friendRequests: ["u1"], subscription: { tier: "gold", secret: "x" } },
  ],
  characters: [{ id: "c1", userId: "u1", name: "Alt" }],
  goldOffers: [{ id: "g1", amount: 100 }],
  directMessages: [{ id: "dm1", from: "u1", to: "u2", body: "secret dm" }],
  tickets: [{ id: "t1", userId: "u1", body: "private support ticket" }],
  auditLogs: [{ id: "a1", action: "ban", actor: "admin" }],
  userRoles: { u1: "admin" },
  notifications: [{ id: "n1", targetId: "u1", body: "private alert" }],
  applications: [{ id: "ap1", userId: "u1", email: "a@b.com" }],
  bannedUsers: [{ id: "u1", reason: "cheating" }],
  bannedUserIds: ["u1"],
  bannedIps: ["9.9.9.9"],
  friends: [{ requester: "u1", target: "u2" }],
  readMessages: { u1: ["dm1"] },
  deliveredMessages: { u1: ["dm1"] },
};

describe("publicDataView", () => {
  it("returns exactly the allowlisted keys and nothing else", () => {
    const out = publicDataView(fullStore);
    expect(Object.keys(out).sort()).toEqual([...PUBLIC_DATA_KEYS].sort());
  });

  it("never leaks DMs, tickets, audit logs, roles, bans or friend data", () => {
    const out = publicDataView(fullStore) as Record<string, unknown>;
    for (const secret of [
      "directMessages",
      "tickets",
      "auditLogs",
      "userRoles",
      "notifications",
      "applications",
      "bannedUsers",
      "bannedUserIds",
      "bannedIps",
      "friends",
      "readMessages",
      "deliveredMessages",
    ]) {
      expect(out[secret]).toBeUndefined();
    }
  });

  it("strips lobby chat bodies but keeps a message count", () => {
    const out = publicDataView(fullStore) as any;
    expect(out.lobbies[0].messages).toBeUndefined();
    expect(out.lobbies[0].messageCount).toBe(2);
  });

  it("strips per-player identifiers from the public roster", () => {
    const out = publicDataView(fullStore) as any;
    const owner = out.registeredUsers.find((u: any) => u.id === "u1");
    expect(owner.email).toBeUndefined();
    expect(owner.lastKnownIp).toBeUndefined();
    expect(owner.lastSeenAt).toBeUndefined();
    expect(owner.blocked).toBeUndefined();
    const other = out.registeredUsers.find((u: any) => u.id === "u2");
    expect(other.friendRequests).toBeUndefined();
    expect(other.subscription).toEqual({ tier: "gold" });
  });

  it("drops allowlisted keys that are absent instead of inventing them", () => {
    const out = publicDataView({ lobbies: [] }) as Record<string, unknown>;
    expect(out.lobbies).toEqual([]);
    expect("registeredUsers" in out).toBe(false);
  });
});
