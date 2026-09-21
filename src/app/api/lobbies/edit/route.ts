import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables, updateKVAtomic } from "@/lib/db";
import { AION2_CLASSES } from "@/lib/aionClassMeta";
import { appendOfferFamilyMessage } from "@/lib/lobbyLifecycle";
import { getClientIp } from "@/lib/requestIp";
import { touchUserLastIp } from "@/lib/userLastIp";
import { OFFER_BANNER_BG_ALLOWED } from "@/lib/offerBannerBg";

const ALLOWED_REGIONS = ["EU", "NA (EAST)", "NA (WEST)"];
const ALLOWED_STATUSES = new Set(["", "standby", "in_progress"]);

function cleanTitle(v: unknown): string {
  return String(v || "").trim().slice(0, 60);
}
function cleanNotes(v: unknown): string {
  return String(v || "").trim().slice(0, 400);
}
function cleanInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
function cleanPrice(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(99999, Math.round(n * 100) / 100);
}
function cleanRegion(v: unknown): string {
  const s = String(v || "").trim().toUpperCase();
  return ALLOWED_REGIONS.includes(s)
    ? s
    : s.includes("NA")
      ? "NA (EAST)"
      : "EU";
}
function cleanBg(v: unknown, fallback: string): string {
  const s = String(v || "").trim();
  if (!s) return fallback;
  if (s.length > 260) return fallback;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  if (OFFER_BANNER_BG_ALLOWED.has(s)) return s;
  return fallback;
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const lobbyId = String(body?.lobbyId || "");
  if (!lobbyId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  await initTables();
  const isAdmin = auth.user.role === "admin";
  const uid = String(auth.user.id);

  let abortReason: string | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const existing = Array.isArray(lobbies) ? lobbies : [];
    const idx = existing.findIndex((l: any) => String(l.id) === String(lobbyId));
    if (idx === -1) { abortReason = "Not found"; return undefined; }
    const lobby = existing[idx];
    if (String(lobby.ownerId) !== uid && !isAdmin) { abortReason = "Forbidden"; return undefined; }
    const curStatus = String(lobby.status || "");
    if (!ALLOWED_STATUSES.has(curStatus)) {
      abortReason = "Offers can only be edited while in standby or active (before payment).";
      return undefined;
    }

    const prev = lobby;
    const title = cleanTitle(body.title) || String(prev.title || "");
    const notes = body.notes != null ? cleanNotes(body.notes) : String(prev.notes || "");
    const runsCount = cleanInt(body.runsCount, 1, 99, Number(prev.runsCount) || 1);
    const pricePerRun = body.pricePerRun != null ? cleanPrice(body.pricePerRun) : Number(prev.pricePerRun) || 0;
    const serverRegion = cleanRegion(body.serverRegion ?? prev.serverRegion ?? "EU").toUpperCase();
    const customBg = cleanBg(body.customBg ?? prev.customBg, prev.customBg || "");

    const rawClasses = Array.isArray(body.requiredClasses) ? body.requiredClasses.map((c: any) => String(c || "")) : [];
    const classCounts = new Map<string, number>();
    for (const c of rawClasses) if ((AION2_CLASSES as readonly string[]).includes(c)) classCounts.set(c, (classCounts.get(c) || 0) + 1);

    let roles: Record<string, number> | null = null;
    let requiredClasses: string[] | undefined;
    const classesWereProvided = Array.isArray(body.requiredClasses);
    const rolesWereProvided = body.roles !== undefined;
    if (classesWereProvided || rolesWereProvided) {
      if (classCounts.size > 0) {
        roles = Object.fromEntries([...classCounts.entries()].map(([k, v]) => [k, Math.min(6, v)]));
        requiredClasses = [...classCounts.entries()].map(([k, v]) => Array(v).fill(k)).flat();
      } else {
        // Explicit "any class" — clear class locks, fall back to role-generic squad.
        const generic = prev.roles && typeof prev.roles === "object" && Object.keys(prev.roles).length
          ? prev.roles
          : lobby.category === "leveling"
            ? { tank: 0, dps: Math.max(Number(prev.maxBoosters) || 1, 1) }
            : { tank: 0, healer: 0, dps: Math.max(Number(prev.maxBoosters) || 1, 1) };
        for (const c of AION2_CLASSES) delete generic[c];
        roles = sanitizeRoleCounts(generic);
        requiredClasses = undefined;
      }
    }

    let updated: any = { ...prev, title, notes, runsCount, pricePerRun, serverRegion, customBg };
    if (roles) { updated = { ...updated, roles, requiredClasses }; }

    const mtime = Date.now();
    updated = { ...updated, updatedAt: mtime };

    const editMsg = {
      id: mtime,
      fromId: "bot",
      from: "UPLINK",
      fromHandle: "UPLINK",
      fromAvatar: "",
      fromEffect: "none",
      text: "Offer parameters updated.",
      image: null,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const withMsg = appendOfferFamilyMessage(existing, updated, editMsg);
    return withMsg;
  });

  if (!res.ok) {
    const status = abortReason === "Not found" ? 404 : abortReason === "Forbidden" ? 403 : 422;
    return NextResponse.json({ error: abortReason || "Could not edit — try again." }, { status });
  }

  const updatedLobby = res.ok ? (res.value || []).find((l: any) => String(l.id) === String(lobbyId)) : null;
  touchUserLastIp(uid, getClientIp(req)).catch(() => {});
  return NextResponse.json({ success: true, lobby: updatedLobby });
}

function sanitizeRoleCounts(roles: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (!roles || typeof roles !== "object") return {};
  const allowed = new Set([...AION2_CLASSES.map((c) => c.toLowerCase()), "tank", "dps", "healer"]);
  for (const [k, v] of Object.entries(roles)) {
    const key = String(k).toLowerCase();
    if (!allowed.has(key)) continue;
    const n = Math.round(Number(v));
    if (Number.isFinite(n) && n > 0) out[key] = Math.min(6, n);
  }
  return out;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}