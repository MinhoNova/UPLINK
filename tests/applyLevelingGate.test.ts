import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The Level 45 floor is a *boosting* rule. A leveling offer exists to raise a
 * character that is usually under 45, so the floor would block every buyer it is
 * meant for. These cases pin that exemption on both doors into `lobby.applicants`:
 *
 *  - `POST /api/lobbies/apply` (the web + Discord-handoff flow)
 *  - `applyToLobbyFromDiscord` (the embed's Apply button)
 *
 * For leveling offers both must let a signed sub-45 character through and keep
 * the applicant's own claimed level for the owner to see; dungeon/raid offers
 * keep the floor and the verified level.
 */
const store = vi.hoisted(() => new Map<string, any>());
const { getKVMock, updateKVAtomicMock } = vi.hoisted(() => {
  const getKVMock = vi.fn(async (key: string) => store.get(key) ?? []);
  const updateKVAtomicMock = vi.fn(async (key: string, cb: (cur: any) => any) => {
    const prev = store.get(key) ?? [];
    const next = await cb(prev);
    if (!next) return { ok: false };
    store.set(key, next);
    return { ok: true, value: next };
  });
  return { getKVMock, updateKVAtomicMock };
});

vi.mock("@/lib/db", () => ({
  getKV: getKVMock as any,
  setKV: vi.fn(async () => {}),
  initTables: vi.fn(async () => {}),
  updateKVAtomic: updateKVAtomicMock as any,
}));
vi.mock("@/lib/authz", () => ({
  requireSession: vi.fn(async () => ({
    ok: true,
    status: 200,
    user: { id: "applicant-1", username: "alice", name: "Alice", role: "user" },
  })),
}));
vi.mock("@/lib/banCheck", () => ({ isUserBanned: vi.fn(async () => false) }));
vi.mock("@/lib/offerDailyLimit", () => ({
  checkAndRecordOfferApply: vi.fn(async () => ({ ok: true })),
  checkAndRecordOfferCreate: vi.fn(async () => ({ ok: true })),
  getOfferApplyUsage: vi.fn(async () => 0),
  offerCreateLimitError: vi.fn(() => "Too many offers"),
}));
vi.mock("@/lib/characterStatsSig", () => ({
  trustCharacterStats: vi.fn(async (row: any) => ({
    level: Number(row?.level) || 30,
    itemLevel: Number(row?.itemLevel) || 480,
    combatPower: Number(row?.cpAp ?? row?.combatPower) || 30_000,
  })),
  verifyCharacterStats: vi.fn(async () => ({ ok: true })),
}));

import { POST } from "@/app/api/lobbies/apply/route";
import { applyToLobbyFromDiscord } from "@/lib/lobbyDiscord";

const OWNER = "owner-x";
const applicantChar = {
  id: "game:char-low",
  gameCharacterId: "char-low",
  userId: "applicant-1",
  name: "Lowbie",
  level: 30,
  itemLevel: 480,
  cpAp: 30_000,
  aionClass: "gladiator",
  region: "",
};

function lobby(overrides: Record<string, unknown> = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    status: "standby",
    title: "Offer",
    applicants: [],
    accepted: [],
    history: [],
    startLevel: 1,
    endLevel: 45,
    ...overrides,
  };
}

function seedStore(rows: Record<string, any[]>) {
  for (const [k, v] of Object.entries(rows)) store.set(k, v);
}

async function postApply(applicant: Record<string, unknown>, lobbyId = "lobby-1") {
  const req = new Request("https://aion2lfg.com/api/lobbies/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://aion2lfg.com" },
    body: JSON.stringify({ lobbyId, applicant }),
  });
  return POST(req as any);
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-root-secret-apply-leveling-gate";
  delete process.env.AUTH_SECRET;
  store.clear();
});

describe("POST /api/lobbies/apply", () => {
  it("lets a signed sub-45 character into a leveling offer", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [applicantChar],
      lobbies: [lobby({ category: "leveling", ownerId: OWNER, startLevel: 1, endLevel: 45 })],
    });
    const res = await postApply({
      id: "game:char-low",
      level: 30,
      className: "gladiator",
      aionClass: "gladiator",
      cpAp: 30_000,
      role: "dps",
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    const written = body?.lobby?.applicants?.[0];
    expect(written?.id).toBe("game:char-low");
    // The booster floor is lifted for leveling, so the owner sees the level the
    // applicant brought, not a verified 0 from an unsigned row.
    expect(written?.level).toBe(30);
  });

  it("keeps the floor for dungeon offers, wherever the claimed level came from", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [applicantChar],
      lobbies: [lobby({ category: "dungeon", ownerId: OWNER })],
    });
    const res = await postApply({
      id: "game:char-low",
      level: 80,
      className: "gladiator",
      aionClass: "gladiator",
      cpAp: 30_000,
      role: "dps",
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(String(body?.error || "")).toMatch(/Boosting offers require Level 45\+/);
  });

  it("records the verified level for a boosting offer that passes the floor", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [{ ...applicantChar, level: 45 }],
      lobbies: [lobby({ category: "raid", ownerId: OWNER })],
    });
    const res = await postApply({
      id: "game:char-low",
      level: 80,
      className: "gladiator",
      aionClass: "gladiator",
      cpAp: 30_000,
      role: "dps",
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body?.lobby?.applicants?.[0]?.level).toBe(45);
  });
});

describe("applyToLobbyFromDiscord (embed Apply button)", () => {
  const discordChar = { ...applicantChar, userId: "disc-1" };

  it("applies a sub-45 character to a leveling offer", async () => {
    seedStore({
      registeredUsers: [{ id: "disc-1", username: "alice", name: "Alice" }],
      characters: [discordChar],
      lobbies: [lobby({ category: "leveling", ownerId: OWNER })],
    });
    const out = await applyToLobbyFromDiscord("disc-1", "lobby-1");
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.lobby?.applicants?.[0]?.id).toBe("game:char-low");
  });

  it("still refuses a sub-45 character on a dungeon offer", async () => {
    seedStore({
      registeredUsers: [{ id: "disc-1", username: "alice", name: "Alice" }],
      characters: [discordChar],
      lobbies: [lobby({ category: "dungeon", ownerId: OWNER })],
    });
    const out = await applyToLobbyFromDiscord("disc-1", "lobby-1");
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(String(out.error)).toMatch(/Boosting offers require Level 45\+/);
  });

  it("still sends a one-character pick to the site when several could apply", async () => {
    seedStore({
      registeredUsers: [{ id: "disc-1", username: "alice", name: "Alice" }],
      characters: [
        { ...discordChar, id: "game:char-a", name: "AltOne", level: 60 },
        { ...discordChar, id: "game:char-b", name: "AltTwo", level: 55 },
      ],
      lobbies: [lobby({ category: "dungeon", ownerId: OWNER })],
    });
    const out = await applyToLobbyFromDiscord("disc-1", "lobby-1");
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(String(out.error)).toMatch(/Pick the one you want to bring/);
  });
});