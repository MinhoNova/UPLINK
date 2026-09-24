"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Radio, Bot, TicketCheck, ExternalLink, Send } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

export default function SideRail() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [supportOpen, setSupportOpen] = useState(false);

  const railBtn =
    "h-11 w-11 sm:h-12 sm:w-12 rounded-2xl border border-white/10 bg-[#080810]/85 backdrop-blur-xl flex items-center justify-center transition-all hover:scale-110 shadow-[0_0_18px_rgba(0,0,0,0.35)]";

  return (
    <div className="fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-[70] flex flex-col items-center gap-2.5">
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

      <div className="relative">
        <button
          type="button"
          title={t("sr_support") || "Support"}
          onClick={() => setSupportOpen((v) => !v)}
          onBlur={() => setTimeout(() => setSupportOpen(false), 150)}
          className={`${railBtn} ${supportOpen ? "bg-yellow-500/15 border-yellow-500/50 text-yellow-300" : "text-yellow-400 border-yellow-500/25 hover:bg-yellow-500/10 hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]"}`}
        >
          <TicketCheck className="w-5 h-5" />
        </button>
        {supportOpen && (
          <div className="absolute left-full ml-3 top-0 w-56 rounded-2xl border border-white/10 bg-[#0a0a16]/95 backdrop-blur-xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <a href="/support" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-yellow-300 transition hover:bg-yellow-500/10">
              <TicketCheck className="w-4 h-4" /> {t("sr_tickets") || "Support Tickets"}
            </a>
            <a href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/aion2lfg"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#aab8ff] transition hover:bg-[#5865F2]/10">
              <ExternalLink className="w-4 h-4" /> discord.gg
            </a>
            <a href="/contact" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-300 transition hover:bg-white/5">
              <Send className="w-4 h-4" /> {t("nav_contact") || "Contact"}
            </a>
          </div>
        )}
      </div>

      <button
        type="button"
        title={t("sr_assistant") || "Assistant"}
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-assistant"))}
        className={`${railBtn} ${pathname === "/assistant" ? "bg-violet-500/20 border-violet-500/50 text-violet-300" : "text-violet-400 border-violet-500/25 hover:bg-violet-500/10 hover:shadow-[0_0_20px_rgba(167,139,250,0.25)]"}`}
      >
        <Bot className="w-5 h-5" />
      </button>
    </div>
  );
}