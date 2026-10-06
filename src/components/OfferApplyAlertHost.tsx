"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, UserPlus, Loader2, ShieldCheck } from "lucide-react";
import { resolveProfileImage, profileImgClass, resolveNameColor } from "@/lib/profileImage";
import { notificationMatchesUser } from "@/lib/userProfile";
import CharacterPortraitBadge from "@/components/aion2/CharacterPortraitBadge";
import CharacterPowerStats from "@/components/aion2/CharacterPowerStats";
import { toNameStyle, nameGlowColor } from "@/lib/nameStyle";

interface PendingApply {
  notificationId: number;
  lobbyId: string;
  applicantId: string;
  title: string;
  applicantName: string;
  className?: string;
  level?: number;
  cpAp?: number;
  note?: string;
  avatar?: string;
  nameColor?: string | null;
  itemLevel?: number;
  /** The applicant's verified in-game character, stamped onto the applicant
   *  row by the apply route. Drives the NC-style portrait badge. */
  portraitUrl?: string;
  gameCharacterId?: string;
  characterName?: string;
  gameClassLabel?: string;
  serverName?: string;
  raceName?: string;
}

const SEEN_KEY = "offer-alert-seen";
const MAX_SEEN = 80;

function readSeen(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function OfferApplyAlertHost() {
  const { data: session, status } = useSession();
  const [queue, setQueue] = useState<PendingApply[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const seenRef = useRef<Record<string, number>>({});
  const dataSigRef = useRef("");

  const currentHandle = String((session?.user as { username?: string })?.username || "").toLowerCase();
  const currentUserId = String((session?.user as { id?: string })?.id || "");

  const playAlertSound = useCallback(() => {
    try {
      const audioUrl = "/Message.mp3";
      const audio = new Audio(audioUrl);
      audio.volume = 0.8;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setTimeout(() => {
            const audio2 = new Audio(audioUrl);
            audio2.volume = 0.8;
            audio2.play().catch(() => {});
          }, 100);
        });
      }
    } catch {}
  }, []);

  const markSeen = useCallback((notificationId: number) => {
    seenRef.current[String(notificationId)] = Date.now();
    const keys = Object.keys(seenRef.current);
    if (keys.length > MAX_SEEN) {
      const sorted = keys.sort((a, b) => seenRef.current[a] - seenRef.current[b]);
      for (const k of sorted.slice(0, sorted.length - MAX_SEEN)) delete seenRef.current[k];
    }
    localStorage.setItem(SEEN_KEY, JSON.stringify(seenRef.current));
  }, []);

  useEffect(() => {
    seenRef.current = { ...readSeen() };
  }, []);

  const scan = useCallback(
    (d: any) => {
      if (status !== "authenticated" || !currentHandle) return;
      const notifs: any[] = Array.isArray(d?.notifications) ? d.notifications : [];
      const users: any[] = Array.isArray(d?.registeredUsers) ? d.registeredUsers : [];
      const incoming: PendingApply[] = [];
      for (const n of notifs) {
        if (String(n?.type) !== "lobby_apply") continue;
        if (!notificationMatchesUser(n, currentUserId, currentHandle, users)) continue;
        const nid = Number(n?.id);
        if (!nid || seenRef.current[String(nid)]) continue;
        const app = n?.applicantData || {};
        const appUser = users.find((u: any) => String(u.id) === String(app.applicantId || app.id || ""));
        incoming.push({
          notificationId: nid,
          lobbyId: String(n?.lobbyId || ""),
          applicantId: String(app.applicantId || app.id || n?.applicantId || ""),
          title: String(n?.message || "New applicant"),
          applicantName: String(app.applicantName || n?.applicantName || app.name || "Operative").slice(0, 40),
          className: app.aionClass || app.className,
          level: Number(app.level) || 0,
          cpAp: Number(app.cpAp) || 0,
          note: String(app.applicantNote || "").slice(0, 200),
          avatar: app.applicantAvatar || n?.fromAvatar || (appUser ? resolveProfileImage(appUser) : ""),
          nameColor: appUser ? resolveNameColor(appUser) : "",
          itemLevel: Number(app.itemLevel) || 0,
          portraitUrl: app.portraitUrl ? String(app.portraitUrl) : "",
          gameCharacterId: app.gameCharacterId ? String(app.gameCharacterId) : "",
          characterName: app.characterName ? String(app.characterName).slice(0, 40) : "",
          gameClassLabel: app.gameClassLabel ? String(app.gameClassLabel) : "",
          serverName: app.serverName ? String(app.serverName) : "",
          raceName: app.raceName ? String(app.raceName) : "",
        });
      }
      if (incoming.length === 0) return;
      for (const a of incoming) markSeen(a.notificationId);
      setQueue((prev) => {
        const existing = new Set(prev.map((p) => p.notificationId));
        return [...prev, ...incoming.filter((a) => !existing.has(a.notificationId))].slice(0, 5);
      });
    },
    [status, currentHandle, currentUserId, markSeen]
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    const poll = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/data")
        .then((r) => r.json())
        .then((d: any) => {
          const sig = JSON.stringify(d?.notifications || []);
          if (sig === dataSigRef.current) return;
          dataSigRef.current = sig;
          scan(d);
        })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [status, scan]);

  useEffect(() => {
    if (queue.length === 0) return;
    playAlertSound();
  }, [queue.length, playAlertSound]);

  const act = async (a: PendingApply, action: "accept" | "decline") => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/lobbies/alert-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId: a.lobbyId, applicantId: a.applicantId, action, notificationId: a.notificationId }),
      });
      if (!res.ok) {
        const d: any = await res.json().catch(() => ({}));
        setError(d.error || "Action failed");
      } else {
        setQueue((prev) => prev.filter((p) => p.notificationId !== a.notificationId));
        window.dispatchEvent(new CustomEvent("data-refresh"));
      }
    } catch {
      setError("Network error, try again");
    } finally {
      setBusy(false);
    }
  };

  const current = queue[0];
  const imgSrc = current?.avatar || "";
  const nameStyle = current?.nameColor
    ? { ...toNameStyle(current.nameColor), textShadow: `0 0 16px ${nameGlowColor(current.nameColor)}88` }
    : { color: "#fff" };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={`offer-alert-${current.notificationId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-full max-w-sm rounded-3xl border border-violet-500/30 bg-[#0a0c1a]/95 shadow-[0_0_60px_rgba(139,92,246,0.25)] p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-fuchsia-300">
                <UserPlus className="w-3.5 h-3.5" /> New applicant
              </div>
              <button
                onClick={() => {
                  setQueue((prev) => prev.slice(1));
                  window.dispatchEvent(new CustomEvent("data-refresh"));
                }}
                disabled={busy}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-50"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              {/* The applicant's real in-game character, NC-style, with the class
                  emblem riding the portrait's edge — the same badge the thread
                  and the lobby use. Falls back to the site avatar for a player
                  who has not linked a character. */}
              {current.portraitUrl && current.gameCharacterId ? (
                <CharacterPortraitBadge
                  src={current.portraitUrl}
                  aionClass={current.gameClassLabel || current.className || "dps"}
                  level={current.level}
                  size="md"
                  fallback={current.applicantName}
                />
              ) : (
                <span className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 ${profileImgClass(imgSrc)}`}>
                  {imgSrc ? (
                    <img src={imgSrc} alt={current.applicantName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-violet-500/20 text-lg font-black text-violet-200">
                      {current.applicantName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white" style={nameStyle}>{current.applicantName}</p>
                {current.characterName ? (
                  <p className="truncate text-[10px] font-bold text-cyan-200/90">{current.characterName}</p>
                ) : null}
                <p className="mt-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {current.gameClassLabel || current.className || "Unknown class"}
                  {(current.level ?? 0) > 0 && <span>· Lv {current.level}</span>}
                  {(current.cpAp ?? 0) > 0 && <span>· CP {current.cpAp!.toLocaleString()}</span>}
                </p>
                {current.serverName || current.raceName ? (
                  <p className="truncate text-[8px] font-bold uppercase tracking-widest text-slate-500">
                    {[current.raceName, current.serverName].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {current.itemLevel || current.cpAp ? (
                  <CharacterPowerStats
                    combatPower={Number(current.cpAp) || 0}
                    itemLevel={Number(current.itemLevel) || 0}
                    size="sm"
                    className="mt-1"
                  />
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500">Applicant to your offer</p>
              <p className="mt-1 truncate text-sm font-black text-violet-200">{current.title}</p>
              {current.note && <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{current.note}</p>}
            </div>

            {error && <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{error}</p>}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => act(current, "decline")}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-300 hover:bg-red-500/20 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> {busy ? "Working…" : "Decline"}
              </button>
              <button
                onClick={() => act(current, "accept")}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-110 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}