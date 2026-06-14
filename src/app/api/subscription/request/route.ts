import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { TICKET_TTL_MS } from "@/lib/tickets";
import {
  formatGoldPrice,
  formatPlanPrice,
  getSubscriptionPlan,
  type SubscriptionPaymentMethod,
} from "@/lib/subscriptionPlans";

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || "";
  const body = await req.json();
  const months = Number(body.months);
  const days = Number(body.days) || months * 30;
  const paymentMethod: SubscriptionPaymentMethod = body.paymentMethod === "gold" ? "gold" : "usd";

  const plan = getSubscriptionPlan(months);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  await initTables();
  const tickets: any[] = (await getKV("tickets")) || [];
  const ticketId = `shop_${Date.now()}_${userId.slice(-4)}`;
  const price = formatPlanPrice(plan, paymentMethod);
  const paymentLabel = paymentMethod === "gold" ? "in-game gold" : "USD";

  const now = Date.now();
  const requestText =
    paymentMethod === "gold"
      ? `I would like to purchase Secret Club membership for ${months} month(s) (${days} days) and pay ${formatGoldPrice(plan.priceGoldK)} in-game gold. Please send trade/payment instructions.`
      : `I would like to purchase Secret Club membership for ${months} month(s) (${days} days) at ${price}. Please send payment instructions.`;

  tickets.push({
    id: ticketId,
    userId,
    subject: `Secret Club — ${months} Month${months > 1 ? "s" : ""} (${price} ${paymentLabel})`,
    status: "open",
    createdAt: now,
    expiresAt: now + TICKET_TTL_MS,
    messages: [
      {
        id: now,
        from: session.user.name || "User",
        fromId: userId,
        text: requestText,
        time: new Date().toLocaleString(),
      },
    ],
  });

  await setKV("tickets", tickets);
  return NextResponse.json({ success: true, ticketId, paymentMethod, price });
}
