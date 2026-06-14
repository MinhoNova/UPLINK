/** Lobby status / foot-complete helpers — shared between ManageModal and page data load. */

export function getCompletedRunsCount(lobby: any): number {
  const cr = lobby?.completedRuns;
  if (Array.isArray(cr)) return cr.length;
  if (typeof cr === "number" && !Number.isNaN(cr)) return cr;
  return 0;
}

export function hasDungeonActivity(lobby: any): boolean {
  if (!lobby) return false;
  if ((lobby.detectedRuns || []).length > 0) return true;
  if (getCompletedRunsCount(lobby) > 0) return true;
  if (lobby.missionStartTime) return true;
  if ((lobby.votes || []).length > 0) return true;
  if ((lobby.history || []).some((h: any) => (h.runsAtExit || 0) > 0)) return true;
  return false;
}

/** Offer owner may cancel only a fresh standby lobby with no squad or mission activity. */
export function canOwnerCancelLobby(lobby: any): boolean {
  if (!lobby) return false;
  const status = lobby.status || "standby";
  if (status !== "standby") return false;
  if (hasDungeonActivity(lobby)) return false;
  if ((lobby.accepted || []).length > 0) return false;
  if (squadRolesFilled(lobby.roles || {})) return false;
  return true;
}

export function clearLobbyDungeonData(lobby: any): any {
  return {
    ...lobby,
    detectedRuns: [],
    completedRuns: [],
  };
}

/** Fix embarked+cancelled conflicts and normalize dungeon sync fields. */
export function sanitizeLobby(lobby: any): any {
  const hadCompletedWork =
    (lobby.detectedRuns || []).length > 0 ||
    getCompletedRunsCount(lobby) > 0 ||
    !!lobby.missionStartTime ||
    (lobby.votes || []).length > 0 ||
    (lobby.history || []).some((h: any) => (h.runsAtExit || 0) > 0);

  let next = clearLobbyDungeonData(lobby);

  if (next.status === "cancelled" && hadCompletedWork) {
    next = {
      ...next,
      status: "unpaid",
      payoutStatus: lobby.paymentProof ? lobby.payoutStatus : undefined,
    };
  }

  if (
    next.status === "completed" &&
    next.payoutStatus === "paid" &&
    !lobby.paymentProof &&
    (lobby.votes || []).length > 0
  ) {
    next = { ...next, status: "unpaid", payoutStatus: undefined };
  }

  return next;
}

export const LOBBY_DATA_VERSION = 2;

/** Remove a user from every lobby's open applications (not confirmed squads) except one lobby.
 *  When joining a leveling offer, other leveling lobbies are left untouched (multi-buyer flow). */
export function withdrawUserFromAllLobbies(
  lobbies: any[],
  userId: string,
  exceptLobbyId?: string,
  joiningLobby?: any
) {
  const uid = String(userId);
  const joiningIsLeveling = joiningLobby ? isLevelingOffer(joiningLobby) : false;
  return lobbies.map((l) => {
    if (exceptLobbyId && String(l.id) === String(exceptLobbyId)) return l;
    if (joiningIsLeveling && isLevelingOffer(l)) return l;

    const hasApp = (l.applicants || []).some((a: any) => memberIdentityKey(a) === uid);
    const pendingInvite = (l.accepted || []).find(
      (a: any) => memberIdentityKey(a) === uid && a.status === "invited"
    );
    const hasLegacyInv = (l.invited || []).some((a: any) => memberIdentityKey(a) === uid);

    if (!hasApp && !pendingInvite && !hasLegacyInv) return l;

    let next = {
      ...l,
      applicants: (l.applicants || []).filter((a: any) => memberIdentityKey(a) !== uid),
      invited: (l.invited || []).filter((a: any) => memberIdentityKey(a) !== uid),
    };
    if (pendingInvite) next = cancelLobbyInvite(next, pendingInvite);
    return next;
  });
}

/** User participated in this offer thread (squad, exit history, or owner). */
export function userWasInOfferThread(lobby: any, userId: string): boolean {
  const uid = String(userId);
  if (!lobby) return false;
  if (String(lobby.ownerId) === uid) return true;
  if ((lobby.accepted || []).some((a: any) => memberIdentityKey(a) === uid)) return true;
  if (
    (lobby.history || []).some(
      (h: any) =>
        memberIdentityKey(h) === uid &&
        (h.reason === "failed" || Number(h.runsAtExit) > 0)
    )
  ) {
    return true;
  }
  return false;
}

/** Foot archive after leave/kick with runs — unpaid ledger only, not an active mission thread. */
export function isEmbeddedFootArchive(lobby: any): boolean {
  return lobby?.embeddedFoot === true;
}

/** Display / action status — embedded foot is always unpaid regardless of stale status field. */
export function getEffectiveOfferStatus(lobby: any): string {
  if (!lobby) return "standby";
  if (isEmbeddedFootArchive(lobby)) return "unpaid";
  return lobby.status || "standby";
}

/** Player is in an active dungeon/M+ squad slot — one dungeon run at a time. */
export function userIsActiveInDungeonOffer(lobbies: any[], userId: string): boolean {
  const uid = String(userId);
  return (lobbies || []).some((l) => {
    if (isLevelingOffer(l)) return false;
    if (String(l.ownerId) === uid) return false;
    const status = l.status || "standby";
    if (!["standby", "in_progress"].includes(status)) return false;
    return (l.accepted || []).some((a: any) => {
      if (memberIdentityKey(a) !== uid) return false;
      const slotStatus = a.status;
      return !slotStatus || slotStatus === "confirmed" || slotStatus === "invited";
    });
  });
}

/** Player is in an active squad slot (confirmed or pending invite) — locks auto-apply / auto-accept for dungeon runs. */
export function userIsActiveInOffer(lobbies: any[], userId: string): boolean {
  return userIsActiveInDungeonOffer(lobbies, userId);
}

/** Joined player Ongoing sidebar — active squad or unpaid foot only (not leave 0 runs). */
export function userHasJoinedOngoingMission(lobby: any, userId: string, allLobbies: any[] = []): boolean {
  const uid = String(userId);
  if (!lobby || String(lobby.ownerId) === uid) return false;

  if (isEmbeddedFootArchive(lobby)) {
    return (lobby.history || []).some(
      (h: any) => memberMatchesUser(h, uid) && Number(h.runsAtExit) > 0
    );
  }

  if ((lobby.accepted || []).some((a: any) => memberMatchesUser(a, uid))) return true;

  if (lobby.status === "unpaid" && !lobby.parentId) {
    if (isLevelingOffer(lobby)) return true;
    const hasFoot = (lobby.history || []).some(
      (h: any) => memberIdentityKey(h) === uid && Number(h.runsAtExit) > 0
    );
    if (!hasFoot) return false;
    const onActiveChild = allLobbies.some(
      (c) =>
        String(c.parentId) === String(lobby.id) &&
        c.resurrected &&
        !["unpaid", "cancelled", "completed", "failed"].includes(c.status || "") &&
        (c.accepted || []).some((a: any) => memberIdentityKey(a) === uid)
    );
    return !onActiveChild;
  }

  return false;
}

