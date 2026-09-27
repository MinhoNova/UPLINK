"use client";

import { usePathname } from "next/navigation";
import { MessageCircle, Radio, Bot, TicketCheck } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { getDiscordInviteUrl } from "@/lib/discordConstants";

export default function SideRail() {
  const { t } = useI18n();
  const pathname = usePathname();

  const chip =
    "group relative inline-flex h-11 items-center gap-2 rounded-2xl border px-3 font-black uppercase text-[10px] tracking-widest transition-all duration-200";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 sm:bottom-5">
      <nav
        aria-label="Quick actions"
        className="pointer-events-auto flex items-center gap-1 rounded-[26px] border border-white/10 bg-[#080810]/85 p-1.5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
      >
        <button
          type="button"
          title={t("sr_chat") || "Global Chat"}
          aria-label={t("sr_chat") || "Global Chat"}
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-global-chat"))}
          className={`${chip} border-[#00ffff]/30 bg-[#00ffff]/10 text-[#00ffff] hover:bg-[#00ffff] hover:text-black hover:border-[#00ffff] hover:shadow-[0_0_22px_rgba(0,255,255,0.35)]`}
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">{t("sr_chat") || "Global Chat"}</span>
        </button>

        <button
          type="button"
          title={t("sr_onlineNow") || "Online Now"}
          aria-label={t("sr_onlineNow") || "Online Now"}
          onClick={() => window.dispatchEvent(new CustomEvent("open-online"))}
          className={`${chip} border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500 hover:shadow-[0_0_22px_rgba(34,197,94,0.35)]`}
        >
          <Radio className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">{t("sr_onlineNow") || "Online Now"}</span>
          <span className="relative w-2 h-2 rounded-full bg-green-400 md:order-last">
            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-70" />
          </span>
        </button>

        <a
          href={getDiscordInviteUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title={t("nav_discord") || "Join our Discord"}
          aria-label={t("nav_discord") || "Join our Discord"}
          className={`${chip} border-[#5865F2]/40 bg-[#5865F2]/15 text-[#aab8ff] hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] hover:shadow-[0_0_22px_rgba(88,101,242,0.45)]`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-4 h-4 shrink-0">
            <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span className="hidden md:inline">{t("nav_discord") || "Discord"}</span>
        </a>

        <span className="mx-0.5 h-7 w-px bg-white/10" />

        <a
          href="/support"
          title={t("sr_tickets") || "Support Tickets"}
          aria-label={t("sr_tickets") || "Support Tickets"}
          className={`${chip} ${pathname === "/support" ? "border-yellow-500/50 bg-yellow-500/20 text-yellow-300" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-black hover:border-yellow-500 hover:shadow-[0_0_22px_rgba(234,179,8,0.4)]"}`}
        >
          <TicketCheck className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">{t("sr_support") || "Support"}</span>
        </a>

        <button
          type="button"
          title={t("sr_assistant") || "Assistant"}
          aria-label={t("sr_assistant") || "Assistant"}
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-assistant"))}
          className={`${chip} ${pathname === "/assistant" ? "border-violet-500/50 bg-violet-500/20 text-violet-300" : "border-violet-500/25 bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white hover:border-violet-500 hover:shadow-[0_0_22px_rgba(167,139,250,0.35)]"}`}
        >
          <Bot className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">{t("sr_assistant") || "Assistant"}</span>
        </button>
      </nav>
    </div>
  );
}
