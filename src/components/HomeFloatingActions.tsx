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
import { getDiscordInviteUrl } from "@/lib/discordConstants";
import ShopModal from "@/components/modals/ShopModal";
import ReviewsModal from "@/components/modals/ReviewsModal";

type DockItem = {
  id: string;
  label: string;
  icon: LucideIcon | "discord";
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentGlow: string;
  onClick: () => void;
  badge?: number;
  active?: boolean;
};

function DiscordGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

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

  const openDiscord = () => {
    window.open(getDiscordInviteUrl(), "_blank", "noopener,noreferrer");
    void fetch("/api/discord/sync-member", { method: "POST", credentials: "include" }).catch(
      () => {}
    );
  };

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
      id: "discord",
      label: "Join Discord",
      icon: "discord",
      accentText: "text-[#5865F2]",
      accentBg: "bg-[#5865F2]/10",
      accentBorder: "border-[#5865F2]/35",
      accentGlow: "shadow-[0_0_18px_rgba(88,101,242,0.2)]",
      onClick: openDiscord,
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
                        : item.id === "discord"
                          ? "#5865F2"
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
                  {item.icon === "discord" ? (
                    <DiscordGlyph
                      className={`w-4 h-4 ${
                        item.active ? item.accentText : "text-[#5865F2] group-hover:text-white"
                      }`}
                    />
                  ) : (
                    <item.icon
                      className={`w-4 h-4 ${
                        item.active ? item.accentText : "text-gray-300 group-hover:text-white"
                      }`}
                    />
                  )}
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
