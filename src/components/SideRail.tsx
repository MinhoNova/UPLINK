"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Radio, Bot, TicketCheck, MoreHorizontal } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { getDiscordInviteUrl } from "@/lib/discordConstants";

export default function SideRail() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed left-0 top-1/2 z-[70] hidden -translate-y-1/2 lg:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <motion.nav
        aria-label="Quick actions"
        animate={{ width: open ? 200 : 76 }}
        transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.7 }}
        className="flex flex-col items-start gap-1 overflow-hidden rounded-r-3xl border border-l-0 border-white/10 bg-[#080810]/85 p-2 backdrop-blur-2xl shadow-[8px_0_36px_rgba(0,0,0,0.45)]"
      >
        <div className="flex h-10 w-full shrink-0 items-center gap-2.5 pl-1 pr-2">
          <MoreHorizontal className="w-[18px] h-[18px] shrink-0 text-slate-400" />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.14 }}
                className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.2em] text-slate-500"
              >
                {t("sr_menu") || "Menu"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <span className="h-px w-full shrink-0 bg-white/10" />

        <RailItem
          open={open}
          icon={<MessageCircle className="w-[18px] h-[18px]" />}
          label={t("sr_chat") || "Global Chat"}
          tone="cyan"
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-global-chat"))}
        />

        <RailItem
          open={open}
          icon={
            <span className="relative">
              <Radio className="w-[18px] h-[18px]" />
              <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-green-400">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-70" />
              </span>
            </span>
          }
          label={t("sr_onlineNow") || "Online Now"}
          tone="green"
          onClick={() => window.dispatchEvent(new CustomEvent("open-online"))}
        />

        <RailItem
          open={open}
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-[18px] h-[18px]">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          }
          label={t("nav_discord") || "Discord"}
          tone="discord"
          href={getDiscordInviteUrl()}
        />

        <span className="h-px w-full shrink-0 bg-white/10" />

        <RailItem
          open={open}
          icon={<TicketCheck className="w-[18px] h-[18px]" />}
          label={t("sr_support") || "Support"}
          tone="yellow"
          href="/support"
          active={pathname === "/support"}
        />

        <RailItem
          open={open}
          icon={<Bot className="w-[18px] h-[18px]" />}
          label={t("sr_assistant") || "Assistant"}
          tone="violet"
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-assistant"))}
          active={pathname === "/assistant"}
        />
      </motion.nav>

      <MobileBar
        chatLabel={t("sr_chat") || "Global Chat"}
        onlineLabel={t("sr_onlineNow") || "Online Now"}
        discordLabel={t("nav_discord") || "Discord"}
        supportLabel={t("sr_support") || "Support"}
        assistantLabel={t("sr_assistant") || "Assistant"}
        supportActive={pathname === "/support"}
        assistantActive={pathname === "/assistant"}
        discordUrl={getDiscordInviteUrl()}
      />
    </div>
  );
}

function MobileBar({
  chatLabel,
  onlineLabel,
  discordLabel,
  supportLabel,
  assistantLabel,
  supportActive,
  assistantActive,
  discordUrl,
}: {
  chatLabel: string;
  onlineLabel: string;
  discordLabel: string;
  supportLabel: string;
  assistantLabel: string;
  supportActive: boolean;
  assistantActive: boolean;
  discordUrl: string;
}) {
  const dot =
    "h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-200";

  return (
    <nav
      aria-label="Quick actions"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 lg:hidden"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-[26px] border border-white/10 bg-[#080810]/85 p-1.5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          title={chatLabel}
          aria-label={chatLabel}
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-global-chat"))}
          className={`${dot} flex border-[#00ffff]/30 bg-[#00ffff]/10 text-[#00ffff]`}
        >
          <MessageCircle className="w-[18px] h-[18px]" />
        </button>

        <button
          type="button"
          title={onlineLabel}
          aria-label={onlineLabel}
          onClick={() => window.dispatchEvent(new CustomEvent("open-online"))}
          className={`${dot} flex border-green-500/30 bg-green-500/10 text-green-400`}
        >
          <span className="relative">
            <Radio className="w-[18px] h-[18px]" />
            <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-green-400">
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-70" />
            </span>
          </span>
        </button>

        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={discordLabel}
          aria-label={discordLabel}
          className={`${dot} flex border-[#5865F2]/40 bg-[#5865F2]/15 text-[#aab8ff]`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-[18px] h-[18px]">
            <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </a>

        <span className="mx-0.5 h-7 w-px bg-white/10" />

        <a
          href="/support"
          title={supportLabel}
          aria-label={supportLabel}
          className={`${dot} flex ${supportActive ? "border-yellow-500/50 bg-yellow-500/20 text-yellow-300" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"}`}
        >
          <TicketCheck className="w-[18px] h-[18px]" />
        </a>

        <button
          type="button"
          title={assistantLabel}
          aria-label={assistantLabel}
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-assistant"))}
          className={`${dot} flex ${assistantActive ? "border-violet-500/50 bg-violet-500/20 text-violet-300" : "border-violet-500/25 bg-violet-500/10 text-violet-400"}`}
        >
          <Bot className="w-[18px] h-[18px]" />
        </button>
      </div>
    </nav>
  );
}

type Tone = "cyan" | "green" | "discord" | "yellow" | "violet";

const tones: Record<Tone, string> = {
  cyan: "text-[#00ffff] hover:bg-[#00ffff]/15 hover:border-[#00ffff]/50",
  green: "text-green-400 hover:bg-green-500/15 hover:border-green-500/50",
  discord: "text-[#aab8ff] hover:bg-[#5865F2]/20 hover:border-[#5865F2]/60",
  yellow: "text-yellow-400 hover:bg-yellow-500/15 hover:border-yellow-500/50",
  violet: "text-violet-400 hover:bg-violet-500/15 hover:border-violet-500/50",
};

const activeTones: Record<Tone, string> = {
  cyan: "bg-[#00ffff]/20 border-[#00ffff]/60",
  green: "bg-green-500/20 border-green-500/60",
  discord: "bg-[#5865F2]/25 border-[#5865F2]/70",
  yellow: "bg-yellow-500/20 border-yellow-500/50",
  violet: "bg-violet-500/20 border-violet-500/50",
};

function RailItem({
  icon,
  label,
  tone,
  href,
  active,
  open,
  onClick,
}: {
  open: boolean;
  icon: React.ReactNode;
  label: string;
  tone: Tone;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = `group relative flex h-11 w-full shrink-0 items-center gap-2.5 rounded-2xl border border-transparent pl-2.5 pr-2 transition-colors duration-200 ${
    active ? activeTones[tone] : tones[tone]
  }`;

  const inner = (
    <>
      <span className="flex w-[18px] shrink-0 items-center justify-center">{icon}</span>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.14 }}
            className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} title={label} className={className}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} title={label} className={className}>
      {inner}
    </button>
  );
}
