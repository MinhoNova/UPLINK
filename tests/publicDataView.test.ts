import { describe, it, expect } from "vitest";
import {
  publicDataView,
  restrictToPublicKeys,
  isPublicDataKey,
  sanitizePublicUsers,
  PUBLIC_DATA_KEYS,
} from "@/lib/publicDataView";

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
    {
      id: "u1",
      name: "Owner",
      email: "owner@example.com",
      lastKnownIp: "1.2.3.4",
      lastSeenAt: 123,
      blocked: ["u9"],
      battleTag: "Owner#1234",
      previousUsernames: ["oldname"],
      offerDrafts: [{ title: "secret draft" }],
    },
    { id: "u2", name: "Other", friendRequests: ["u1"], hiddenIdentity: true, subscription: { tier: "gold", secret: "x" } },
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

const PRIVATE_KEYS = [
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
];

describe("publicDataView", () => {
  it("returns exactly the allowlisted keys and nothing else", () => {
    const out = publicDataView(fullStore);
    expect(Object.keys(out).sort()).toEqual([...PUBLIC_DATA_KEYS].sort());
  });

  it("never leaks DMs, tickets, audit logs, roles, bans or friend data", () => {
    const out = publicDataView(fullStore) as Record<string, unknown>;
    for (const secret of PRIVATE_KEYS) expect(out[secret]).toBeUndefined();
  });

  it("strips lobby chat bodies but keeps a message count", () => {
    const out = publicDataView(fullStore) as any;
    expect(out.lobbies[0].messages).toBeUndefined();
    expect(out.lobbies[0].messageCount).toBe(2);
  });

  it("strips per-player identifiers from the public roster", () => {
    const out = publicDataView(fullStore) as any;
    const owner = out.registeredUsers.find((u: any) => u.id === "u1");
    for (const field of [
      "email",
      "lastKnownIp",
      "lastSeenAt",
      "blocked",
      "battleTag",
      "previousUsernames",
      "offerDrafts",
    ]) {
      expect(owner[field]).toBeUndefined();
    }
    const other = out.registeredUsers.find((u: any) => u.id === "u2");
    expect(other.friendRequests).toBeUndefined();
    expect(other.hiddenIdentity).toBeUndefined();
    expect(other.subscription).toEqual({ tier: "gold" });
  });

  it("keeps the display fields the public feed renders", () => {
    const out = publicDataView(fullStore) as any;
    const owner = out.registeredUsers.find((u: any) => u.id === "u1");
    expect(owner.id).toBe("u1");
    expect(owner.name).toBe("Owner");
  });

  it("drops allowlisted keys that are absent instead of inventing them", () => {
    const out = publicDataView({ lobbies: [] }) as Record<string, unknown>;
    expect(out.lobbies).toEqual([]);
    expect("registeredUsers" in out).toBe(false);
  });
});

describe("restrictToPublicKeys", () => {
  it("rejects the `?keys=directMessages` bypass entirely", () => {
    expect(restrictToPublicKeys(["directMessages"])).toEqual([]);
  });

  it("keeps public keys and drops private ones from a mixed request", () => {
    expect(restrictToPublicKeys(["lobbies", "auditLogs", "characters"])).toEqual(["lobbies", "characters"]);
  });

  it("trims whitespace and collapses duplicates", () => {
    expect(restrictToPublicKeys([" lobbies ", "lobbies", "goldOffers"])).toEqual(["lobbies", "goldOffers"]);
  });

  it("cannot be used to reach the admin role map or ban lists", () => {
    for (const key of ["userRoles", "bannedUsers", "bannedIps", "tickets"]) {
      expect(isPublicDataKey(key)).toBe(false);
      expect(restrictToPublicKeys([key])).toEqual([]);
    }
  });
});

describe("sanitizePublicUsers", () => {
  it("leaves non-array input untouched", () => {
    expect(sanitizePublicUsers(undefined)).toBeUndefined();
    expect(sanitizePublicUsers("nope")).toBe("nope");
  });
});
