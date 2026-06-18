import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";
import { storeUserMediaFile } from "@/lib/userMediaStorage";
import { getImageMetadata, normalizeLobbyVfx } from "@/lib/imageProcess";

export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const requests: any[] = (await getKV("boostRequests")) || [];

  const myUserId = String(auth.user.id);
  const masked = requests.map((r) => {
    const isOwner = String(r.userId) === myUserId;
    if (isOwner) return r;
    const myBid = r.bids?.find((b: any) => String(b.userId) === myUserId);
    return {
      ...r,
      bids: myBid ? [myBid] : [],
      totalBids: r.bids?.length || 0,
    };
  });

  return NextResponse.json({ requests: masked });
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const requests: any[] = (await getKV("boostRequests")) || [];

  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  let action: string;
  let payload: any = {};

  if (isMultipart) {
    const formData = await req.formData();
    action = String(formData.get("action") || "");
    for (const [key, val] of formData.entries()) {
      payload[key] = val;
    }
  } else {
    const body = await req.json();
    action = body.action;
    payload = body;
  }

  if (action === "create") {
    const { type, faction, dungeonName, keyLevel, startLevel, endLevel, budget, notes } = payload;
    if (!type || !["leveling", "dungeon"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!budget || budget <= 0) {
      return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
    }
    const newRequest = {
      id: `br_${Date.now()}`,
      userId: String(auth.user.id),
      userName: auth.user.name || auth.user.username || "Operative",
      type,
      faction: type === "leveling" ? (faction === "horde" || faction === "alliance" ? faction : null) : null,
      startLevel: type === "leveling" ? (Number(startLevel) || 1) : null,
      endLevel: type === "leveling" ? (Number(endLevel) || 70) : null,
      dungeonName: type === "dungeon" ? (dungeonName || "") : null,
      keyLevel: type === "dungeon" ? (Number(keyLevel) || 0) : null,
      budget: Number(budget),
      budgetCurrency: "gold",
      notes: notes || "",
      customBg: "",
      status: "open",
      bids: [],
      acceptedBidId: null,
      createdAt: Date.now(),
    };
    requests.unshift(newRequest);
    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true, request: newRequest });
  }

  if (action === "bid") {
    const { requestId, amount, message } = payload;
    if (!requestId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid bid" }, { status: 400 });
    }
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const req2 = requests[idx];
    if (req2.status !== "open") return NextResponse.json({ error: "Request is closed" }, { status: 403 });
    if (String(req2.userId) === String(auth.user.id)) {
      return NextResponse.json({ error: "Cannot bid on your own request" }, { status: 403 });
    }

    const newAmount = Number(amount);
    const bid = {
      id: `bid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: String(auth.user.id),
      userName: auth.user.name || auth.user.username || "Operative",
      userHandle: auth.user.username || "",
      amount: newAmount,
      message: message || "",
      createdAt: Date.now(),
    };
    req2.bids.push(bid);
    requests[idx] = req2;

    // Undercut notification
    const requestTitle = req2.dungeonName
      ? `${req2.dungeonName} +${req2.keyLevel}`
      : `Leveling ${req2.startLevel}→${req2.endLevel}`;
    const undercutBidders = req2.bids.filter(
      (b: any) => b.amount > newAmount && String(b.userId) !== String(auth.user.id) && b.id !== bid.id
    );
    if (undercutBidders.length > 0) {
      const notifications: any[] = (await getKV("notifications")) || [];
      for (const bidder of undercutBidders) {
        notifications.push({
          id: Date.now() + Math.random(),
          toUser: bidder.userHandle || bidder.userName,
          fromUser: "UPLINK System",
          fromHandle: "system",
          fromAvatar: null,
          message: `Someone placed a lower bid (${newAmount}K) on "${requestTitle}" — your bid was ${bidder.amount}K.`,
          type: "system_alert",
          timestamp: Date.now(),
        });
      }
      await setKV("notifications", notifications);
    }

    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true, bid });
  }

  if (action === "accept") {
    const { requestId, bidId } = payload;
    if (!requestId || !bidId) {
      return NextResponse.json({ error: "Missing requestId or bidId" }, { status: 400 });
    }
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const req2 = requests[idx];
    if (String(req2.userId) !== String(auth.user.id)) {
      return NextResponse.json({ error: "Only the requester can accept bids" }, { status: 403 });
    }
    if (req2.status !== "open") return NextResponse.json({ error: "Request is already closed" }, { status: 403 });
    const bid = req2.bids.find((b: any) => b.id === bidId);
    if (!bid) return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    req2.status = "accepted";
    req2.acceptedBidId = bidId;
    requests[idx] = req2;
    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true, request: req2 });
  }

  if (action === "cancel") {
    const { requestId } = payload;
    if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const req2 = requests[idx];
    if (String(req2.userId) !== String(auth.user.id)) {
      return NextResponse.json({ error: "Only the requester can cancel" }, { status: 403 });
    }
    req2.status = "closed";
    requests[idx] = req2;
    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true });
  }

  if (action === "set-bg") {
    const { requestId, url } = payload;
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const req2 = requests[idx];
    if (String(req2.userId) !== String(auth.user.id)) {
      return NextResponse.json({ error: "Only the requester can set background" }, { status: 403 });
    }

    let bgUrl = url || "";

    // Handle file upload via FormData
    if (isMultipart) {
      const file = payload.file as File | undefined;
      if (file?.size) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const isGif = file.type.includes("gif") || file.name.toLowerCase().endsWith(".gif");
          const meta = await getImageMetadata(buffer).catch(() => null);
          const gifDetected = isGif || (meta?.format === "gif");
          const normalized = await normalizeLobbyVfx(buffer, gifDetected);
          const mime = normalized.ext === "gif" ? "image/gif" : "image/webp";
          bgUrl = await storeUserMediaFile(
            String(auth.user.id),
            normalized.buffer,
            normalized.ext,
            mime
          );
        } catch {
          return NextResponse.json({ error: "Image processing failed" }, { status: 400 });
        }
      }
    }

    req2.customBg = bgUrl;
    requests[idx] = req2;
    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true, url: bgUrl });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
