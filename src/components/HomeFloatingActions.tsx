"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ShoppingBag,
  Star,
  MessageCircle,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import ShopModal from "@/components/modals/ShopModal";
import ReviewsModal from "@/components/modals/ReviewsModal";

type DockItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentGlow: string;
  onClick: () => void;
  badge?: number;
  active?: boolean;
};

type Props = {
  onOpenSupport: () => void;
  onOpenClubLounge?: () => void;
  onOpenPostRequest?: () => void;
  supportUnread?: number;
  supportOpen?: boolean;
  loungeOpen?: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
};

export default function HomeFloatingActions({
  onOpenSupport,
  onOpenClubLounge,
  onOpenPostRequest,
  supportUnread = 0,
  supportOpen = false,
  loungeOpen = false,
  currentUserId = "",
  isAdmin = false,
}: Props) {
  const { data: session, status } = useSession();
  const [shopOpen, setShopOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  if (status !== "authenticated" || !session?.user) return null;

  const items: DockItem[] = [
    {
      id: "lounge",
      label: "Community Chat",
      icon: MessageCircle,
      accentText: "text-[#00ffff]",
      accentBg: "bg-[#00ffff]/10",
      accentBorder: "border-[#00ffff]/35",
      accentGlow: "shadow-[0_0_18px_rgba(0,255,255,0.18)]",
      onClick: () => onOpenClubLounge?.(),
      active: loungeOpen,
    },
    {
      id: "post-request",
      label: "Post Request",
      icon: Megaphone,
      accentText: "text-[#ff007f]",
      accentBg: "bg-[#ff007f]/10",
      accentBorder: "border-[#ff007f]/35",
      accentGlow: "shadow-[0_0_18px_rgba(255,0,127,0.18)]",
      onClick: () => onOpenPostRequest?.(),
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: Star,
      accentText: "text-amber-400",
      accentBg: "bg-amber-500/10",
      accentBorder: "border-amber-500/30",
      accentGlow: "shadow-[0_0_18px_rgba(245,158,11,0.14)]",
      onClick: () => setReviewsOpen(true),
    },
    {
      id: "shop",
      label: "Shop",
      icon: ShoppingBag,
      accentText: "text-violet-400",
      accentBg: "bg-violet-500/10",
      accentBorder: "border-violet-500/30",
      accentGlow: "shadow-[0_0_18px_rgba(139,92,246,0.14)]",
      onClick: () => setShopOpen(true),
    },
    {
      id: "support",
      label: "Support",
      icon: MessageSquare,
      accentText: "text-yellow-400",
      accentBg: "bg-yellow-500/10",
      accentBorder: "border-yellow-500/35",
      accentGlow: "shadow-[0_0_18px_rgba(255,215,0,0.16)]",
      onClick: onOpenSupport,
      badge: supportUnread,
      active: supportOpen,
    },
  ];

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        aria-label="Quick actions"
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[9999] w-[min(15.5rem,calc(100vw-2rem))]"
      >
        <div className="rounded-2xl border border-white/10 bg-[#0a0a16]/94 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent">
            <p className="text-[8px] font-black uppercase tracking-[0.28em] text-gray-500">
              Quick Access
            </p>
          </div>

          <div className="p-1.5 flex flex-col gap-1">
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.985 }}
                onClick={item.onClick}
                aria-current={item.active ? "true" : undefined}
                className={`group relative w-full flex items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-all ${
                  item.active
                    ? `${item.accentBg} ${item.accentBorder} ${item.accentGlow}`
                    : "border-transparent bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                }`}
              >
                <span
                  className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-opacity ${
                    item.active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                  } ${item.accentBg.replace("/10", "")}`}
                  style={{
                    background:
                      item.id === "lounge"
                        ? "#00ffff"
                        : item.id === "post-request"
                          ? "#ff007f"
                          : item.id === "reviews"
                            ? "#f59e0b"
                            : item.id === "shop"
                              ? "#8b5cf6"
                              : "#eab308",
                  }}
                />

                <span
                  className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center transition-colors ${
                    item.active
                      ? `${item.accentBg} ${item.accentBorder}`
                      : "bg-black/30 border-white/10 group-hover:border-white/20"
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 ${
                      item.active ? item.accentText : "text-gray-300 group-hover:text-white"
                    }`}
                  />
                </span>

                <span
                  className={`flex-1 min-w-0 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.14em] truncate ${
                    item.active ? "text-white" : "text-gray-300 group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>

                {!!item.badge && item.badge > 0 && (
                  <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-md bg-red-500 text-[9px] font-black text-white flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.nav>

      <ShopModal isOpen={shopOpen} onClose={() => setShopOpen(false)} />
      <ReviewsModal
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </>
  );
}