/** Root offer id (walk parentId chain). */
export function getThreadRootId(lobby: any, allLobbies: any[]): string {
  let current: any = lobby;
  const seen = new Set<string>();
  while (current?.parentId) {
    const id = String(current.id || "");
    if (id && seen.has(id)) break;
    if (id) seen.add(id);
    const parent = allLobbies.find((l) => String(l.id) === String(current.parentId));
    if (!parent) break;
    current = parent;
  }
  return String(current?.id || lobby?.id || "");
}

/** All split threads belonging to the same original offer. */
export function getOfferThreadFamily(lobby: any, allLobbies: any[]): any[] {
  if (!lobby) return [];
  const rootId = getThreadRootId(lobby, allLobbies);
  return allLobbies.filter((l) => getThreadRootId(l, allLobbies) === rootId);
}

/** Unified chat — merge messages from every thread in the same offer family. */
export function getOfferFamilyMessages(lobby: any, allLobbies: any[]): any[] {
  if (!lobby) return [];
  const seen = new Set<string>();
  const merged: any[] = [];
  for (const thread of getOfferThreadFamily(lobby, allLobbies)) {
    for (const msg of thread.messages || []) {
      const key = String(msg.id ?? `${msg.time}-${msg.from}-${msg.text}`);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(msg);
    }
  }
  return merged.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
}

/** Append one chat message to every thread in the offer family. */
export function appendOfferFamilyMessage(allLobbies: any[], lobby: any, msg: any): any[] {
  if (!lobby || !msg) return allLobbies;
  const rootId = getThreadRootId(lobby, allLobbies);
  return allLobbies.map((l) => {
    if (getThreadRootId(l, allLobbies) !== rootId) return l;
    const msgs = l.messages || [];
    if (msgs.some((m: any) => String(m.id) === String(msg.id))) return l;
    return { ...l, messages: [...msgs, msg] };
  });
}

/** User was on this specific thread (not siblings in the chain). */
export function userParticipatedInThread(lobby: any, userId: string): boolean {
  const uid = String(userId);
  if (!lobby || !uid || uid === "guest") return false;
  if ((lobby.accepted || []).some((a: any) => memberMatchesUser(a, uid))) return true;
  return (lobby.history || []).some(
    (h: any) =>
      memberMatchesUser(h, uid) &&
      (h.reason === "failed" || Number(h.runsAtExit) > 0)
  );
}

/** May open this thread — owner sees full family; players only threads they were on. */
export function userCanViewOfferThread(lobby: any, userId: string, handle?: string): boolean {
  if (!lobby) return false;
  if (userIsOfferOwner(lobby, userId, handle)) return true;
  return userParticipatedInThread(lobby, userId);
}

/** Prefer the clicked thread when viewable; otherwise best active thread in the offer family. */
export function resolveOpenMissionThreadTarget(
  seed: any,
  userId: string,
  allLobbies: any[],
  handle?: string
): any | null {
  if (!seed || !userId) return null;
  if (userCanViewOfferThread(seed, userId, handle)) return seed;

  const viewable = getViewableOfferThreads(seed, userId, allLobbies);
  return (
    viewable.find((t) => t.status === "in_progress") ||
    viewable.find((t) => (t.status || "standby") === "standby") ||
    viewable[0] ||
    null
  );
}

const ACTIVE_ONGOING_STATUSES = new Set(["standby", "in_progress", "unpaid", "payment_pending", ""]);

