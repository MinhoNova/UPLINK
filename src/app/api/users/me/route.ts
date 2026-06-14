import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";
import { validateRegisteredUsers, isAdminUser } from "@/lib/secureDataWrite";

const PROTECTED_SELF_FIELDS = ["id", "username", "subscription"] as const;

export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const registeredUsers: { id?: string }[] = (await getKV("registeredUsers")) || [];
  const profile = registeredUsers.find((u) => String(u.id) === String(auth.user.id)) || null;

  return NextResponse.json({ role: auth.user.role, profile });
}

export async function PATCH(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const incoming = body?.profile;
  if (!incoming || typeof incoming !== "object" || String(incoming.id) !== String(auth.user.id)) {
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  await initTables();
  const registeredUsers: Record<string, unknown>[] = (await getKV("registeredUsers")) || [];
  const idx = registeredUsers.findIndex((u) => String(u.id) === String(auth.user.id));
  if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = registeredUsers[idx];
  const merged = { ...existing, ...incoming };
  for (const field of PROTECTED_SELF_FIELDS) {
    if (existing[field] !== undefined) merged[field] = existing[field];
  }
  for (const field of ["profileGif", "profileGifThumb", "customAvatar", "banner"] as const) {
    if (field in incoming && (incoming[field] === null || incoming[field] === "")) {
      delete merged[field];
    }
  }

  const admin = isAdminUser(auth.user.id, auth.user.username);
  const validation = validateRegisteredUsers(
    registeredUsers,
    registeredUsers.map((u, i) => (i === idx ? merged : u)),
    auth.user.id,
    admin
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 403 });
  }

  await setKV("registeredUsers", validation.value);
  const saved = (validation.value as Record<string, unknown>[]).find(
    (u) => String(u.id) === String(auth.user.id)
  );

  return NextResponse.json({ success: true, profile: saved });
}
