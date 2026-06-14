"use client";

import { motion } from "framer-motion";
import { Crown, Check, Loader2, Gift, X, Coins, DollarSign } from "lucide-react";
import { useState } from "react";
import {
  SUBSCRIPTION_PLANS,
  formatGoldPrice,
  type SubscriptionPaymentMethod,
} from "@/lib/subscriptionPlans";

const PERKS = [
  "Auto-Apply to offers",
  "Profile GIF & custom avatar",
  "Avatar effects & lobby VFX",
  "Hidden identity & Secret Club badge",
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onClaimed?: () => void;
  addToast?: (msg: string, type?: "success" | "error" | "info") => void;
};

export default function WelcomePlansModal({ isOpen, onClose, onClaimed, addToast }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const claimFree = async () => {
    setLoading("free");
    try {
      const res = await fetch("/api/subscription/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_free" }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast?.(data.error || "Could not activate free month", "error");
        return;
      }
      addToast?.(`Welcome! Secret Club active for ${data.daysLeft ?? 30} days.`, "success");
      onClaimed?.();
      onClose();
    } catch {
      addToast?.("Network error", "error");
    } finally {
      setLoading(null);
    }
  };

  const purchasePlan = async (months: number, days: number, paymentMethod: SubscriptionPaymentMethod) => {
    setLoading(`${months}-${paymentMethod}`);
    try {
      const res = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months, days, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast?.(data.error || "Purchase request failed", "error");
        return;
      }
      await fetch("/api/subscription/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      addToast?.(`Request sent! Support ticket #${String(data.ticketId || "").slice(-6)}`, "success");
      onClose();
    } catch {
      addToast?.("Network error", "error");
    } finally {
      setLoading(null);
    }
  };

  const dismiss = async () => {
    await fetch("/api/subscription/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    }).catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-gradient-to-br from-[#0a0a16] to-black border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <Crown className="w-5 h-5 text-yellow-400" />
          <div className="flex-1">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Welcome to UPLINK</h2>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
              First visit — choose your membership
            </p>
          </div>
          <button type="button" onClick={dismiss} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="rounded-2xl border-2 border-[#ff007f]/50 bg-gradient-to-br from-[#ff007f]/15 to-[#00ffff]/10 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-[#ff007f]" />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#ff007f]">
                First visit only
              </span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">1 Month Free</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
              Secret Club — full perks, no payment
            </p>
            <ul className="space-y-1.5 mb-6 flex-1">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[10px] text-gray-300 font-bold">
                  <Check className="w-3.5 h-3.5 text-[#00ffff] shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={loading !== null}
              onClick={claimFree}
              className="w-full py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest bg-gradient-to-r from-[#ff007f] to-[#00ffff] text-black hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading === "free" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Activate free month
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Paid plans</p>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.months}
                className="w-full p-4 rounded-2xl border border-white/10 bg-white/[0.03] relative"
              >
                {plan.badge && (
                  <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-widest bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-black text-white">{plan.label}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Secret Club</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#00ffff]">{plan.priceUsd}</p>
                    <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">
                      or {formatGoldPrice(plan.priceGoldK)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => purchasePlan(plan.months, plan.days, "usd")}
                    className="py-2 px-3 rounded-xl border border-white/10 hover:border-[#00ffff]/40 hover:bg-[#00ffff]/5 text-left transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading === `${plan.months}-usd` ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <DollarSign className="w-3.5 h-3.5 text-[#00ffff]" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-300">
                          Pay {plan.priceUsd}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => purchasePlan(plan.months, plan.days, "gold")}
                    className="py-2 px-3 rounded-xl border border-white/10 hover:border-yellow-400/40 hover:bg-yellow-400/5 text-left transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading === `${plan.months}-gold` ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-300">
                          Pay {formatGoldPrice(plan.priceGoldK)}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-[8px] text-gray-600 text-center font-bold uppercase tracking-widest pt-2">
              Paid plans open a support ticket for payment
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
