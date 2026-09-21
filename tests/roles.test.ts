import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return {
    initTables: vi.fn(),
    getKV: vi.fn(async (key: string) => (key in store ? store[key] : null)),
    setKV: vi.fn(async (key: string, value: unknown) => {
      store[key] = value;
    }),
    __store: store,
  };
});

vi.mock("@/lib/db", () => mocks);

import {
  isLegacyAdmin,
  getUserRole,
  isModeratorOrAbove,
  isAdminRole,
  setUserRole,
  LEGACY_ADMIN_ID,
  LEGACY_ADMIN_HANDLE,
  OMARSALEH_ADMIN_ID,
} from "@/lib/roles";

describe("roles", () => {
  beforeEach(() => {
    for (const key of Object.keys(mocks.__store)) delete mocks.__store[key];
    vi.clearAllMocks();
  });

  describe("isLegacyAdmin", () => {
    it("recognizes the legacy admin user id and handle", () => {
      expect(isLegacyAdmin(LEGACY_ADMIN_ID, "anything")).toBe(true);
      expect(isLegacyAdmin("someone", LEGACY_ADMIN_HANDLE)).toBe(true);
    });

    it("recognizes the second admin id", () => {
      expect(isLegacyAdmin(OMARSALEH_ADMIN_ID, "anything")).toBe(true);
    });

    it("rejects strangers", () => {
      expect(isLegacyAdmin("12345", "stranger")).toBe(false);
      expect(isLegacyAdmin("", "")).toBe(false);
    });
  });

  describe("getUserRole", () => {
    it("returns admin for legacy admins even with empty role store", async () => {
      expect(await getUserRole(LEGACY_ADMIN_ID, "anything")).toBe("admin");
    });

    it("returns admin for any legacy admin id", async () => {
      expect(await getUserRole(OMARSALEH_ADMIN_ID, "anything")).toBe("admin");
    });

    it("returns user for unknown users", async () => {
      expect(await getUserRole("99999", "nobody")).toBe("user");
    });

    it("returns stored roles for regular users", async () => {
      mocks.__store.userRoles = { 111: "moderator" };
      expect(await getUserRole("111", "mod")).toBe("moderator");
    });
  });

  describe("isAdminRole / isModeratorOrAbove", () => {
    it("admins pass both checks", async () => {
      expect(await isAdminRole(LEGACY_ADMIN_ID, "x")).toBe(true);
      expect(await isModeratorOrAbove(LEGACY_ADMIN_ID, "x")).toBe(true);
    });

    it("moderators pass moderator check but not admin check", async () => {
      mocks.__store.userRoles = { 222: "moderator" };
      expect(await isModeratorOrAbove("222", "mod")).toBe(true);
      expect(await isAdminRole("222", "mod")).toBe(false);
    });

    it("support passes moderator check", async () => {
      mocks.__store.userRoles = { 333: "support" };
      expect(await isModeratorOrAbove("333", "sup")).toBe(true);
    });

    it("plain users fail both", async () => {
      expect(await isAdminRole("444", "user")).toBe(false);
      expect(await isModeratorOrAbove("444", "user")).toBe(false);
    });
  });

  describe("setUserRole", () => {
    it("rejects non-admin actors", async () => {
      await expect(setUserRole("444", "user", "555", "moderator")).rejects.toThrow("Admin only");
    });

    it("protects the primary admin from demotion", async () => {
      await expect(
        setUserRole(LEGACY_ADMIN_ID, LEGACY_ADMIN_HANDLE, LEGACY_ADMIN_ID, "moderator")
      ).rejects.toThrow("Cannot demote primary admin");
    });

    it("lets an admin set a moderator and persists it", async () => {
      await setUserRole(LEGACY_ADMIN_ID, LEGACY_ADMIN_HANDLE, "777", "moderator");
      expect(mocks.__store.userRoles).toMatchObject({ 777: "moderator" });
      expect(await getUserRole("777", "mod")).toBe("moderator");
    });
  });
});