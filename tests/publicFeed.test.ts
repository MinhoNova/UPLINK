import { describe, it, expect } from "vitest";
import { isLobbyListedInPublicFeed, isRemovedDungeonOffer } from "@/lib/lobbyLifecycle";

function lobby(over: any = {}) {
  return {
    id: "l1",
    ownerId: "u1",
    category: "dungeon",
    serviceName: "Transcendence",
    status: "standby",
    ...over,
  };
}

describe("isLobbyListedInPublicFeed", () => {
  it("lists a plain open dungeon offer", () => {
    expect(isLobbyListedInPublicFeed(lobby())).toBe(true);
  });

  it("lists profession offers — cooking and alchemy are creatable", () => {
    expect(isLobbyListedInPublicFeed(lobby({ category: "professions", serviceName: "Cooking" }))).toBe(true);
    expect(isLobbyListedInPublicFeed(lobby({ category: "professions", serviceName: "Alchemy" }))).toBe(true);
  });

  it("lists leveling, raid and both legacy plural spellings", () => {
    expect(isLobbyListedInPublicFeed(lobby({ category: "leveling" }))).toBe(true);
    expect(isLobbyListedInPublicFeed(lobby({ category: "raid" }))).toBe(true);
    expect(isLobbyListedInPublicFeed(lobby({ category: "dungeons" }))).toBe(true);
    expect(isLobbyListedInPublicFeed(lobby({ category: "raids" }))).toBe(true);
  });

  it("hides pvp, which was removed from the site", () => {
    expect(isLobbyListedInPublicFeed(lobby({ category: "pvp" }))).toBe(false);
  });

  it("hides dungeon offers whose service was retired", () => {
    expect(isRemovedDungeonOffer(lobby({ category: "dungeon", serviceName: "Nightmare" }))).toBe(true);
    expect(isLobbyListedInPublicFeed(lobby({ category: "dungeon", serviceName: "Nightmare" }))).toBe(false);
    // kept dungeon services stay
    expect(isLobbyListedInPublicFeed(lobby({ category: "dungeon", serviceName: "Transcendence" }))).toBe(true);
    expect(isLobbyListedInPublicFeed(lobby({ category: "dungeon", serviceName: "Expeditions" }))).toBe(true);
  });

  it("only lists open recruiting offers", () => {
    expect(isLobbyListedInPublicFeed(lobby({ status: "in_progress" }))).toBe(false);
    expect(isLobbyListedInPublicFeed(lobby({ status: "completed" }))).toBe(false);
  });
});
