import { describe, it, expect } from "vitest";
import { validateCharacters } from "@/lib/secureDataWrite";

describe("validateCharacters", () => {
  it("allows linking a game character while legacy numeric-id characters of other users exist", () => {
    const existing = [
      {
        id: 1781116636700,
        name: "Quickbandage",
        userId: "legacy-owner-1",
        class: "Evoker",
      },
      {
        id: 1778934740682,
        name: "Demonjuxx",
        userId: "legacy-owner-2",
        class: "Demon Hunter",
      },
    ];
    const meId = "711027724663128106";
    const newChar = {
      id: "game:XYZ0001",
      userId: meId,
      name: "OmarAion",
      aionClass: "Gladiator",
      gameClassLabel: "검성",
      level: 65,
      itemLevel: 180,
      serverId: 1001,
      serverName: "Siel",
      raceId: 1,
      raceName: "Elyos",
      region: "kr",
    };

    const result = validateCharacters(existing, [...existing, newChar], meId, false);
    expect(result.ok).toBe(true);
  });

  it("still blocks stealing a game character already linked to another account", () => {
    const existing = [{ id: "game:XYZ0001", userId: "other-user", name: "Kara" }];
    const incoming = [
      { id: "game:XYZ0001", userId: "me", name: "Kara" },
    ];
    const result = validateCharacters(existing, incoming, "me", false);
    expect(result.ok).toBe(false);
  });
});