import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const users: Record<string, any>[] = (await getKV("registeredUsers")) || [];
  let reset = 0;

  const next = users.map((u) => {
    const hadCustom = u.displayName || u.customAvatar;
    const copy = { ...u };
    if (copy.displayName) {
      delete copy.displayName;
      reset++;
    }
    if (copy.customAvatar) {
      delete copy.customAvatar;
      reset++;
    }
    if (hadCustom) return copy;
    return u;
  });

  await setKV("registeredUsers", next);

  return NextResponse.json({ success: true, reset, users: next.length });
}