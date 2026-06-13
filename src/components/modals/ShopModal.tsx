"use client";

import { motion } from "framer-motion";
import { X, Crown, Check, Loader2, Circle } from "lucide-react";
import { useEffect, useState } from "react";

const PLANS = [
  { months: 1, label: "1 Month", price: "$9.99", days: 30 },
  { months: 2, label: "2 Months", price: "$17.99", days: 60, badge: "Best Value" },
  { months: 3, label: "3 Months", price: "$24.99", days: 90 },
];

const PERKS = [
  "Community Club access",
  "Profile GIF & banner",
  "Avatar effects",
  "Lobby VFX & banners",
  "Auto-apply & hidden identity",
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ShopModal({ isOpen, onClose }: Props) {
  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMonths(null);
      setDone(null);
      setLoading(false);
    }
  }, [isOpen]);

  const selectedPlan = PLANS.find((p) => p.months === selectedMonths) ?? null;

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setDone(null);
    try {
      const res = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: selectedPlan.months, days: selectedPlan.days }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(`Request sent! Check Support ticket #${data.ticketId?.slice(-6) || ""} for payment details.`);
      } else {
        alert(data.error || "Failed to create purchase request");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-gradient-to-br from-[#0a0a16] to-black border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <Crown className="w-5 h-5 text-yellow-400" />
          <div className="flex-1">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Secret Club Shop</h2>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Select a plan, then purchase</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <ul className="space-y-1.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                <Check className="w-3.5 h-3.5 text-[#00ffff] shrink-0" />
                {p}
              </li>
            ))}
          </ul>

          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Choose membership</p>

          <div className="space-y-2">
            {PLANS.map((plan) => {
              const isSelected = selectedMonths === plan.months;
              return (
                <button
                  key={plan.months}
                  type="button"
                  onClick={() => setSelectedMonths(plan.months)}
                  className={`w-full p-4 rounded-2xl border text-left transition relative ${
                    isSelected
                      ? "border-[#00ffff]/60 bg-[#00ffff]/10 shadow-[0_0_20px_rgba(0,255,255,0.12)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-widest bg-white/10 text-gray-400 px-2 py-0.5 rounded-full border border-white/10">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                        isSelected ? "border-[#00ffff] bg-[#00ffff]/20" : "border-white/20"
                      }`}
                    >
                      {isSelected ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00ffff]" />
                      ) : (
                        <Circle className="w-3 h-3 text-transparent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white">{plan.label}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Secret Club</p>
                    </div>
                    <span className={`text-lg font-black shrink-0 ${isSelected ? "text-[#00ffff]" : "text-white/80"}`}>
                      {plan.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!selectedPlan || loading}
            onClick={handlePurchase}
            className="w-full py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : selectedPlan ? (
              <>Purchase — {selectedPlan.label} ({selectedPlan.price})</>
            ) : (
              "Select a plan to purchase"
            )}
          </button>

          {done && (
            <p className="text-[10px] text-green-400 font-bold text-center py-2 bg-green-500/10 rounded-xl border border-green-500/20">
              {done}
            </p>
          )}

          <p className="text-[8px] text-gray-600 text-center font-bold uppercase tracking-widest">
            Payment handled via Support ticket
          </p>
        </div>
      </motion.div>
    </div>
  );
}
