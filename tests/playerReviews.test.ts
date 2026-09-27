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
  PLAYER_REVIEW_COOLDOWN_MS,
  findLatestReviewOf,
  reviewCooldownError,
  type PlayerReview,
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
      expect(
        averagePlayerRating([
          { rating: 5 } as any,
          { rating: 4 } as any,
        ])
      ).toBe(4.5);
      expect(averagePlayerRating([])).toBe(0);
    });
  });
});

const A = "111111111111111111";
const B = "222222222222222222";
const C = "333333333333333333";
const HOUR = 60 * 60_000;

function review(over: Partial<PlayerReview> = {}): PlayerReview {
  return {
    id: "prv_1",
    lobbyId: "lobby_1",
    lobbyTitle: "Offer",
    reviewerId: A,
    reviewerName: "A",
    reviewerImage: "",
    targetId: B,
    targetName: "B",
    rating: 5,
    comment: "",
    createdAt: 1_000_000,
    ...over,
  };
}

describe("review cooldown", () => {
  it("lets a first review through", () => {
    expect(reviewCooldownError([], A, B, "lobby_1")).toBeNull();
  });

  it("blocks a second review of the same player in a different lobby", () => {
    const now = 1_000_000 + HOUR;
    const reviews = [review({ lobbyId: "lobby_1", createdAt: 1_000_000 })];
    const err = reviewCooldownError(reviews, A, B, "lobby_2", now);
    expect(err).toBeTruthy();
    expect(err).toContain("23h");
  });

  it("allows it again once 24h have passed", () => {
    const created = 1_000_000;
    const reviews = [review({ lobbyId: "lobby_1", createdAt: created })];
    expect(reviewCooldownError(reviews, A, B, "lobby_2", created + PLAYER_REVIEW_COOLDOWN_MS)).toBeNull();
  });

  it("still blocks one minute short of 24h", () => {
    const created = 1_000_000;
    const reviews = [review({ lobbyId: "lobby_1", createdAt: created })];
    expect(reviewCooldownError(reviews, A, B, "lobby_2", created + PLAYER_REVIEW_COOLDOWN_MS - 60_000)).toBeTruthy();
  });

  it("does not block editing the review you already left for that lobby", () => {
    const reviews = [review({ lobbyId: "lobby_1" })];
    expect(reviewCooldownError(reviews, A, B, "lobby_1", 1_000_000 + HOUR)).toBeNull();
  });

  it("measures the cooldown from the most recent review, not the first", () => {
    const reviews = [
      review({ lobbyId: "lobby_1", createdAt: 1_000_000 }),
      review({ id: "prv_2", lobbyId: "lobby_2", createdAt: 5_000_000 }),
    ];
    // 5_000_000 is the newest, so the window runs from there.
    expect(reviewCooldownError(reviews, A, B, "lobby_3", 5_000_000 + PLAYER_REVIEW_COOLDOWN_MS)).toBeNull();
    expect(reviewCooldownError(reviews, A, B, "lobby_3", 5_000_000 + HOUR)).toBeTruthy();
  });

  it("keeps the cooldown per pair — other players are unaffected", () => {
    const reviews = [review({ lobbyId: "lobby_1", createdAt: 1_000_000 })];
    // A reviewing C, and B reviewing A, both still allowed.
    expect(reviewCooldownError(reviews, A, C, "lobby_9", 1_000_000 + HOUR)).toBeNull();
    expect(reviewCooldownError(reviews, B, A, "lobby_9", 1_000_000 + HOUR)).toBeNull();
  });

  it("leaves no cooldown when the stored clock is ahead of ours", () => {
    const reviews = [review({ lobbyId: "lobby_1", createdAt: 9_000_000 })];
    expect(reviewCooldownError(reviews, A, B, "lobby_2", 1_000_000)).toBeNull();
  });

  it("tolerates a missing or malformed review list", () => {
    expect(reviewCooldownError(null, A, B, "lobby_1")).toBeNull();
    expect(reviewCooldownError(undefined, A, B, "lobby_1")).toBeNull();
    expect(findLatestReviewOf([], A, B)).toBeNull();
  });

  it("ignores entries with no timestamp instead of blocking forever", () => {
    const reviews = [review({ lobbyId: "lobby_1", createdAt: undefined as any })];
    expect(reviewCooldownError(reviews, A, B, "lobby_2", 1_000_000)).toBeNull();
  });
});
