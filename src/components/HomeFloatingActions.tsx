"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MessageSquare, ShoppingBag, Star, MessageCircle } from "lucide-react";
import ShopModal from "@/components/modals/ShopModal";
import ReviewsModal from "@/components/modals/ReviewsModal";

type Props = {
  onOpenSupport: () => void;
  onOpenClubLounge?: () => void;
  supportUnread?: number;
  currentUserId?: string;
  isAdmin?: boolean;
};

export default function HomeFloatingActions({
  onOpenSupport,
  onOpenClubLounge,
  supportUnread = 0,
  currentUserId = "",
  isAdmin = false,
}: Props) {
  const { data: session, status } = useSession();
  const [shopOpen, setShopOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  if (status !== "authenticated" || !session?.user) return null;

const buttons = [
    {
      id: "lounge",
      label: "Live Chat",
      icon: MessageCircle,
      color: "from-[#00ffff] via-[#8a2be2] to-[#ff007f]",
      shadow: "rgba(0,255,255,0.3)",
      onClick: () => onOpenClubLounge?.(),
      badge: 0,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: Star,
      color: "from-amber-500 to-orange-500",
      shadow: "rgba(245,158,11,0.3)",
      onClick: () => setReviewsOpen(true),
      badge: 0,
    },
    {
      id: "shop",
      label: "Shop",
      icon: ShoppingBag,
      color: "from-purple-500 to-violet-600",
      shadow: "rgba(139,92,246,0.3)",
      onClick: () => setShopOpen(true),
      badge: 0,
    },
    {
      id: "support",
      label: "Support",
      icon: MessageSquare,
      color: "from-yellow-500 to-yellow-600",
      shadow: "rgba(255,215,0,0.3)",
      onClick: onOpenSupport,
      badge: supportUnread,
    },
  ];

  return (
    <>
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[9999] flex flex-col-reverse items-start gap-2 sm:gap-3">
        {buttons.map((btn, i) => (
          <motion.button
            key={btn.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={btn.onClick}
            title={btn.label}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${btn.color} text-black flex items-center justify-center relative group shadow-[0_0_30px_rgba(0,0,0,0.2)]`}
          >
            <btn.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            {btn.badge > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0a0a16] flex items-center justify-center text-[8px] font-black text-white">
                {btn.badge}
              </div>
            )}
            <span className="absolute left-full ml-3 px-2 py-1 bg-black/80 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
              {btn.label}
            </span>
          </motion.button>
        ))}
      </div>

      <ShopModal isOpen={shopOpen} onClose={() => setShopOpen(false)} />
      <ReviewsModal isOpen={reviewsOpen} onClose={() => setReviewsOpen(false)} currentUserId={currentUserId} isAdmin={isAdmin} />
    </>
  );
}
