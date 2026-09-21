import { describe, it, expect } from "vitest";
import {
  sanitizePlayerReviewText,
  sanitizePlayerRating,
  lobbyParticipantIds,
  lobbyIsReviewable,
  playerCanReviewLobby,
  reviewTargetsOf,
  averagePlayerRating,
  PLAYER_REVIEW_MAX,
} from "@/lib/playerReviews";

const lobby = {
  id: "l1",
  title: "3x Akaron Temple",
  ownerId: "u-owner",
  ownerDiscordName: "Owner",
  status: "completed",
  payoutStatus: "paid",
  accepted: [
    { id: "m1", applicantId: "u-1", applicantName: "One", applicantAvatar: "/a1.png" },
    { id: "m2", applicantId: "u-2", applicantName: "Two" },
  ],
  invited: [{ id: "m3", applicantId: "u-3", applicantName: "Three" }],
};

const completedLobby = lobby;
const failedLobby = { ...lobby, status: "failed" };
const standbyLobby = { ...lobby, status: "standby" };

describe("playerReviews helpers", () => {
  describe("sanitizePlayerReviewText", () => {
    it("strips HTML tags, scheme jumps and control chars", () => {
      const out = sanitizePlayerReviewText('<b onmouseover="alert(1)">hey</b> javascript:alert(1)');
      expect(out).not.toContain("<");
      expect(out).not.toContain(">");
      expect(out).not.toContain("onmouseover");
      expect(out).not.toContain("javascript:");
    });

    it("truncates to the max length", () => {
      const out = sanitizePlayerReviewText("x".repeat(PLAYER_REVIEW_MAX + 50));
      expect(out.length).toBeLessThanOrEqual(PLAYER_REVIEW_MAX);
    });

    it("handles empty and non-string input", () => {
      expect(sanitizePlayerReviewText(null)).toBe("");
      expect(sanitizePlayerReviewText(undefined)).toBe("");
      expect(sanitizePlayerReviewText(42)).toBe("");
    });
  });

  describe("sanitizePlayerRating", () => {
    it("clamps to 1..5", () => {
      expect(sanitizePlayerRating(0)).toBe(1);
      expect(sanitizePlayerRating(-5)).toBe(1);
      expect(sanitizePlayerRating(99)).toBe(5);
      expect(sanitizePlayerRating(3.6)).toBe(4);
      expect(sanitizePlayerRating(3.2)).toBe(3);
    });
  });

  describe("lobbyParticipantIds", () => {
    it("includes owner, accepted and invited members", () => {
      expect(lobbyParticipantIds(lobby)).toEqual(
        expect.arrayContaining(["u-owner", "u-1", "u-2", "u-3"])
      );
      expect(lobbyParticipantIds(lobby)).toHaveLength(4);
    });
  });

  describe("reviewability", () => {
    it("only completed/failed lobbies are reviewable", () => {
      expect(lobbyIsReviewable(completedLobby)).toBe(true);
      expect(lobbyIsReviewable(failedLobby)).toBe(true);
      expect(lobbyIsReviewable(standbyLobby)).toBe(false);
    });

    it("participants can review, outsiders cannot", () => {
      expect(playerCanReviewLobby(completedLobby, "u-1")).toBe(true);
      expect(playerCanReviewLobby(completedLobby, "u-owner")).toBe(true);
      expect(playerCanReviewLobby(standbyLobby, "u-1")).toBe(false);
      expect(playerCanReviewLobby(completedLobby, "u-stranger")).toBe(false);
    });
  });

  describe("reviewTargetsOf", () => {
    it("excludes the reviewer and includes everyone else", () => {
      const targets = reviewTargetsOf(completedLobby, "u-1");
      const ids = targets.map((t) => t.id);
      expect(ids).not.toContain("u-1");
      expect(ids).toContain("u-owner");
      expect(ids).toContain("u-2");
      expect(ids).toContain("u-3");
      const owner = targets.find((t) => t.id === "u-owner");
      expect(owner?.name).toBe("Owner");
    });
  });

  describe("averagePlayerRating", () => {
    it("averages ratings", () => {
      expect(averagePlayerRating([
        { rating: 5 } as any,
        { rating: 4 } as any,
      ])).toBe(4.5);
      expect(averagePlayerRating([])).toBe(0);
    });
  });
});