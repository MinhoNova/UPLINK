export type SubscriptionPlan = {
  months: 1 | 2 | 3;
  label: string;
  priceUsd: string;
  priceGoldK: number;
  days: number;
  badge?: string;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { months: 1, label: "1 Month", priceUsd: "$2.00", priceGoldK: 50, days: 30 },
  { months: 2, label: "2 Months", priceUsd: "$3.60", priceGoldK: 90, days: 60, badge: "Best Value" },
  { months: 3, label: "3 Months", priceUsd: "$5.00", priceGoldK: 125, days: 90 },
];

export type SubscriptionPaymentMethod = "usd" | "gold";

export function formatGoldPrice(goldK: number): string {
  return `${goldK}K`;
}

export function getSubscriptionPlan(months: number): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.months === months);
}

export function formatPlanPrice(plan: SubscriptionPlan, method: SubscriptionPaymentMethod): string {
  return method === "gold" ? formatGoldPrice(plan.priceGoldK) : plan.priceUsd;
}
