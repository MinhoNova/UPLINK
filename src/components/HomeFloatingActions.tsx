"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ShoppingBag,
  Star,
  MessageCircle,
  TrendingUp,
  BookOpen,
  Package,
  type LucideIcon,
} from "lucide-react";
import { getDiscordInviteUrl } from "@/lib/discordConstants";

type DockItem = {
  id: string;
  label: string;
  icon: LucideIcon | "discord";
  accentText: string;
  accentBar: string;
  iconBg: string;
  iconBorder: string;
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
  supportUnread?: number;
  supportOpen?: boolean;
  loungeOpen?: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
};

const ACCENT_COLORS: Record<string, { text: string; bar: string; bg: string; border: string }> = {
  lounge: { text: "text-[#00ffff]", bar: "bg-[#00ffff]", bg: "bg-[#00ffff]/8", border: "border-[#00ffff]/25" },
  discord: { text: "text-[#5865F2]", bar: "bg-[#5865F2]", bg: "bg-[#5865F2]/8", border: "border-[#5865F2]/25" },
  "post-request": { text: "text-amber-400", bar: "bg-amber-400", bg: "bg-amber-400/8", border: "border-amber-400/25" },
  reviews: { text: "text-amber-400", bar: "bg-amber-400", bg: "bg-amber-400/8", border: "border-amber-400/25" },
  shop: { text: "text-violet-400", bar: "bg-violet-400", bg: "bg-violet-400/8", border: "border-violet-400/25" },
  support: { text: "text-yellow-400", bar: "bg-yellow-400", bg: "bg-yellow-400/8", border: "border-yellow-400/25" },
  guides: { text: "text-emerald-400", bar: "bg-emerald-400", bg: "bg-emerald-400/8", border: "border-emerald-400/25" },
  addon: { text: "text-amber-400", bar: "bg-amber-400", bg: "bg-amber-400/8", border: "border-amber-400/25" },
};

export default function HomeFloatingActions({
  onOpenSupport,
  onOpenClubLounge,
  supportUnread = 0,
  supportOpen = false,
  loungeOpen = false,
  currentUserId = "",
  isAdmin = false,
}: Props) {
  const { data: session, status } = useSession();

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
      accentText: ACCENT_COLORS.lounge.text,
      accentBar: ACCENT_COLORS.lounge.bar,
      iconBg: ACCENT_COLORS.lounge.bg,
      iconBorder: ACCENT_COLORS.lounge.border,
      onClick: () => {},
    },
    {
      id: "discord",
      label: "Join Discord",
      icon: "discord",
      accentText: ACCENT_COLORS.discord.text,
      accentBar: ACCENT_COLORS.discord.bar,
      iconBg: ACCENT_COLORS.discord.bg,
      iconBorder: ACCENT_COLORS.discord.border,
      onClick: openDiscord,
    },
    {
      id: "post-request",
      label: "Boost Requests",
      icon: TrendingUp,
      accentText: ACCENT_COLORS["post-request"].text,
      accentBar: ACCENT_COLORS["post-request"].bar,
      iconBg: ACCENT_COLORS["post-request"].bg,
      iconBorder: ACCENT_COLORS["post-request"].border,
      onClick: () => {},
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: Star,
      accentText: ACCENT_COLORS.reviews.text,
      accentBar: ACCENT_COLORS.reviews.bar,
      iconBg: ACCENT_COLORS.reviews.bg,
      iconBorder: ACCENT_COLORS.reviews.border,
      onClick: () => {},
    },
    {
      id: "shop",
      label: "Shop",
      icon: ShoppingBag,
      accentText: ACCENT_COLORS.shop.text,
      accentBar: ACCENT_COLORS.shop.bar,
      iconBg: ACCENT_COLORS.shop.bg,
      iconBorder: ACCENT_COLORS.shop.border,
      onClick: () => {},
    },
    {
      id: "guides",
      label: "Guides",
      icon: BookOpen,
      accentText: ACCENT_COLORS.guides.text,
      accentBar: ACCENT_COLORS.guides.bar,
      iconBg: ACCENT_COLORS.guides.bg,
      iconBorder: ACCENT_COLORS.guides.border,
      onClick: () => {},
    },
    {
      id: "addon",
      label: "Addon",
      icon: Package,
      accentText: ACCENT_COLORS.addon.text,
      accentBar: ACCENT_COLORS.addon.bar,
      iconBg: ACCENT_COLORS.addon.bg,
      iconBorder: ACCENT_COLORS.addon.border,
      onClick: () => {},
    },
    {
      id: "support",
      label: "Support",
      icon: MessageSquare,
      accentText: ACCENT_COLORS.support.text,
      accentBar: ACCENT_COLORS.support.bar,
      iconBg: ACCENT_COLORS.support.bg,
      iconBorder: ACCENT_COLORS.support.border,
      onClick: onOpenSupport,
      badge: supportUnread,
      active: supportOpen,
    },
  ];

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        aria-label="Quick actions"
        className="fixed bottom-4 left-0 z-[9999] flex flex-col gap-0.5 pl-0"
      >
        {items.map((item, i) => {
          const btn = (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              onClick={item.onClick}
              aria-current={item.active ? "true" : undefined}
              className={`group relative flex items-center gap-2.5 pl-1 pr-3 py-2 text-left transition-all rounded-r-xl border-l-2 ${
                item.active
                  ? `${item.accentText} ${item.accentBar}/40 border-l-current bg-white/[0.04]`
                  : "text-white/40 border-l-transparent hover:text-white/80 hover:bg-white/[0.02] hover:border-l-current"
              }`}
            >
              <span
                className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-colors ${
                  item.active
                    ? `${item.iconBg} ${item.iconBorder}`
                    : `${item.iconBg.replace("/8", "/5")} ${item.iconBorder}`
                }`}
              >
                {item.icon === "discord" ? (
                  <DiscordGlyph
                    className={`w-3.5 h-3.5 ${
                      item.active ? item.accentText : `${item.accentText} opacity-60 group-hover:opacity-100`
                    }`}
                  />
                ) : (
                  <item.icon
                    className={`w-3.5 h-3.5 ${
                      item.active ? item.accentText : `${item.accentText} opacity-60 group-hover:opacity-100`
                    }`}
                  />
                )}
              </span>

              <span
                className={`flex-1 min-w-0 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] truncate ${
                  item.active ? "text-white" : "text-white/50 group-hover:text-white/80"
                }`}
              >
                {item.label}
              </span>

              {!!item.badge && item.badge > 0 && (
                <span className="shrink-0 min-w-[1rem] h-4 px-1 rounded-md bg-red-500 text-[8px] font-black text-white flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </motion.button>
          );

          if (item.id === "lounge") return <Link key={item.id} href="/community">{btn}</Link>;
          if (item.id === "reviews") return <Link key={item.id} href="/reviews">{btn}</Link>;
          if (item.id === "shop") return <Link key={item.id} href="/shop">{btn}</Link>;
          if (item.id === "post-request") return <Link key={item.id} href="/boosts">{btn}</Link>;
          if (item.id === "guides") return <Link key={item.id} href="/guides">{btn}</Link>;
          if (item.id === "addon") return <Link key={item.id} href="/addon">{btn}</Link>;
          return btn;
        })}
      </motion.nav>
    </>
  );
}
