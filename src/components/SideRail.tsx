"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Radio, Bot, TicketCheck, PanelLeftOpen, X } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useSideRailOpen } from "@/hooks/useSideRailOpen";
import { getDiscordInviteUrl } from "@/lib/discordConstants";

export default function SideRail() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { open, toggleRail } = useSideRailOpen();
  const [hovered, setHovered] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const expanded = open || hovered;

  type Tone = {
    base: string;
    active?: string;
  };

  const tones: Record<string, Tone> = {
    chat: { base: "text-[#00ffff] border-[#00ffff]/30 hover:bg-[#00ffff]/15" },
    online: { base: "text-green-400 border-green-500/30 hover:bg-green-500/15" },
    discord: { base: "text-[#aab8ff] border-[#5865F2]/40 hover:bg-[#5865F2]/20" },
    support: {
      base: "text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/15",
      active: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
    },
    assistant: {
      base: "text-violet-400 border-violet-500/25 hover:bg-violet-500/15",
      active: "bg-violet-500/20 text-violet-300 border-violet-500/50",
    },
  };

  const shell =
    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-200";
  const label =
    "whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-opacity duration-150";

  return (
    <div
      className="fixed left-3 top-1/2 z-[70] -translate-y-1/2 sm:left-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setActiveId(null);
      }}
    >
      <div
        className={`flex flex-col items-start rounded-3xl border border-white/10 bg-[#080810]/80 p-1.5 backdrop-blur-xl shadow-[0_0_28px_rgba(0,0,0,0.5)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${expanded ? "w-[196px]" : "w-[56px]"}`}
      >
        {/* Grip */}
        <button
          type="button"
          onClick={toggleRail}
          title={open ? t("sr_collapse") || "Collapse" : t("sr_expand") || "Expand"}
          aria-label={open ? t("sr_collapse") || "Collapse" : t("sr_expand") || "Expand"}
          aria-expanded={open}
          className="group/grip relative mb-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors duration-200 hover:bg-white/5 hover:text-cyan-300"
        >
          {open ? (
            <X className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
          <span className="absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 bg-current opacity-0 transition-opacity duration-200 group-hover/grip:opacity-40" />
        </button>

        <div className="h-px w-full bg-white/10" />

        {/* Chat */}
        <div className="relative mt-1.5">
          <ActiveGlow show={expanded && activeId === "chat"} />
          <button
            type="button"
            title={t("sr_chat") || "Global Chat"}
            aria-label={t("sr_chat") || "Global Chat"}
            onClick={() => {
              setActiveId(activeId === "chat" ? null : "chat");
              window.dispatchEvent(new CustomEvent("toggle-global-chat"));
            }}
            onFocus={() => setActiveId("chat")}
            className={`${shell} ${tones.chat.base} ${activeId === "chat" && expanded ? "bg-[#00ffff]/20 border-[#00ffff]/60" : ""}`}
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`${label} absolute left-full ml-2.5 text-[#00ffff] pointer-events-none`}
                >
                  {t("sr_chat") || "Global Chat"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Online */}
        <div className="relative">
          <ActiveGlow show={expanded && activeId === "online"} />
          <button
            type="button"
            title={t("sr_onlineNow") || "Online Now"}
            aria-label={t("sr_onlineNow") || "Online Now"}
            onClick={() => {
              setActiveId(activeId === "online" ? null : "online");
              window.dispatchEvent(new CustomEvent("open-online"));
            }}
            onFocus={() => setActiveId("online")}
            className={`${shell} ${tones.online.base} ${activeId === "online" && expanded ? "bg-green-500/20 border-green-500/60" : ""}`}
          >
            <span className="relative">
              <Radio className="w-[18px] h-[18px]" />
              <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-green-400">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-70" />
              </span>
            </span>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`${label} absolute left-full ml-2.5 text-green-400 pointer-events-none flex items-center gap-1.5`}
                >
                  {t("sr_onlineNow") || "Online Now"}
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Discord */}
        <div className="relative">
          <ActiveGlow show={expanded && activeId === "discord"} />
          <a
            href={getDiscordInviteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title={t("nav_discord") || "Join our Discord"}
            aria-label={t("nav_discord") || "Join our Discord"}
            onMouseEnter={() => setActiveId("discord")}
            onFocus={() => setActiveId("discord")}
            className={`${shell} ${tones.discord.base} ${activeId === "discord" && expanded ? "bg-[#5865F2]/25 border-[#5865F2]/70" : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-[18px] h-[18px]">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`${label} absolute left-full ml-2.5 text-[#aab8ff] pointer-events-none`}
                >
                  {t("nav_discord") || "Discord"}
                </motion.span>
              )}
            </AnimatePresence>
          </a>
        </div>

        <div className="h-px w-full bg-white/10 my-1.5" />

        {/* Support */}
        <div className="relative">
          <ActiveGlow show={pathname === "/support"} />
          <a
            href="/support"
            title={t("sr_tickets") || "Support Tickets"}
            aria-label={t("sr_tickets") || "Support Tickets"}
            onMouseEnter={() => setActiveId("support")}
            onFocus={() => setActiveId("support")}
            className={`${shell} ${pathname === "/support" ? tones.support.active : tones.support.base} ${activeId === "support" && expanded && pathname !== "/support" ? "bg-yellow-500/20 border-yellow-500/60" : ""}`}
          >
            <TicketCheck className="w-[18px] h-[18px]" />
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`${label} absolute left-full ml-2.5 ${pathname === "/support" ? "text-yellow-300" : "text-yellow-400"} pointer-events-none`}
                >
                  {t("sr_support") || "Support"}
                </motion.span>
              )}
            </AnimatePresence>
          </a>
        </div>

        {/* Assistant */}
        <div className="relative">
          <ActiveGlow show={pathname === "/assistant"} />
          <button
            type="button"
            title={t("sr_assistant") || "Assistant"}
            aria-label={t("sr_assistant") || "Assistant"}
            onClick={() => {
              setActiveId(activeId === "assistant" ? null : "assistant");
              window.dispatchEvent(new CustomEvent("toggle-assistant"));
            }}
            onFocus={() => setActiveId("assistant")}
            className={`${shell} ${pathname === "/assistant" ? tones.assistant.active : tones.assistant.base} ${activeId === "assistant" && expanded && pathname !== "/assistant" ? "bg-violet-500/20 border-violet-500/60" : ""}`}
          >
            <Bot className="w-[18px] h-[18px]" />
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`${label} absolute left-full ml-2.5 ${pathname === "/assistant" ? "text-violet-300" : "text-violet-400"} pointer-events-none`}
                >
                  {t("sr_assistant") || "Assistant"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveGlow({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, scaleY: 0.4 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0.4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
        />
      )}
    </AnimatePresence>
  );
}
