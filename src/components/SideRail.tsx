"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Radio, Bot, TicketCheck, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useSideRailOpen } from "@/hooks/useSideRailOpen";
import { getDiscordInviteUrl } from "@/lib/discordConstants";

export default function SideRail() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { open, toggleRail } = useSideRailOpen();

  const railBtn =
    "h-11 w-11 sm:h-12 sm:w-12 rounded-2xl border border-white/10 bg-[#080810]/85 backdrop-blur-xl flex items-center justify-center transition-all hover:scale-110 shadow-[0_0_18px_rgba(0,0,0,0.35)]";

  const railLabelBtn =
    "h-10 inline-flex items-center gap-2 rounded-xl border px-4 font-black uppercase text-[10px] tracking-widest transition-all";

  return (
    <div className="fixed left-3 sm:left-5 top-1/2 z-[70] -translate-y-1/2">
      <button
        type="button"
        onClick={toggleRail}
        title={open ? t("sr_collapse") || "Collapse" : t("sr_expand") || "Expand"}
        aria-label={open ? t("sr_collapse") || "Collapse" : t("sr_expand") || "Expand"}
        aria-expanded={open}
        className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl border border-white/10 bg-[#080810]/85 backdrop-blur-xl flex items-center justify-center text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all hover:scale-110 shadow-[0_0_18px_rgba(0,0,0,0.35)]"
      >
        {open ? (
          <PanelLeftClose className="w-5 h-5" />
        ) : (
          <PanelLeftOpen className="w-5 h-5" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="rail-items"
            initial={{ opacity: 0, x: -16, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mt-2.5 flex flex-col items-start gap-2.5"
          >
            <button
              type="button"
              title={t("sr_chat") || "Global Chat"}
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-global-chat"))}
              className={`${railBtn} text-[#00ffff] border-[#00ffff]/25 hover:bg-[#00ffff]/10 hover:shadow-[0_0_20px_rgba(0,255,255,0.25)]`}
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            <button
              type="button"
              title={t("sr_online") || "Online"}
              onClick={() => window.dispatchEvent(new CustomEvent("open-online"))}
              className={`${railBtn} relative text-green-400 border-green-500/25 hover:bg-green-500/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]`}
            >
              <Radio className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#050814]">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
                <span className="absolute inset-0 rounded-full bg-green-400" />
              </span>
            </button>

            <a
              href={getDiscordInviteUrl()}
              target="_blank"
              rel="noopener noreferrer"
              title={t("nav_discord") || "Join our Discord"}
              aria-label={t("nav_discord") || "Join our Discord"}
              className={`${railLabelBtn} border-[#5865F2]/40 bg-[#5865F2]/15 text-[#aab8ff] hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2]`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4 shrink-0">
                <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              {t("nav_discord") || "Discord"}
            </a>

            <a
              href="/support"
              title={t("sr_tickets") || "Support Tickets"}
              aria-label={t("sr_tickets") || "Support Tickets"}
              className={`${railLabelBtn} gap-1.5 ${pathname === "/support" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-black border border-yellow-500/30"}`}
            >
              <TicketCheck className="w-4 h-4 shrink-0" />
              {t("sr_support") || "Support"}
            </a>

            <button
              type="button"
              title={t("sr_assistant") || "Assistant"}
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-assistant"))}
              className={`${railBtn} ${pathname === "/assistant" ? "bg-violet-500/20 border-violet-500/50 text-violet-300" : "text-violet-400 border-violet-500/25 hover:bg-violet-500/10 hover:shadow-[0_0_20px_rgba(167,139,250,0.25)]"}`}
            >
              <Bot className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
