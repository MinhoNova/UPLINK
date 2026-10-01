/**
 * Server-owned proof of who actually joined a mission.
 *
 * `RANK_AWARD_LEDGER_KEY` made an award un-repeatable, but it could not stop
 * the FIRST one going to accounts that were never there. The roster that
 * decides who gets credited is owner-controlled: `lobbyUserCanModify` returns
 * true for the owner, so the same request that flips an offer to completed+paid
 * also supplies `accepted` and `applicants`. Every mark the earlier check looked
 * for — `applicantId`, `invitedAt`, a matching row in `applicants` — is written
 * in that request too. Pasting a stranger's id into `accepted` and stamping
 * `applicantId` on it by hand passed it.
 *
 * So proof cannot live on the lobby. It lives here, in storage the client never
 * writes, and it is only ever added from a fact the server already knows: the
 * caller is the session that acted. Two paths stamp it, and only these two:
 *
 *   - the caller put their own row into `applicants`, from their own session.
 *     That is the apply path: `isSelfApplicantScopedChange` is what allowed the
 *     write, and it requires the row to be keyed to the caller.
 *   - the caller accepted an invite through `POST /api/lobbies/invite-respond`,
 *     a dedicated route that resolves the member from the session and rewrites
 *     the blob atomically. Stamped there, not here.
 *
 * Auto-accept needs no third path. The owner confirms such a member in one
 * write from the client, but the member only becomes eligible for auto-accept
 * by applying first — so their proof was already stamped by the apply.
 *
 * An owner cannot add a proof for anybody else, because the proof is stamped
 * under the caller's own id and only for the caller's own row. The most the
 * owner can reach is inviting a real account and having it accept — a genuine
 * session, and one that only mints rank if the owner then really settles the
 * payout.
 *
 * Proof is read at award time and pruned once the offer is settled, so the
 * ledger stays about the size of the in-flight missions rather than growing for
 * the life of the site.
 */

/** lobbyId -> member ids the server has seen join that offer themselves. */
export const ROSTER_PROOF_KEY = "rankRosterProof";

/**
 * When proof began being recorded. Offers that already existed are settled by
 * the old field-based check so a mission that genuinely ran before this shipped
 * can still be paid; see `proofRequiredFor`.
 */
export const ROSTER_PROOF_CUTOVER_KEY = "rankProofCutover";

/** A member's identity on a roster row, stable across a rename. */
function memberId(m: any): string {
  return String(m?.applicantId || m?.userId || m?.id || "");
}

function rowsById(lobby: any, field: "accepted" | "applicants" | "invited"): string[] {
  const list = Array.isArray(lobby?.[field]) ? (lobby[field] as any[]) : [];
  return list.map(memberId).filter(Boolean);
}

export type RosterProof = Map<string, Set<string>>;

export function rosterProofFrom(raw: any): RosterProof {
  const out: RosterProof = new Map();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [lobbyId, members] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(members)) continue;
    const set = new Set(members.map((v: any) => String(v)).filter(Boolean));
    if (set.size) out.set(String(lobbyId), set);
  }
  return out;
}

export function rosterProofTo(proof: RosterProof): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [lobbyId, members] of proof) out[lobbyId] = Array.from(members);
  return out;
}

/**
 * Stamp proof for the caller's own application, and drop proof for offers that
 * no longer need it. Returns true when the stored ledger has to be rewritten.
 *
 * Only the apply path is recognised here. An invite acceptance never arrives as
 * a data write — it is its own route, which stamps `recordRosterProof` directly
 * because it already holds the atomic blob it rewrote.
 */
export function recordOwnRosterProofs(
  proof: RosterProof,
  existingLobbies: any[],
  incomingLobbies: any[],
  callerId: string
): boolean {
  const uid = String(callerId || "");
  let changed = false;
  if (!uid) return changed;

  const exById = new Map((existingLobbies || []).map((l: any) => [String(l?.id), l]));

  for (const next of incomingLobbies || []) {
    const id = String(next?.id ?? "");
    if (!id) continue;
    const ex = exById.get(id);
    // A brand-new offer has no stored state to act against, and the owner never
    // needs proof — they are credited as the run's own account.
    if (!ex || String(ex.ownerId) === uid) continue;
    if (!rowsById(next, "applicants").includes(uid)) continue;
    if (rowsById(ex, "applicants").includes(uid)) continue;

    if (addRosterProof(proof, id, uid)) changed = true;
  }

  return changed;
}

/**
 * Record one member's own join on one offer. Called from the two places the
 * server itself performed the action: the apply path above, and the invite
 * acceptance route.
 */
export function addRosterProof(proof: RosterProof, lobbyId: string, memberIdToProve: string): boolean {
  const id = String(lobbyId ?? "");
  const uid = String(memberIdToProve || "");
  if (!id || !uid) return false;
  let set = proof.get(id);
  if (set?.has(uid)) return false;
  if (!set) {
    set = new Set();
    proof.set(id, set);
  }
  set.add(uid);
  return true;
}

/**
 * Drop proof for offers that are settled or gone — once the award is in the
 * ledger the proof has done its job, and keeping every historical roster would
 * grow this blob without bound.
 */
export function pruneRosterProof(proof: RosterProof, lobbies: any[]): boolean {
  const live = new Set(
    (lobbies || [])
      .filter((l: any) => l && String(l.payoutStatus) !== "paid")
      .map((l: any) => String(l.id))
  );
  let changed = false;
  for (const lobbyId of Array.from(proof.keys())) {
    if (!live.has(lobbyId)) {
      proof.delete(lobbyId);
      changed = true;
    }
  }
  return changed;
}

/**
 * True when this offer has to be justified by server-stamped proof.
 *
 * Offers created before proof was recorded cannot have any: their members
 * joined through paths that predate the ledger, and refusing to pay them would
 * strand a mission that really ran. `createdAt` is server-owned (clamped back
 * to the stored value on every later write, and stamped at creation), so an
 * owner cannot move a new offer into the legacy window. An offer with no
 * `createdAt` at all predates stamping too, and is treated as legacy.
 */
export function proofRequiredFor(lobby: any, cutover: number): boolean {
  if (!cutover) return false;
  const created = Number(lobby?.createdAt || 0);
  if (!created) return false;
  return created >= cutover;
}

/**
 * The pre-ledger evidence: the marks the apply and invite paths used to leave,
 * still meaningful on an offer that predates proof.
 */
function provedByLegacyMarks(lobby: any, member: any): boolean {
  if (!lobby || !member) return false;
  if (member.applicantId || member.invitedAt) return true;
  const mid = memberId(member);
  if (!mid) return false;
  return rowsById(lobby, "applicants").includes(mid);
}

/**
 * The roster rows that may be credited run rank for this payout: the owner, plus
 * every other party the server can vouch for.
 */
export function creditableRoster(
  lobby: any,
  proof: RosterProof,
  cutover: number,
  fallbackMarks: (lobby: any, member: any) => boolean
): string[] {
  const ownerId = String(lobby?.ownerId || "");
  const rows = Array.isArray(lobby?.accepted) ? (lobby.accepted as any[]) : [];
  const stored = proof.get(String(lobby?.id ?? ""));
  const legacy = !proofRequiredFor(lobby, cutover);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const m of rows) {
    const mid = memberId(m);
    if (!mid || mid === ownerId || seen.has(mid)) continue;
    if (stored?.has(mid)) {
      seen.add(mid);
      out.push(mid);
      continue;
    }
    if (legacy && fallbackMarks(lobby, m)) {
      seen.add(mid);
      out.push(mid);
    }
  }
  return out;
}
