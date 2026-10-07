import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Every offer on the site runs under the Level 45 floor — leveling included.
 * The only per-category difference is the gear requirement: a leveling offer
 * carries none, so any Level 45 character fits there, while dungeon/raid offers
 * can demand a minimum Item Level / Combat Power checked against verified stats.
 *
 * These cases pin that on every door into `lobby.applicants`:
 *
 *  - `POST /api/lobbies/apply` (the web + Discord-handoff flow)
 *  - `applyToLobbyFromDiscord` (the embed's Apply button)
 *
 * and the sync gate that makes it hold everywhere: `GET /api/aion2/resolve` is
 * the only place the site sees NCSoft's real level, so a character below 45 is
 * refused there and never lands signed in anyone's roster.
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
// `trustCharacterStats` stands in for the server signature: it returns the
// numbers as stored on the row. A character whose level is under 45 reads as a
// verified sub-45, which is exactly what the 45 floor exists to stop.
vi.mock("@/lib/characterStatsSig", () => ({
  trustCharacterStats: vi.fn(async (row: any) => ({
    level: Number(row?.level) || 0,
    itemLevel: Number(row?.itemLevel) || 0,
    combatPower: Number(row?.cpAp ?? row?.combatPower) || 0,
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
  name: "Char",
  level: 45,
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
  process.env.NEXTAUTH_SECRET = "test-root-secret-apply-forty-five-gate";
  delete process.env.AUTH_SECRET;
  store.clear();
});

describe("POST /api/lobbies/apply — the 45 floor is on every offer", () => {
  it("refuses a verified sub-45 character on a leveling offer too", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [{ ...applicantChar, level: 30 }],
      lobbies: [lobby({ category: "leveling" })],
    });
    const res = await postApply({ id: "game:char-low", level: 30, className: "gladiator", aionClass: "gladiator", cpAp: 30_000, role: "dps" });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(String(body?.error || "")).toMatch(/Offers require Level 45\+/);
  });

  it("refuses a sub-45 character on a dungeon offer", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [{ ...applicantChar, level: 30 }],
      lobbies: [lobby({ category: "dungeon" })],
    });
    const res = await postApply({ id: "game:char-low", level: 30, className: "gladiator", aionClass: "gladiator", cpAp: 30_000, role: "dps" });
    expect(res.status).toBe(400);
  });

  it("lets a verified Level 45 into a leveling offer no matter what gear numbers are stored on it", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [{ ...applicantChar, level: 45 }],
      lobbies: [lobby({ category: "leveling", minItemLevel: 500, minCombatPower: 99_999 })],
    });
    const res = await postApply({ id: "game:char-low", level: 45, className: "gladiator", aionClass: "gladiator", cpAp: 30_000, role: "dps" });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body?.lobby?.applicants?.[0]?.level).toBe(45);
  });

  it("records the verified level, not the claimed one", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [{ ...applicantChar, level: 45 }],
      lobbies: [lobby({ category: "dungeon" })],
    });
    const res = await postApply({ id: "game:char-low", level: 80, className: "gladiator", aionClass: "gladiator", cpAp: 30_000, role: "dps" });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body?.lobby?.applicants?.[0]?.level).toBe(45);
  });

  it("turns a Level 45 away from a dungeon whose Item Level it does not meet", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [{ ...applicantChar, level: 45, itemLevel: 480 }],
      lobbies: [lobby({ category: "dungeon", minItemLevel: 500 })],
    });
    const res = await postApply({ id: "game:char-low", level: 45, className: "gladiator", aionClass: "gladiator", cpAp: 30_000, role: "dps" });
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(String(body?.error || "")).toMatch(/Item Level 500\+ required/);
  });

  it("lets a Level 45 that meets the dungeon's Item Level through", async () => {
    seedStore({
      registeredUsers: [{ id: OWNER, username: "owner", name: "Owner" }],
      characters: [{ ...applicantChar, level: 45, itemLevel: 500 }],
      lobbies: [lobby({ category: "dungeon", minItemLevel: 500 })],
    });
    const res = await postApply({ id: "game:char-low", level: 45, className: "gladiator", aionClass: "gladiator", cpAp: 30_000, role: "dps" });
    expect(res.status).toBe(200);
  });
});

describe("applyToLobbyFromDiscord (embed Apply button)", () => {
  const discordChar = { ...applicantChar, userId: "disc-1" };

  it("refuses a sub-45 character on a leveling offer", async () => {
    seedStore({
      registeredUsers: [{ id: "disc-1", username: "alice", name: "Alice" }],
      characters: [{ ...discordChar, level: 30 }],
      lobbies: [lobby({ category: "leveling" })],
    });
    const out = await applyToLobbyFromDiscord("disc-1", "lobby-1");
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(String(out.error)).toMatch(/Offers require Level 45\+/);
  });

  it("applies a Level 45 character to a leveling offer, ignoring its stored gear", async () => {
    seedStore({
      registeredUsers: [{ id: "disc-1", username: "alice", name: "Alice" }],
      characters: [{ ...discordChar, level: 45 }],
      lobbies: [lobby({ category: "leveling", minItemLevel: 500, minCombatPower: 99_999 })],
    });
    const out = await applyToLobbyFromDiscord("disc-1", "lobby-1");
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.lobby?.applicants?.[0]?.id).toBe("game:char-low");
  });

  it("still refuses a Level 45 character on a dungeon whose Item Level it does not meet", async () => {
    seedStore({
      registeredUsers: [{ id: "disc-1", username: "alice", name: "Alice" }],
      characters: [{ ...discordChar, level: 45, itemLevel: 480 }],
      lobbies: [lobby({ category: "dungeon", minItemLevel: 500 })],
    });
    const out = await applyToLobbyFromDiscord("disc-1", "lobby-1");
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(String(out.error)).toMatch(/Item Level 500\+ required/);
  });

  it("sends a multi-character pick to the site when several qualify", async () => {
    seedStore({
      registeredUsers: [{ id: "disc-1", username: "alice", name: "Alice" }],
      characters: [
        { ...discordChar, id: "game:char-a", name: "AltOne", level: 60 },
        { ...discordChar, id: "game:char-b", name: "AltTwo", level: 55 },
      ],
      lobbies: [lobby({ category: "dungeon" })],
    });
    const out = await applyToLobbyFromDiscord("disc-1", "lobby-1");
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(String(out.error)).toMatch(/Pick the one you want to bring/);
  });
});

describe("the sync gate that makes the 45 floor hold everywhere", () => {
  const resolveRoute = readFileSync(join(process.cwd(), "src", "app/api/aion2/resolve/route.ts"), "utf8");

  it("refuses to link a character below 45 in the one place the site holds NCSoft's level", () => {
    expect(resolveRoute).toMatch(/belowMaxLevel/);
    expect(resolveRoute).toMatch(/Characters below Level \$\{BOOST_MIN_LEVEL\} can't be linked on UPLINK\./);
    // Both the link (POST) and the re-check (PUT) paths are gated.
    expect(resolveRoute).toMatch(/if \(belowMaxLevel\(character\)\)/);
    expect(resolveRoute).not.toMatch(/isLeveling/);
  });
});