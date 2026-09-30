import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { logAudit } from "@/lib/auditLog";
import {
  listPosterRequests,
  decidePosterRequest,
  setPosterApproval,
  type PosterRequestStatus,
} from "@/lib/posterApproval";

/** GET: the approval queue, newest first. `?status=pending` narrows it. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const statusParam = new URL(req.url).searchParams.get("status");
  const status =
    statusParam === "pending" || statusParam === "approved" || statusParam === "rejected"
      ? (statusParam as PosterRequestStatus)
      : undefined;

  const requests = await listPosterRequests(status);
  return NextResponse.json(
    { requests },
    { headers: { "cache-control": "private, no-store" } }
  );
}

/** POST: approve or reject a request. Body: { requestId, approve, userId? }. */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: any = await req.json();
  const requestId = String(body?.requestId || "");
  const approve = body?.approve === true;
  const userId = String(body?.userId || "");

  if (!requestId && !userId) {
    return NextResponse.json({ error: "requestId or userId required" }, { status: 400 });
  }

  if (userId && !requestId) {
    // Direct grant/revoke, for granting someone who skipped the form.
    await setPosterApproval(userId, approve);
    await logAudit({
      action: approve ? "poster.approve_direct" : "poster.revoke_direct",
      userId: auth.user.id,
      handle: auth.user.username,
      meta: { target: userId },
    }).catch(() => {});
    return NextResponse.json({ success: true, userId, approved: approve });
  }

  const res = await decidePosterRequest({
    requestId,
    approve,
    decidedBy: String(auth.user.id),
  });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });

  await logAudit({
    action: approve ? "poster.approve" : "poster.reject",
    userId: auth.user.id,
    handle: auth.user.username,
    meta: { requestId },
  }).catch(() => {});

  return NextResponse.json({ success: true, status: res.status });
}
