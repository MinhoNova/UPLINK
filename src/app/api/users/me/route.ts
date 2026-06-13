import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";

const PROTECTED_SELF_FIELDS = ["id", "username", "subscription"] as const;

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const registeredUsers: { id?: string }[] = (await getKV("registeredUsers")) || [];
  const profile = registeredUsers.find((u) => String(u.id) === String(auth.user.id)) || null;

  return NextResponse.json({ role: auth.user.role, profile });
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
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
  const merged = { ...incoming };
  for (const field of PROTECTED_SELF_FIELDS) {
    if (existing[field] !== undefined) merged[field] = existing[field];
  }
  registeredUsers[idx] = merged;
  await setKV("registeredUsers", registeredUsers);

  return NextResponse.json({ success: true, profile: merged });
}
