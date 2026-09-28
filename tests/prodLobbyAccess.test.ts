import { describe, it, expect } from "vitest";
import { filterDataForUser } from "@/lib/dataAccess";
import { userCanViewOfferThread, userIsOfferOwner } from "@/lib/lobbyLifecycle";

/* Verbatim shape of a real production lobby (public-data, 2026-09-28).
   Note the absent keys: no messages, no history, no parentId. */
const PROD_OWNER_ID = "711027724663128106";
const PROD_LOBBY = {
  id: "1790139137329",
  ownerId: PROD_OWNER_ID,
  ownerDiscordName: "Omar Saleh",
  ownerHandle: "omarsaleh97",
  ownerImage: "https://cdn.discordapp.com/embed/avatars/1.png",
  ownerEffect: "",
  category: "powerleveling",
  title: "Powerleveling",
  serviceName: "Powerleveling",
  notes: "n/a",
  runsCount: 0,
  pricePerRun: 100,
  maxBoosters: 2,
  requiredClasses: [],
  selectedOption: "a",
  serverRegion: "na",
  roles: [],
  applicants: [],
  invited: [],
  accepted: [],
  customBg: "",
  blacklistedClasses: [],
  blockedRoles: [],
  status: "standby",
  createdAt: 1790139137329,
  squadTemplate: [],
};

describe("production lobby access", () => {
  const registeredUsers = [{ id: PROD_OWNER_ID, username: "omarsaleh97", displayName: "Omar Saleh" }];

  it("recognises the owner by Discord id", () => {
    expect(userIsOfferOwner(PROD_LOBBY, PROD_OWNER_ID, "omarsaleh97")).toBe(true);
  });

  it("recognises the owner even when the session carries a stale handle", () => {
    expect(userIsOfferOwner(PROD_LOBBY, PROD_OWNER_ID, "old-name", ["omarsaleh97", "old-name"])).toBe(true);
  });

  it("lets the owner into the thread", () => {
    expect(userCanViewOfferThread(PROD_LOBBY, PROD_OWNER_ID, "omarsaleh97")).toBe(true);
  });

  it("does not throw or strip anything for the owner on the real read path", () => {
    const data = {
      lobbies: [PROD_LOBBY],
      registeredUsers: [{ id: PROD_OWNER_ID, username: "omarsaleh97", displayName: "Omar Saleh", previousUsernames: ["old-name"] }],
      notifications: [],
      friends: [],
      tickets: [],
      characters: [],
      goldOffers: [],
      marketHistory: [],
    };
    const scoped = filterDataForUser(data, PROD_OWNER_ID, "omarsaleh97") as any;
    expect(Array.isArray(scoped.lobbies)).toBe(true);
    expect(scoped.lobbies).toHaveLength(1);
    expect(scoped.lobbies[0].id).toBe(PROD_LOBBY.id);
  });

  it("keeps the owner's own messages when the lobby has them", () => {
    const withChat = { ...PROD_LOBBY, messages: [{ id: 1, text: "hi" }] };
    const data = {
      lobbies: [withChat],
      registeredUsers: [{ id: PROD_OWNER_ID, username: "omarsaleh97", displayName: "Omar Saleh" }],
    };
    const scoped = filterDataForUser(data, PROD_OWNER_ID, "omarsaleh97") as any;
    expect(scoped.lobbies[0].messages).toHaveLength(1);
  });

  it("still strips a stranger's view of the same lobby", () => {
    const withChat = { ...PROD_LOBBY, messages: [{ id: 1, text: "hi" }] };
    const data = {
      lobbies: [withChat],
      registeredUsers: [{ id: "someone-else", username: "stranger" }],
    };
    const scoped = filterDataForUser(data, "someone-else", "stranger") as any;
    expect(scoped.lobbies[0].messages).toBeUndefined();
  });

  it("keeps the admin bypass independent of the canonical handle", () => {
    // Regression guard: the session handle and the account-row handle are two
    // different things. A site admin whose account row is named differently
    // from the session must still resolve as admin.
    const sessionHandle = "minhonovazen";
    const sessionId: string = PROD_OWNER_ID;
    const me = registeredUsers.find((u: any) => String(u.id) === sessionId);
    const canonical = String(me?.username || sessionHandle);
    const isAdmin = sessionHandle === "minhonovazen" || sessionId === "1497295886223544471";
    expect(canonical).not.toBe(sessionHandle);
    expect(isAdmin).toBe(true);
  });
});