/** Active / unpaid threads sort: in-progress & standby first, unpaid archives below, newer first within tier. */
export function sortOfferThreadsForDisplay(threads: any[]): any[] {
  const tier = (l: any) => {
    const s = l?.status || "standby";
    if (s === "in_progress") return 0;
    if (s === "standby") return 1;
    if (s === "payment_pending") return 2;
    if (s === "unpaid") return 3;
    if (s === "failed") return 4;
    if (s === "completed") return 5;
    return 6;
  };
  return [...threads].sort((a, b) => {
    const ta = tier(a);
    const tb = tier(b);
    if (ta !== tb) return ta - tb;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

/** Child thread whose parent is an embedded foot ledger after leave/kick. */
export function hasEmbeddedFootParent(lobby: any, allLobbies: any[]): boolean {
  if (!lobby?.parentId) return false;
  const parent = (allLobbies || []).find((l) => String(l.id) === String(lobby.parentId));
  return isEmbeddedFootArchive(parent);
}

/** Leveling offers use a single-thread unpaid flow (not dungeon foot split). */
export function isLevelingOffer(lobby: any): boolean {
  return lobby?.category === "leveling";
}

/** Owner ongoing sidebar — all active split threads, newest active above unpaid archives. */
export function getOwnerOngoingMissions(lobbies: any[], ownerId: string): any[] {
  const uid = String(ownerId);
  return sortOfferThreadsForDisplay(
    (lobbies || []).filter((l) => {
      if (String(l.ownerId) !== uid) return false;
      const status = l.status || "standby";
      if (!ACTIVE_ONGOING_STATUSES.has(status)) return false;
      return status !== "completed" && status !== "failed" && status !== "cancelled";
    })
  );
}

/** Joined player ongoing sidebar — only threads they actually participated in. */
export function getJoinedOngoingMissions(lobbies: any[], userId: string): any[] {
  const uid = String(userId);
  return sortOfferThreadsForDisplay(
    (lobbies || []).filter((l) => {
      const status = l.status || "standby";
      if (!ACTIVE_ONGOING_STATUSES.has(status)) return false;
      if (status === "completed" || status === "failed" || status === "cancelled") return false;
      if (String(l.ownerId) === uid) return false;
      if (!userCanViewOfferThread(l, uid)) return false;
      return userHasJoinedOngoingMission(l, uid, lobbies);
    })
  );
}

/** Threads the user may switch to (for Commander select menu). */
export function getViewableOfferThreads(currentLobby: any, userId: string, allLobbies: any[]): any[] {
  if (!currentLobby || !userId || !Array.isArray(allLobbies)) return [];
  try {
    const family = getOfferThreadFamily(currentLobby, allLobbies);
    return sortOfferThreadsForDisplay(
      family.filter((thread) => userCanViewOfferThread(thread, userId))
    );
  } catch {
    return currentLobby ? [currentLobby] : [];
  }
}

/** Roster for party slots — archived threads include history (leave/kick with runs, failed). */
export function getThreadRosterForDisplay(lobby: any): any[] {
  const accepted = dedupeAccepted(lobby?.accepted || []);
  const status = lobby?.status || "standby";
  const hasFootHistory = (lobby?.history || []).some((h: any) => Number(h.runsAtExit) > 0);
  if (
    !["unpaid", "failed"].includes(status) &&
    !(status === "completed" && hasFootHistory)
  ) {
    return accepted;
  }

  const keys = new Set(accepted.map((a) => memberIdentityKey(a)).filter(Boolean));
  const fromHistory = (lobby.history || [])
    .filter((h: any) => {
      const key = memberIdentityKey(h);
      if (!key || keys.has(key)) return false;
      if (h.reason === "failed") return true;
      return Number(h.runsAtExit) > 0;
    })
    .map((h: any) => ({ ...h, status: h.status || "confirmed" }));

  return [...accepted, ...fromHistory];
}

export function getOfferThreadStatusMeta(status: string, thread?: any): {
  label: string;
  color: string;
  bg: string;
  glow: string;
} {
  if (thread && isEmbeddedFootArchive(thread)) {
    return { label: "UNPAID", color: "#eab308", bg: "rgba(234,179,8,0.12)", glow: "rgba(234,179,8,0.35)" };
  }
  switch (status) {
    case "unpaid":
      return { label: "UNPAID", color: "#eab308", bg: "rgba(234,179,8,0.12)", glow: "rgba(234,179,8,0.35)" };
    case "in_progress":
      return { label: "ACTIVE", color: "#22c55e", bg: "rgba(34,197,94,0.12)", glow: "rgba(34,197,94,0.35)" };
    case "failed":
      return { label: "FAILED", color: "#ef4444", bg: "rgba(239,68,68,0.12)", glow: "rgba(239,68,68,0.35)" };
    case "completed":
      return { label: "DONE", color: "#22c55e", bg: "rgba(34,197,94,0.12)", glow: "rgba(34,197,94,0.35)" };
    case "cancelled":
      return { label: "CANCELLED", color: "#6b7280", bg: "rgba(107,114,128,0.12)", glow: "rgba(107,114,128,0.25)" };
    case "payment_pending":
      return { label: "PENDING", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", glow: "rgba(245,158,11,0.35)" };
    default:
      return { label: "STANDBY", color: "#ff007f", bg: "rgba(255,0,127,0.12)", glow: "rgba(255,0,127,0.35)" };
  }
}

export function formatOfferThreadLabel(lobby: any, index: number): string {
  const runs = lobby.runsCount || 1;
  const gold = lobby.goldPerRun || 0;
  const status = lobby.status || "standby";
  const badge = getOfferThreadStatusMeta(status).label;
  return `Thread ${index + 1} · ${runs}x ${gold}K · ${badge}`;
}

/** @deprecated use userCanViewOfferThread */
export function userCanViewParentThread(parent: any, userId: string): boolean {
  return userCanViewOfferThread(parent, userId);
}

/** May open resurrected child — only if user was on that child (not merely on parent). */
export function userCanViewChildThread(child: any, _parent: any, userId: string): boolean {
  return userCanViewOfferThread(child, userId);
}

/** Resurrected standby repost — hide from owner ongoing only (lives in lobby grid). */
export function isOwnerLobbyGridRepost(lobby: any, ownerId: string): boolean {
  return isLobbyGridRepost(lobby) && String(lobby?.ownerId) === String(ownerId);
}

/** True if user was kicked/left this offer thread (checks parent chain history). */
export function userExitBlockedFromLobby(lobby: any, allLobbies: any[], userId: string): boolean {
  const uid = String(userId);
  const checkHistory = (l: any) =>
    (l?.history || []).some(
      (h: any) => memberIdentityKey(h) === uid && (h.reason === "kicked" || h.reason === "left" || h.reason === "failed")
    );

  let current: any = lobby;
  const seen = new Set<string>();
  while (current) {
    const id = String(current.id || "");
    if (id && seen.has(id)) break;
    if (id) seen.add(id);
    if (checkHistory(current)) return true;
    if (!current.parentId) break;
    current = allLobbies.find((l) => String(l.id) === String(current.parentId));
  }
  return false;
}

/** Confirm join on one lobby and withdraw the same user from other open applications (dungeon-only mutual exclusion). */
export function acceptApplicantAcrossLobbies(lobbies: any[], lobbyId: string, applicant: any): any[] {
  const key = memberIdentityKey(applicant);
  if (!key) return lobbies;
  const joiningLobby = lobbies.find((l) => String(l.id) === String(lobbyId));
  return withdrawUserFromAllLobbies(
    lobbies.map((l) =>
      String(l.id) === String(lobbyId) ? confirmApplicantJoin(l, applicant) : l
    ),
    key,
    lobbyId,
    joiningLobby
  );
}

export function acceptApplicantIntoLobby(lobby: any, applicant: any, enrichedApplicant?: any) {
  const app = enrichedApplicant || applicant;
  const applicantRole = (app.role || "dps").toLowerCase();
  const newRoles = { ...(lobby.roles || {}) };
  if (newRoles[applicantRole] > 0) newRoles[applicantRole] -= 1;
  const remainingRolesSum = Object.values(newRoles).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
  const applicantUserId = String(applicant.applicantId || "");
  const charId = String(applicant.id || "");
  return {
    ...lobby,
    roles: newRoles,
    accepted: [...(lobby.accepted || []), { ...app, status: "confirmed" }],
    applicants: (lobby.applicants || []).filter(
      (a: any) =>
        (applicantUserId ? String(a.applicantId) !== applicantUserId : true) &&
        (charId ? String(a.id) !== charId : true)
    ),
    status: remainingRolesSum === 0 ? "in_progress" : (lobby.status || "standby"),
    ...(remainingRolesSum === 0 && !lobby.missionStartTime ? { missionStartTime: Date.now() } : {}),
  };
}

function acceptedMemberPriority(member: any): number {
  const status = member?.status;
  if (status === "confirmed") return 3;
  if (status === "invited" || member?.invitedAt) return 2;
  return 1;
}

/** Merge accepted members; prefer confirmed over pending invites when the same player appears on both sides. */
export function mergeAcceptedList(serverAccepted: any[] = [], localAccepted: any[] = []): any[] {
  const map = new Map<string, any>();
  const merge = (member: any) => {
    const key = memberIdentityKey(member);
    if (!key) return;
    const existing = map.get(key);
    if (
      !existing ||
      acceptedMemberPriority(member) >= acceptedMemberPriority(existing)
    ) {
      map.set(key, member);
    }
  };
  for (const a of serverAccepted) merge(a);
  for (const a of localAccepted) merge(a);
  return Array.from(map.values());
}

function isSplitArchiveAhead(localLobby: any, serverLobby: any): boolean {
  const localStatus = localLobby?.status || "standby";
  const serverStatus = serverLobby?.status || "standby";
  if (localStatus === "unpaid" && serverStatus === "in_progress") return true;
  if (localStatus === "unpaid" && serverStatus !== "unpaid") return true;
  return false;
}

/** Resurrected child thread after foot-leave / kick (lives in lobby grid when standby). */
export function findResurrectedChildForParent(
  parentId: string,
  lobbies: any[],
  userId?: string
): any | null {
  const pid = String(parentId);
  const uid = userId ? String(userId) : "";
  return (
    lobbies.find(
      (l) =>
        String(l.parentId) === pid &&
        l.resurrected &&
        !["unpaid", "completed", "cancelled", "failed"].includes(l.status || "") &&
        (!uid ||
          String(l.ownerId) === uid ||
          (l.accepted || []).some((a: any) => memberIdentityKey(a) === uid))
    ) || null
  );
}

export function isLobbyGridRepost(lobby: any): boolean {
  const status = lobby?.status || "standby";
  return !!(lobby?.resurrected && (status === "standby" || !lobby.status));
}

/**
 * Owner-side poll merge: keep in-flight saves, show all pending applicants,
 * and preserve local accepts until the server catches up.
 */
export function mergeOwnerLobbyFromServer(
  serverLobby: any,
  localLobby: any | undefined,
  saveInFlight: boolean,
  allLocalLobbies: any[] = []
): any {
  if (!localLobby) return serverLobby;
  if (saveInFlight) return localLobby;

  const localAcceptedLen = (localLobby.accepted || []).length;
  const serverAcceptedLen = (serverLobby.accepted || []).length;
  const localHasMoreAccepted = localAcceptedLen > serverAcceptedLen;

  let mergedAccepted = localHasMoreAccepted
    ? dedupeAccepted(localLobby.accepted || [])
    : mergeAcceptedList(serverLobby.accepted || [], localLobby.accepted || []);

  // Drop stale local-only invites when server no longer has them (player declined).
  if (!saveInFlight) {
    const serverKeys = new Set(
      (serverLobby.accepted || []).map((a: any) => memberIdentityKey(a)).filter(Boolean)
    );
    mergedAccepted = mergedAccepted.filter((a: any) => {
      const isPendingInvite = a.status === "invited" || a.invitedAt;
      if (!isPendingInvite) return true;
      const key = memberIdentityKey(a);
      return key && serverKeys.has(key);
    });
    if (mergedAccepted.length !== (localHasMoreAccepted ? localAcceptedLen : mergedAccepted.length)) {
      mergedAccepted = mergeAcceptedList(serverLobby.accepted || [], mergedAccepted);
    }
  }
  const acceptedIds = new Set(
    mergedAccepted.map((a) => memberIdentityKey(a)).filter(Boolean)
  );

  const applicantPool = localHasMoreAccepted
    ? localLobby.applicants || []
    : mergeApplicantsList(serverLobby.applicants || [], localLobby.applicants || []);
  const applicants = applicantPool.filter(
    (a: any) => !acceptedIds.has(memberIdentityKey(a))
  );

  const hasResurrectedChild = allLocalLobbies.some(
    (l) => String(l.parentId) === String(serverLobby.id) && l.resurrected
  );
  const preferLocalSnapshot =
    saveInFlight ||
    isSplitArchiveAhead(localLobby, serverLobby) ||
    (hasResurrectedChild && localLobby.status === "unpaid");

  const useLocalRoles =
    preferLocalSnapshot ||
    (localLobby.accepted || []).length > (serverLobby.accepted || []).length
      ? localLobby.roles
      : serverLobby.roles;

  const useLocalStatus =
    preferLocalSnapshot ||
    (localLobby.accepted || []).length > (serverLobby.accepted || []).length
      ? localLobby.status
      : serverLobby.status;

  const base = preferLocalSnapshot ? localLobby : serverLobby;

  return {
    ...base,
    applicants,
    accepted: mergedAccepted,
    roles: useLocalRoles ?? serverLobby.roles,
    status: useLocalStatus ?? serverLobby.status,
    missionStartTime: preferLocalSnapshot
      ? localLobby.missionStartTime
      : localLobby.missionStartTime || serverLobby.missionStartTime,
  };
}

/** Squad member poll merge — keep local accepted / in-progress until server catches up. */
export function mergeParticipantLobbyFromServer(
  serverLobby: any,
  localLobby: any | undefined,
  saveInFlight: boolean
): any {
  if (!localLobby) return serverLobby;
  if (saveInFlight) return localLobby;

  const mergedAccepted = mergeAcceptedList(serverLobby.accepted || [], localLobby.accepted || []);
  const statusRank = (s: string) => {
    if (s === "in_progress") return 4;
    if (s === "standby") return 3;
    if (s === "payment_pending") return 2;
    if (s === "unpaid") return 1;
    return 0;
  };
  const localStatus = localLobby.status || "standby";
  const serverStatus = serverLobby.status || "standby";
  const preferLocalSnapshot =
    saveInFlight ||
    isSplitArchiveAhead(localLobby, serverLobby) ||
    statusRank(localStatus) > statusRank(serverStatus) ||
    mergedAccepted.length > (serverLobby.accepted || []).length;

  const base = preferLocalSnapshot ? localLobby : serverLobby;
  return {
    ...base,
    accepted: mergedAccepted,
    roles: preferLocalSnapshot ? localLobby.roles : (serverLobby.roles ?? localLobby.roles),
    status: preferLocalSnapshot ? localStatus : serverStatus,
    missionStartTime: localLobby.missionStartTime || serverLobby.missionStartTime,
  };
}

/** Merge polled server lobbies with local optimistic / in-flight state. */
export function mergeLobbiesFromServer(
  serverLobbies: any[],
  localLobbies: any[],
  currentUserId: string,
  saveInFlight = false
): any[] {
  const localById = new Map(localLobbies.map((l) => [String(l.id), l]));
  const uid = String(currentUserId);

  const merged = serverLobbies.map((serverLobby) => {
    const localLobby = localById.get(String(serverLobby.id));
    if (!localLobby) return serverLobby;

    if (String(serverLobby.ownerId) === uid) {
      return mergeOwnerLobbyFromServer(serverLobby, localLobby, saveInFlight, localLobbies);
    }

    if (
      userIsLobbyParticipant(serverLobby, uid) ||
      (localLobby && userIsLobbyParticipant(localLobby, uid))
    ) {
      return mergeParticipantLobbyFromServer(serverLobby, localLobby, saveInFlight);
    }

    const localHasApp = (localLobby.applicants || []).some(
      (a: any) => String(a.applicantId || a.userId || a.id) === uid
    );
    const serverHasApp = (serverLobby.applicants || []).some(
      (a: any) => String(a.applicantId || a.userId || a.id) === uid
    );

    if (localHasApp && !serverHasApp) {
      return {
        ...serverLobby,
        applicants: mergeApplicantsList(serverLobby.applicants || [], localLobby.applicants || []),
      };
    }

    return serverLobby;
  });

  const serverIds = new Set(serverLobbies.map((l) => String(l.id)));
  const localOnly = localLobbies.filter((local) => {
    if (serverIds.has(String(local.id))) return false;
    if (local.resurrected || local.parentId) return true;
    return String(local.ownerId) === uid;
  });

  return [...merged, ...localOnly];
}

/** Merge applicant lists by applicantId / char id (union; server wins on conflict). */
export function mergeApplicantsList(serverApps: any[] = [], localApps: any[] = []): any[] {
  const map = new Map<string, any>();
  for (const a of localApps) {
    const key = String(a.applicantId || a.userId || a.id || "");
    if (!key) continue;
    map.set(key, a);
  }
  for (const a of serverApps) {
    const key = String(a.applicantId || a.userId || a.id || "");
    if (!key) continue;
    map.set(key, a);
  }
  return Array.from(map.values());
}

/** Fingerprint pending applicants for live Manage modal sync. */
export function applicantsLiveSnapshot(applicants: any[] = []): string {
  return applicants
    .map((a) => {
      const id = memberIdentityKey(a);
      const note = String(a.applicantNote ?? a.note ?? "");
      return [
        id,
        a.id,
        a.role,
        a.class,
        a.score,
        a.ilvl,
        a.keystone,
        a.applicantKeyLevel ?? a.keyLevel ?? "",
        a.applicantDropLevel ?? a.dropLevel ?? "",
        note,
      ].join(":");
    })
    .sort()
    .join("|");
}

export function deductRunsFromDungeons(
  selectedDungeons: Record<string, number> | undefined,
  runsCount: number,
  deduct: number
) {
  const src = { ...(selectedDungeons || {}) };
  const totalFromDungeons = Object.values(src).reduce((s, v) => s + (Number(v) || 0), 0);
  const total = totalFromDungeons > 0 ? totalFromDungeons : runsCount;
  let left = Math.min(deduct, total);
  const completedPart: Record<string, number> = {};
  const remainingPart: Record<string, number> = { ...src };

  if (totalFromDungeons > 0) {
    for (const key of Object.keys(src)) {
      while ((remainingPart[key] || 0) > 0 && left > 0) {
        remainingPart[key]--;
        completedPart[key] = (completedPart[key] || 0) + 1;
        left--;
      }
      if (!remainingPart[key]) delete remainingPart[key];
    }
  }

  const completedCount = deduct - left;
  const remainingCount = Math.max(0, total - completedCount);
  return { completedPart, remainingPart, remainingCount, completedCount };
}

export function memberIdentityKey(member: any): string {
  return String(member?.applicantId ?? member?.userId ?? member?.id ?? "");
}

/** Match squad member to session user id (handles legacy id / userId / applicantId fields). */
export function memberMatchesUser(member: any, userId: string): boolean {
  const uid = String(userId || "");
  if (!uid || uid === "guest") return false;
  const key = memberIdentityKey(member);
  if (key === uid) return true;
  if (member?.userId != null && String(member.userId) === uid) return true;
  if (member?.applicantId != null && String(member.applicantId) === uid) return true;
  return false;
}

export function userIsOfferOwner(lobby: any, userId: string, handle?: string): boolean {
  if (!lobby || !userId) return false;
  if (String(lobby.ownerId) === String(userId)) return true;
  if (handle && lobby.ownerDiscordName) {
    return String(lobby.ownerDiscordName).toLowerCase() === String(handle).toLowerCase();
  }
  return false;
}

export function userIsLobbyParticipant(lobby: any, userId: string, handle?: string): boolean {
  if (!lobby || !userId) return false;
  if (userIsOfferOwner(lobby, userId, handle)) return true;
  return (lobby.accepted || []).some((a: any) => memberMatchesUser(a, userId));
}

export function acceptedExcludingMember(accepted: any[], member: any): any[] {
  const key = memberIdentityKey(member);
  if (!key) return accepted || [];
  return (accepted || []).filter((a: any) => memberIdentityKey(a) !== key);
}

const DUNGEON_SQUAD_DEFAULTS: Record<string, number> = { tank: 1, healer: 1, dps: 2 };
const LEVELING_SQUAD_DEFAULTS: Record<string, number> = { tank: 1, dps: 1 };

function roleKeysForCategory(category?: string): string[] {
  return category === "leveling" ? ["tank", "dps"] : ["tank", "healer", "dps"];
}

function defaultsForCategory(category?: string): Record<string, number> {
  return category === "leveling" ? LEVELING_SQUAD_DEFAULTS : DUNGEON_SQUAD_DEFAULTS;
}

function rolesExplicitlyConfigured(roles: Record<string, number>, roleKeys: string[]): boolean {
  return roleKeys.some((role) => roles[role] !== undefined && roles[role] !== null);
}

function templateSlotSum(template: Record<string, number>): number {
  return Object.values(template).reduce((sum, n) => sum + Number(n || 0), 0);
}

function isDefaultFullSquad(template: Record<string, number>, category?: string): boolean {
  const roleKeys = roleKeysForCategory(category);
  const defaults = defaultsForCategory(category);
  return roleKeys.every((role) => Number(template[role] || 0) === Number(defaults[role] || 0));
}

/** Squad size per role from open slots + accepted (no full-party fallback when roles are explicit). */
export function inferSquadTemplate(lobby: any): Record<string, number> {
  const roles = lobby?.roles || {};
  const accepted = lobby?.accepted || [];
  const roleKeys = roleKeysForCategory(lobby?.category);
  const defaults = defaultsForCategory(lobby?.category);
  const explicit = rolesExplicitlyConfigured(roles, roleKeys);
  const template: Record<string, number> = {};
  for (const role of roleKeys) {
    const open = Number(roles[role]) || 0;
    const filled = accepted.filter((a: any) => (a.role || "").toLowerCase() === role).length;
    let total = open + filled;
    if (total === 0 && !explicit) total = Number(defaults[role]) || 0;
    template[role] = total;
  }
  return template;
}

/** Original squad size per role (open slots + currently accepted). */
export function getSquadTemplate(lobby: any): Record<string, number> {
  if (lobby?.squadTemplate && typeof lobby.squadTemplate === "object") {
    return { ...lobby.squadTemplate };
  }
  return inferSquadTemplate(lobby);
}

/** Snapshot of requested roles at offer creation (0 = not needed). */
export function buildSquadTemplateFromRoles(roles: Record<string, number>, category?: string): Record<string, number> {
  const roleKeys = roleKeysForCategory(category);
  const template: Record<string, number> = {};
  for (const role of roleKeys) {
    const n = Number(roles?.[role]);
    template[role] = Number.isNaN(n) ? 0 : Math.max(0, n);
  }
  return template;
}

const INVITE_TTL_MS = 60_000;

function finalizeSquadJoin(lobby: any, accepted: any[], roles: Record<string, number>) {
  const remainingRolesSum = Object.values(roles).reduce(
    (a: number, b: any) => a + (Number(b) || 0),
    0
  );
  const isFull = remainingRolesSum === 0;
  return {
    ...lobby,
    roles,
    accepted,
    status: isFull ? "in_progress" : lobby.status || "standby",
    ...(isFull && !lobby.missionStartTime ? { missionStartTime: Date.now() } : {}),
  };
}

/** Owner invite: reserve squad slot, show player in accepted roster while pending. */
export function inviteApplicantToLobby(lobby: any, applicant: any, notifId: number): any {
  const key = memberIdentityKey(applicant);
  if (!key) return lobby;

  const applicantRole = (applicant.role || "dps").toLowerCase();
  const newRoles = { ...(lobby.roles || {}) };
  const alreadyInvited = (lobby.accepted || []).some(
    (a: any) => memberIdentityKey(a) === key && a.status === "invited"
  );
  if (!alreadyInvited && Number(newRoles[applicantRole]) > 0) {
    newRoles[applicantRole] -= 1;
  }

  const invitedMember = {
    ...applicant,
    applicantId: applicant.applicantId || applicant.userId || applicant.id,
    status: "invited",
    invitedAt: Date.now(),
    inviteExpiresAt: Date.now() + INVITE_TTL_MS,
    inviteNotifId: notifId,
  };

  const withoutDupes = (lobby.accepted || []).filter((a: any) => memberIdentityKey(a) !== key);

  return {
    ...lobby,
    roles: newRoles,
    accepted: [...withoutDupes, invitedMember],
    applicants: (lobby.applicants || []).filter((a: any) => memberIdentityKey(a) !== key),
  };
}

/** Cancel a pending invite and reopen the reserved role slot. */
export function cancelLobbyInvite(lobby: any, member: any): any {
  const key = memberIdentityKey(member);
  if (!key) return lobby;

  const role = (member.role || "dps").toLowerCase();
  const newRoles = { ...(lobby.roles || {}) };
  if (member.status === "invited") {
    newRoles[role] = (Number(newRoles[role]) || 0) + 1;
  }

  return {
    ...lobby,
    roles: newRoles,
    accepted: (lobby.accepted || []).filter((a: any) => memberIdentityKey(a) !== key),
    applicants: (lobby.applicants || []).filter((a: any) => memberIdentityKey(a) !== key),
  };
}

/** Remove pending applications / invites for a user across the whole offer thread family. */
export function withdrawApplicantFromOfferFamily(
  lobbies: any[],
  lobbyId: string,
  userId: string
): any[] {
  const seed = lobbies.find((l) => String(l.id) === String(lobbyId));
  if (!seed) return lobbies;
  const rootId = getOfferFamilyRootId(seed, lobbies);
  const uid = String(userId);

  return lobbies.map((l) => {
    if (getOfferFamilyRootId(l, lobbies) !== rootId) return l;

    const pendingInvite = (l.accepted || []).find(
      (a: any) => memberIdentityKey(a) === uid && a.status === "invited"
    );
    const inApplicants = (l.applicants || []).some((a: any) => memberIdentityKey(a) === uid);
    const inLegacyInvited = (l.invited || []).some((a: any) => memberIdentityKey(a) === uid);

    if (!inApplicants && !pendingInvite && !inLegacyInvited) return l;

    if (pendingInvite) return cancelLobbyInvite(l, pendingInvite);

    return {
      ...l,
      applicants: (l.applicants || []).filter((a: any) => memberIdentityKey(a) !== uid),
      invited: (l.invited || []).filter((a: any) => memberIdentityKey(a) !== uid),
    };
  });
}

/** Drop expired pending invites and restore open role slots. */
export function purgeExpiredLobbyInvites(lobby: any): any {
  const now = Date.now();
  const expired = (lobby.accepted || []).filter(
    (a: any) => a.status === "invited" && a.inviteExpiresAt && now > a.inviteExpiresAt
  );
  if (!expired.length) return lobby;

  let roles = { ...(lobby.roles || {}) };
  for (const member of expired) {
    const role = (member.role || "dps").toLowerCase();
    roles[role] = (Number(roles[role]) || 0) + 1;
  }

  const expiredKeys = new Set(
    expired.map((m: any) => memberIdentityKey(m)).filter(Boolean)
  );

  const kept = (lobby.accepted || []).filter(
    (a: any) => !(a.status === "invited" && a.inviteExpiresAt && now > a.inviteExpiresAt)
  );

  const applicants = (lobby.applicants || []).filter(
    (a: any) => !expiredKeys.has(memberIdentityKey(a))
  );

  return { ...lobby, roles, accepted: kept, applicants };
}

/** Add applicant to accepted squad; decrements open role slot and dedupes. */
export function confirmApplicantJoin(lobby: any, applicant: any): any {
  const key = memberIdentityKey(applicant);
  if (!key) return lobby;

  const newApplicants = (lobby.applicants || []).filter(
    (a: any) => String(a.id) !== String(applicant.id) && memberIdentityKey(a) !== key
  );

  const invitedIdx = (lobby.accepted || []).findIndex(
    (a: any) => memberIdentityKey(a) === key && a.status === "invited"
  );
  if (invitedIdx >= 0) {
    const accepted = [...(lobby.accepted || [])];
    accepted[invitedIdx] = {
      ...accepted[invitedIdx],
      ...applicant,
      applicantId: applicant.applicantId || applicant.userId || applicant.id,
      status: "confirmed",
      invitedAt: undefined,
      inviteExpiresAt: undefined,
      inviteNotifId: undefined,
    };
    return finalizeSquadJoin({ ...lobby, applicants: newApplicants }, accepted, lobby.roles || {});
  }

  const alreadyConfirmed = (lobby.accepted || []).some(
    (a: any) => memberIdentityKey(a) === key && a.status !== "invited"
  );
  if (alreadyConfirmed) {
    if (newApplicants.length !== (lobby.applicants || []).length) {
      return { ...lobby, applicants: newApplicants };
    }
    return lobby;
  }

  const applicantRole = (applicant.role || "dps").toLowerCase();
  const newRoles = { ...(lobby.roles || {}) };
  if (Number(newRoles[applicantRole]) > 0) newRoles[applicantRole] -= 1;

  const newAccepted = [
    ...(lobby.accepted || []),
    {
      ...applicant,
      applicantId: applicant.applicantId || applicant.userId || applicant.id,
      status: "confirmed",
    },
  ];

  return finalizeSquadJoin(
    { ...lobby, applicants: newApplicants },
    newAccepted,
    newRoles
  );
}

/** Thread root ids blocked for auto-apply after kick/leave (manual apply still allowed). */
export function getOfferFamilyRootId(lobby: any, allLobbies: any[]): string {
  return getThreadRootId(lobby, allLobbies);
}

export function dedupeAccepted(accepted: any[] = []): any[] {
  const map = new Map<string, any>();
  for (const a of accepted) {
    const key = memberIdentityKey(a);
    if (key) map.set(key, a);
  }
  return Array.from(map.values());
}

/** Fix stale open-role counts and duplicate accepted entries after poll/merge. */
export function repairLobbyRoles(lobby: any): any {
  if (!lobby) return lobby;
  const accepted = dedupeAccepted(lobby.accepted || []);
  const inferred = inferSquadTemplate({ ...lobby, accepted });
  let template = lobby.squadTemplate;
  if (template && isDefaultFullSquad(template, lobby.category)) {
    const inferredSum = templateSlotSum(inferred);
    const defaultSum = templateSlotSum(defaultsForCategory(lobby.category));
    if (inferredSum > 0 && inferredSum < defaultSum) template = inferred;
  } else if (!template) {
    template = inferred;
  }
  const roles = openRolesForSquad(template, accepted);
  const isFull = squadRolesFilled(roles);
  let status = lobby.status || "standby";
  let missionStartTime = lobby.missionStartTime;
  if (!isFull && status === "in_progress") {
    status = "standby";
    missionStartTime = undefined;
  }
  return {
    ...lobby,
    accepted,
    squadTemplate: template,
    roles,
    status,
    missionStartTime,
  };
}

/** Map display slots to occupants without reusing the same player twice. */
export function getOccupantsBySlot(
  lobby: any,
  confirmedOnly = true
): { slot: string; occupant: any | null }[] {
  const accepted = getThreadRosterForDisplay(lobby).filter(
    (a: any) =>
      !confirmedOnly ||
      !a.status ||
      a.status === "confirmed" ||
      a.status === "invited"
  );
  const slots = getPartyDisplaySlots(lobby);
  const usedKeys = new Set<string>();

  return slots.map((slot) => {
    const roleType = slot.startsWith("dps") ? "dps" : slot;
    const available = accepted.filter(
      (a: any) =>
        (a.role || "dps").toLowerCase() === roleType && !usedKeys.has(memberIdentityKey(a))
    );
    let occupant: any | null = null;
    if (roleType === "dps") {
      const dpsIndex = parseInt(slot.split("-")[1], 10) - 1;
      occupant = available[dpsIndex] || null;
    } else {
      occupant = available[0] || null;
    }
    if (occupant) usedKeys.add(memberIdentityKey(occupant));
    return { slot, occupant };
  });
}

/** Open slots still needed per role after accepted members are placed. */
export function openRolesForSquad(template: Record<string, number>, accepted: any[]): Record<string, number> {
  const open: Record<string, number> = {};
  for (const [role, total] of Object.entries(template)) {
    const filled = (accepted || []).filter((a: any) => (a.role || "").toLowerCase() === role).length;
    open[role] = Math.max(0, Number(total) - filled);
  }
  return open;
}

export function rolesOpenAfterMemberLeaves(lobby: any, remainingAccepted: any[]) {
  const template = getSquadTemplate(lobby);
  return openRolesForSquad(template, remainingAccepted);
}

const VOICE_CLOSED_STATUSES = new Set([
  "completed",
  "unpaid",
  "cancelled",
  "failed",
  "payment_pending",
]);

/** Voice is live only while the squad is full and the mission is in progress. */
export function isVoiceLobbyOpen(lobby: any): boolean {
  if (!lobby || isEmbeddedFootArchive(lobby)) return false;
  const status = lobby.status || "standby";
  if (status !== "in_progress") return false;
  if (VOICE_CLOSED_STATUSES.has(status)) return false;
  return squadRolesFilled(lobby.roles || {});
}

/** Owner or confirmed squad member may join voice when the lobby is open. */
export function userCanAccessVoice(lobby: any, userId: string, handle?: string): boolean {
  if (!isVoiceLobbyOpen(lobby) || !userId || userId === "guest") return false;
  if (userIsOfferOwner(lobby, userId, handle)) return true;
  return (lobby.accepted || []).some(
    (a: any) =>
      memberMatchesUser(a, userId) && (!a.status || a.status === "confirmed")
  );
}

export function voiceLobbyLockLabel(lobby: any): string {
  if (!lobby) return "No mission";
  if (isEmbeddedFootArchive(lobby)) return "Voice closed";
  const status = lobby.status || "standby";
  if (VOICE_CLOSED_STATUSES.has(status)) return "Voice closed";
  if (status !== "in_progress") return "Opens when squad is full";
  if (!squadRolesFilled(lobby.roles || {})) return "Opens when squad is full";
  return "Voice closed";
}

export function validateVoiceAccess(
  lobby: any,
  userId: string
): { ok: true } | { ok: false; error: string; code: string } {
  if (!lobby) return { ok: false, error: "Lobby not found", code: "NOT_FOUND" };
  if (!userCanAccessVoice(lobby, userId)) {
    if (!isVoiceLobbyOpen(lobby)) {
      return {
        ok: false,
        error: "Voice opens when the squad is full and the mission is in progress.",
        code: "VOICE_LOCKED",
      };
    }
    return {
      ok: false,
      error: "Only squad members can join this voice channel.",
      code: "NOT_MEMBER",
    };
  }
  return { ok: true };
}

/** Owner foot-complete vote alone finalizes the mission (dungeon or leveling). */
export function ownerMissionCompleteInstant(lobby: any, voterId: string): boolean {
  return !!lobby && !!voterId && String(lobby.ownerId) === String(voterId);
}

/** Votes required to mark runs complete (owner alone when squad is empty). */
export function getMissionCompleteVotesNeeded(lobby: any): number {
  if (lobby?.category === "leveling") return 1;
  const confirmedMembersCount = (lobby?.accepted || []).filter(
    (a: any) => !a.status || a.status === "confirmed"
  ).length;
  if (confirmedMembersCount === 0) return 1;
  return Math.max(2, Math.floor((confirmedMembersCount + 1) / 2) + 1);
}

/** Leveling complete / payment flow — owner or confirmed squad member may vote. */
export function canVoteMissionComplete(lobby: any, userId: string): boolean {
  if (!lobby || !userId) return false;
  const uid = String(userId);
  if (String(lobby.ownerId) === uid) return true;
  return (lobby.accepted || []).some(
    (a: any) =>
      memberIdentityKey(a) === uid && (!a.status || a.status === "confirmed")
  );
}

/** Archive leveling offer as unpaid after a single player/owner complete vote. */
export function finalizeLevelingMissionComplete(lobby: any, voteMsg: any, newVotes: any[]): any {
  const now = Date.now();
  return {
    ...lobby,
    status: "unpaid" as const,
    payoutStatus: undefined,
    completedAt: now,
    votes: newVotes,
    failVotes: [],
    messages: [...(lobby.messages || []), voteMsg],
  };
}

/** Votes required to fail mission (owner alone when squad is empty). */
export function getMissionFailVotesNeeded(lobby: any): number {
  return getMissionCompleteVotesNeeded(lobby);
}

/** Majority fail vote passed: kick squad, archive thread as failed. */
export function finalizeMissionFailed(lobby: any, failVotes: any[], messages: any[]): any {
  const failedAt = Date.now();
  const template = getSquadTemplate(lobby);
  const memberHistory = (lobby.accepted || []).map((m: any) => ({
    ...m,
    applicantId: memberIdentityKey(m),
    leftAt: failedAt,
    runsAtExit: 0,
    reason: "failed",
  }));

  return {
    ...lobby,
    status: "failed" as const,
    failedAt,
    completedAt: failedAt,
    payoutStatus: undefined,
    failVotes,
    votes: [],
    accepted: [],
    applicants: [],
    invited: [],
    roles: openRolesForSquad(template, []),
    missionStartTime: undefined,
    messages,
    history: [...(lobby.history || []), ...memberHistory, { reason: "failed", failedAt }],
  };
}

/** Squad is full when every role has zero open slots. */
export function squadRolesFilled(roles: Record<string, number>) {
  return Object.values(roles || {}).every((open) => Number(open || 0) === 0);
}

/** Public offer feed — open recruiting banners only (full squads move to Ongoing). */
export function isLobbyListedInPublicFeed(lobby: any): boolean {
  if (!lobby) return false;
  const cat = lobby.category;
  if (cat && cat !== "dungeon" && cat !== "leveling") return false;
  const status = lobby.status || "standby";
  if (status !== "standby") return false;
  return !squadRolesFilled(lobby.roles || {});
}

/** Banner / party row slot keys (e.g. tank, healer, dps-1, dps-2). */
export function getPartyDisplaySlots(lobby: any): string[] {
  const template = getSquadTemplate(lobby);
  const slots: string[] = [];
  for (const [role, total] of Object.entries(template)) {
    const count = Number(total) || 0;
    for (let i = 0; i < count; i++) {
      slots.push(role === "dps" ? `dps-${i + 1}` : role);
    }
  }
  return slots;
}

export function buildOfferEditChatText(before: any, after: any): string | null {
  const parts: string[] = [];
  const roleLabel = (r: Record<string, number>) =>
    Object.entries(r || {})
      .filter(([, n]) => Number(n) > 0)
      .map(([role, n]) => `${n} ${role.toUpperCase()}`)
      .join(", ");

  const beforeRoles = roleLabel(before.roles);
  const afterRoles = roleLabel(after.roles);
  if (beforeRoles !== afterRoles) parts.push(`roles → ${afterRoles || "none"}`);

  if (Number(before.goldPerRun) !== Number(after.goldPerRun)) {
    parts.push(`price → ${after.goldPerRun}K/run`);
  }
  if (Number(before.runsCount) !== Number(after.runsCount)) {
    parts.push(`runs → ${after.runsCount}`);
  }
  if (JSON.stringify(before.selectedDungeons || {}) !== JSON.stringify(after.selectedDungeons || {})) {
    const dungeons = Object.entries(after.selectedDungeons || {})
      .filter(([, c]) => Number(c) > 0)
      .map(([name, c]) => `${c}x ${name}`)
      .join(", ");
    if (dungeons) parts.push(`dungeons → ${dungeons}`);
  }
  if (parts.length === 0) return null;
  return `Offer updated: ${parts.join(" · ")}`;
}

export type MemberExitResult = {
  lobbies: any[];
  childLobby: any | null;
  focusLobbyId: string;
};

/** Foot-leave / kick with completed runs: archive unpaid foot ledger + resurrect remaining runs on child. */
export function splitLobbyAfterMemberExit(
  allLobbies: any[],
  lobbyId: string,
  member: any,
  completed: number,
  isKick: boolean,
  leaveMsg: any,
  historySnapshot: any
): MemberExitResult | null {
  const lobby = allLobbies.find((l) => String(l.id) === String(lobbyId));
  if (!lobby || !member) return null;

  const newAccepted = acceptedExcludingMember(lobby.accepted || [], member);
  const newRoles = rolesOpenAfterMemberLeaves(lobby, newAccepted);

  if (completed <= 0) {
    const updated = allLobbies.map((l) => {
      if (String(l.id) !== String(lobbyId)) return l;
      const wasActive = l.status === "in_progress";
      return {
        ...l,
        roles: newRoles,
        accepted: newAccepted,
        messages: [...(l.messages || []), leaveMsg],
        ...(wasActive
          ? {
              status: "standby" as const,
              applicants: [],
              votes: [],
              failVotes: [],
              detectedRuns: [],
              missionStartTime: undefined,
            }
          : {}),
      };
    });
    return { lobbies: updated, childLobby: null, focusLobbyId: lobbyId };
  }

  const { completedPart, remainingPart, remainingCount, completedCount } = deductRunsFromDungeons(
    lobby.selectedDungeons,
    lobby.runsCount || 1,
    completed
  );

  const now = Date.now();
  const goldPerRun = lobby.goldPerRun || 0;

  const wasActive = lobby.status === "in_progress";
  const squadContinues = (lobby.accepted || []).filter(
    (a: any) => memberIdentityKey(a) !== memberIdentityKey(member)
  );

  const footArchive = {
    ...lobby,
    status: "unpaid" as const,
    payoutStatus: undefined,
    embeddedFoot: true,
    runsCount: completedCount,
    totalGold: goldPerRun * completedCount,
    selectedDungeons: Object.keys(completedPart).length ? completedPart : lobby.selectedDungeons,
    accepted: [],
    history: [...(lobby.history || []), historySnapshot],
    messages: [...(lobby.messages || []), leaveMsg],
    completedAt: now,
    votes: [],
    failVotes: [],
    detectedRuns: [],
    missionStartTime: undefined,
    applicants: [],
    invited: [],
  };

  if (remainingCount <= 0) {
    const lobbies = allLobbies.map((l) => (String(l.id) === String(lobbyId) ? footArchive : l));
    return { lobbies, childLobby: null, focusLobbyId: lobbyId };
  }

  const childId = String(now + 2);
  const squadTemplate = lobby.squadTemplate || getSquadTemplate(lobby);
  const childLobby = {
    ...lobby,
    id: childId,
    parentId: lobbyId,
    resurrected: true,
    squadTemplate,
    status: wasActive && squadContinues.length > 0 ? ("in_progress" as const) : ("standby" as const),
    runsCount: remainingCount,
    totalGold: goldPerRun * remainingCount,
    selectedDungeons: Object.keys(remainingPart).length ? remainingPart : undefined,
    accepted: squadContinues,
    roles: newRoles,
    applicants: [],
    invited: [],
    messages: [...(lobby.messages || []), leaveMsg],
    votes: [],
    failVotes: [],
    detectedRuns: [],
    history: [],
    completedRuns: [],
    payoutStatus: undefined,
    paymentProof: undefined,
    completedAt: undefined,
    embeddedFoot: undefined,
    missionStartTime: wasActive ? lobby.missionStartTime || now : undefined,
  };

  const lobbies = [
    ...allLobbies.map((l) => (String(l.id) === String(lobbyId) ? footArchive : l)),
    childLobby,
  ];

  return { lobbies, childLobby, focusLobbyId: childId };
}

/** Squad vote foot-complete: archive unpaid parent + resurrect remaining runs (squad stays intact). */
export function splitLobbyAfterFootComplete(
  allLobbies: any[],
  lobbyId: string,
  completed: number,
  voteMsg: any,
  newVotes: any[]
): MemberExitResult | null {
  const lobby = allLobbies.find((l) => String(l.id) === String(lobbyId));
  if (!lobby || completed <= 0) return null;

  const { completedPart, remainingPart, remainingCount, completedCount } = deductRunsFromDungeons(
    lobby.selectedDungeons,
    lobby.runsCount || 1,
    completed
  );

  const now = Date.now();
  const goldPerRun = lobby.goldPerRun || 0;
  const accepted = lobby.accepted || [];
  const roles = lobby.roles || openRolesForSquad(getSquadTemplate(lobby), accepted);

  const unpaidParent = {
    ...lobby,
    status: "unpaid" as const,
    payoutStatus: undefined,
    runsCount: completedCount,
    totalGold: goldPerRun * completedCount,
    selectedDungeons: Object.keys(completedPart).length ? completedPart : lobby.selectedDungeons,
    accepted,
    messages: [...(lobby.messages || []), voteMsg],
    completedAt: now,
    votes: newVotes,
    completedRuns: getCompletedRunsCount(lobby) + completedCount,
    failVotes: [],
    detectedRuns: [],
  };

  if (remainingCount <= 0) {
    const lobbies = allLobbies.map((l) => (String(l.id) === String(lobbyId) ? unpaidParent : l));
    return { lobbies, childLobby: null, focusLobbyId: lobbyId };
  }

  const childId = String(now + 1);
  const squadTemplate = lobby.squadTemplate || getSquadTemplate(lobby);
  const childLobby = {
    ...lobby,
    id: childId,
    parentId: lobbyId,
    resurrected: true,
    squadTemplate,
    status: "standby" as const,
    runsCount: remainingCount,
    totalGold: goldPerRun * remainingCount,
    selectedDungeons: Object.keys(remainingPart).length ? remainingPart : undefined,
    accepted,
    roles,
    applicants: [],
    invited: [],
    messages: [...(lobby.messages || []), voteMsg],
    votes: [],
    failVotes: [],
    detectedRuns: [],
    history: [],
    completedRuns: [],
    payoutStatus: undefined,
    paymentProof: undefined,
    completedAt: undefined,
    missionStartTime: undefined,
  };

  const lobbies = [
    ...allLobbies.map((l) => (String(l.id) === String(lobbyId) ? unpaidParent : l)),
    childLobby,
  ];

  return { lobbies, childLobby, focusLobbyId: childId };
}

export function migrateLobbies(lobbies: any[], dataVersion: number): { lobbies: any[]; changed: boolean } {
  if (dataVersion >= LOBBY_DATA_VERSION) {
    return { lobbies, changed: false };
  }
  const sanitized = lobbies.map(sanitizeLobby);
  return { lobbies: sanitized, changed: true };
}
