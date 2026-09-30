import { getKV, initTables, updateKVAtomic } from "@/lib/db";
import type { UserRole } from "@/lib/roles";

/**
 * Posting trust gate.
 *
 * A brand-new Discord account can sign in, browse, and apply to offers from the
 * first second — that stays open on purpose, because a stranger who has never
 * posted must still be able to join a party. What it cannot do is *publish* an
 * offer, because offers are what fill the shared `lobbies` blob and what other
 * players send gold to. So posting requires an admin to approve the account
 * once; applying never does.
 */

const REQUESTS_KEY = "offerPostRequests";

export type PosterRequestStatus = "pending" | "approved" | "rejected";

export type PosterRequest = {
  id: string;
  userId: string;
  handle: string;
  discordName?: string;
  note?: string;
  status: PosterRequestStatus;
  createdAt: number;
  decidedAt?: number;
  decidedBy?: string;
};

export type PosterStanding =
  | { allowed: true; reason: "staff" | "approved" | "legacy" }
  | { allowed: false; reason: "not_requested" | "pending" | "rejected" };

function asRequests(raw: unknown): PosterRequest[] {
  return Array.isArray(raw) ? (raw as PosterRequest[]) : [];
}

/**
 * May this account publish an offer?
 *
 * Staff always may. Otherwise an account qualifies if an admin approved it, or
 * if it already owns an offer — that last clause keeps everyone who used the
 * site before the gate shipped working, so launching never locks out the
 * existing user base.
 */
export async function getPosterStanding(
  user: { id?: string; username?: string; posterApprovedAt?: number | null } | null | undefined,
  role: UserRole | undefined,
  ownedLobbyCount?: number
): Promise<PosterStanding> {
  if (role === "admin" || role === "moderator" || role === "support") {
    return { allowed: true, reason: "staff" };
  }
  if (!user?.id) return { allowed: false, reason: "not_requested" };
  if (user.posterApprovedAt && user.posterApprovedAt > 0) return { allowed: true, reason: "approved" };
  if (typeof ownedLobbyCount === "number" && ownedLobbyCount > 0) {
    return { allowed: true, reason: "legacy" };
  }
  return { allowed: false, reason: "not_requested" };
}

/** Count offers this account owns, used for the legacy carve-out. */
export async function countOwnedLobbies(userId: string): Promise<number> {
  await initTables();
  const lobbies: any[] = (await getKV("lobbies")) || [];
  return lobbies.reduce((n, l) => (String(l?.ownerId) === String(userId) ? n + 1 : n), 0);
}

export async function listPosterRequests(status?: PosterRequestStatus): Promise<PosterRequest[]> {
  await initTables();
  const all = asRequests(await getKV(REQUESTS_KEY));
  const filtered = status ? all.filter((r) => r.status === status) : all;
  return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export type RequestResult =
  | { ok: true; status: PosterRequestStatus }
  | { ok: false; error: string; status: number };

/** File (or re-file) a request to be allowed to post. One live request per account. */
export async function submitPosterRequest(input: {
  userId: string;
  handle: string;
  discordName?: string;
  note?: string;
}): Promise<RequestResult> {
  await initTables();
  const uid = String(input.userId);
  const note = String(input.note || "").trim().slice(0, 500);

  const res = await updateKVAtomic<PosterRequest[]>(REQUESTS_KEY, (raw) => {
    const all = asRequests(raw);
    const existingIdx = all.findIndex((r) => String(r.userId) === uid);
    if (existingIdx !== -1 && all[existingIdx].status === "pending") {
      return undefined; // abort: already pending
    }
    const record: PosterRequest = {
      id: existingIdx !== -1 ? all[existingIdx].id : `ppr_${uid}_${Date.now().toString(36)}`,
      userId: uid,
      handle: input.handle,
      discordName: input.discordName,
      note,
      status: "pending",
      createdAt: Date.now(),
    };
    const next = existingIdx === -1 ? [...all, record] : all.map((r, i) => (i === existingIdx ? record : r));
    return next;
  });

  if (!res.ok) {
    return { ok: false, error: "You already have a request under review.", status: 409 };
  }
  return { ok: true, status: "pending" };
}

/** Approve or reject a request. `approved` also stamps the user row. */
export async function decidePosterRequest(input: {
  requestId: string;
  approve: boolean;
  decidedBy: string;
}): Promise<RequestResult> {
  await initTables();
  const status: PosterRequestStatus = input.approve ? "approved" : "rejected";

  const res = await updateKVAtomic<PosterRequest[]>(REQUESTS_KEY, (raw) => {
    const all = asRequests(raw);
    const idx = all.findIndex((r) => String(r.id) === String(input.requestId));
    if (idx === -1) return undefined; // abort: not found
    if (all[idx].status !== "pending") return undefined; // abort: already decided
    return all.map((r, i) =>
      i === idx ? { ...r, status, decidedAt: Date.now(), decidedBy: String(input.decidedBy) } : r
    );
  });

  if (!res.ok) {
    return { ok: false, error: "Request not found or already decided.", status: 404 };
  }

  if (input.approve) {
    const uid = (await listPosterRequests()).find((r) => String(r.id) === String(input.requestId))?.userId;
    if (uid) await setPosterApproval(uid, true);
  }
  return { ok: true, status };
}

/** Stamp (or clear) the standing on the user row. Idempotent. */
export async function setPosterApproval(userId: string, approved: boolean): Promise<void> {
  const uid = String(userId);
  await updateKVAtomic<any[]>("registeredUsers", (raw) => {
    const users = Array.isArray(raw) ? raw : [];
    let touched = false;
    const next = users.map((u) => {
      if (String(u?.id) !== uid) return u;
      touched = true;
      return { ...u, posterApprovedAt: approved ? Date.now() : null };
    });
    if (!touched) return undefined; // abort: user row missing; caller decides what to do
    return next;
  });
}
