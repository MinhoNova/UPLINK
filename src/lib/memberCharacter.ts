import { getKV } from "@/lib/db";
import { gameCharIdOf } from "@/lib/characterStore";

/**
 * Copy the verified game character onto a squad row so the thread can show the
 * real in-game portrait, ilevel, class and server the way the official character
 * page does.
 *
 * Why this has to be server-side: `portraitUrl`, `itemLevel`, `serverName` and
 * the rest only exist on the `characters` rows (`characterStore.toStoredCharacter`).
 * Nothing copied them onto `lobby.accepted` / `lobby.applicants`, so the thread's
 * portrait block (`ManageModal`) tested `occupant.portraitUrl` — always undefined,
 * never rendered. It could not be fixed on the client either: a member's own row
 * is frozen by `clampMemberWrite`, which reverts any field the store never had,
 * so a self-supplied portrait would be silently discarded.
 */

export type MemberCharacterSnapshot = {
  portraitUrl?: string;
  gameCharacterId?: string;
  itemLevel?: number;
  serverName?: string;
  gameClassLabel?: string;
  raceName?: string;
  genderName?: string;
  region?: string;
};

/**
 * Lookup tables for the `characters` roster.
 *
 * `GET /api/data` is polled every couple of seconds by every open client, so the
 * overlay below cannot afford to rescan the roster per squad row: at a few hundred
 * lobbies × eight rows × a few hundred characters that is a million comparisons
 * per poll. Both indexes are built once per pass.
 */
type CharacterIndex = {
  byId: Map<string, any>;
  byUser: Map<string, any[]>;
};

function buildIndex(characters: any[]): CharacterIndex | null {
  if (!Array.isArray(characters) || !characters.length) return null;
  const byId = new Map<string, any>();
  const byUser = new Map<string, any[]>();
  for (const c of characters) {
    if (!c || typeof c !== "object") continue;
    const id = gameCharIdOf(c);
    if (id && !byId.has(id)) byId.set(id, c);
    const uid = String(c.userId ?? "");
    if (!uid) continue;
    const list = byUser.get(uid);
    if (list) list.push(c);
    else byUser.set(uid, [c]);
  }
  // Newest verification first, so the fallback picks the character's current one.
  for (const list of byUser.values()) {
    list.sort((a, b) => Number(b?.verifiedAt || 0) - Number(a?.verifiedAt || 0));
  }
  return { byId, byUser };
}

/** The single character row to snapshot for this member, if one is on file. */
function pickFromIndex(index: CharacterIndex, member: any): any | null {
  // The row's own claim, either as `game:<id>` or as a bare id.
  const claimed = String(
    member?.gameCharacterId || member?.characterId || member?.applicantGameCharacterId || ""
  ).trim();
  if (claimed) {
    const wanted = claimed.startsWith("game:") ? claimed.slice(5) : claimed;
    const hit = index.byId.get(wanted);
    if (hit) return hit;
  }
  // Otherwise the member's most recently verified character of their own.
  return index.byUser.get(String(member?.applicantId ?? member?.userId ?? ""))?.[0] ?? null;
}

/** Public single-member helpers — build the index for one lookup. */
export function pickMemberCharacter(characters: any[], member: any): any | null {
  const index = buildIndex(characters);
  return index ? pickFromIndex(index, member) : null;
}

export function memberCharacterSnapshot(characters: any[], member: any): MemberCharacterSnapshot {
  const index = buildIndex(characters);
  return index ? snapshotFromIndex(index, member) : {};
}

function snapshotFromIndex(index: CharacterIndex, member: any): MemberCharacterSnapshot {
  const c = pickFromIndex(index, member);
  if (!c) return {};
  const out: MemberCharacterSnapshot = {};
  const portrait = String(c.portraitUrl || "").trim();
  const gameId = gameCharIdOf(c);
  if (portrait) out.portraitUrl = portrait.slice(0, 500);
  if (gameId) out.gameCharacterId = String(gameId).slice(0, 64);
  const ilvl = Number(c.itemLevel);
  if (Number.isFinite(ilvl) && ilvl > 0) out.itemLevel = ilvl;
  if (c.serverName) out.serverName = String(c.serverName).slice(0, 60);
  if (c.gameClassLabel) out.gameClassLabel = String(c.gameClassLabel).slice(0, 60);
  if (c.raceName) out.raceName = String(c.raceName).slice(0, 40);
  if (c.genderName) out.genderName = String(c.genderName).slice(0, 20);
  if (c.region) out.region = String(c.region).slice(0, 20);
  return out;
}

/**
 * Overlay every member/applicant row that has a linked character on file.
 *
 * Refreshed, not frozen at join time: this runs on every read, so re-verifying a
 * character on the profile page updates the squad card too — a value stamped once
 * at apply time is exactly the stale ilevel/portrait that prompted this. The
 * `characters` row is server-verified, so it is authoritative.
 *
 * A row is only ever added to. If the player has no character on file the row is
 * returned untouched, so unlinking a character cannot blank a portrait other
 * members already see. Returns the input array untouched when nothing moved.
 */
export function applyCharacterSnapshots(lobbies: any[], characters: any[]): any[] {
  if (!Array.isArray(lobbies)) return lobbies;
  const index = buildIndex(characters);
  if (!index) return lobbies;

  let touched = false;
  const next = lobbies.map((lobby) => {
    let lobbyTouched = false;
    const patch = (rows: any): any[] => {
      if (!Array.isArray(rows)) return rows;
      return rows.map((row) => {
        const snap = snapshotFromIndex(index, row);
        if (!Object.keys(snap).length) return row;
        const merged = { ...row, ...snap };
        if (JSON.stringify(merged) === JSON.stringify(row)) return row;
        lobbyTouched = true;
        return merged;
      });
    };
    const patched = {
      ...lobby,
      accepted: patch(lobby?.accepted),
      applicants: patch(lobby?.applicants),
    };
    if (!lobbyTouched) return lobby;
    touched = true;
    return patched;
  });
  return touched ? next : lobbies;
}

/** Convenience wrapper for the single-row routes. */
export async function charactersFromStore(): Promise<any[]> {
  const rows = (await getKV("characters")) as any;
  return Array.isArray(rows) ? rows : [];
}
