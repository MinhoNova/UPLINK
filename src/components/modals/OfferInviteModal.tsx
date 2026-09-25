"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Shield, Coins, MapPin, Clock, UserPlus, X, Check, Swords,
} from "lucide-react";
import InviteTimer from "@/components/InviteTimer";
import { memberIdentityKey } from "@/lib/lobbyLifecycle";
import { resolveProfileImage, resolveProfileDisplayName, resolveNameColor } from "@/lib/profileImage";
import { toNameStyle, nameGlowColor } from "@/components/GradientColorPicker";
import { resolveOfferBannerImage } from "@/lib/vfxAssets";

interface OfferInviteModalProps {
  lobbies: any[];
  registeredUsers: any[];
  meId: string;
  meName?: string;
  onResponded?: () => void;
}

export default function OfferInviteModal({
  lobbies,
  registeredUsers,
  meId,
  meName,
  onResponded,
}: OfferInviteModalProps) {
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const meKey = String(meId || "");

  const pending = useMemo(() => {
    if (!meKey) return null;
    let best: { lobby: any; member: any; expiresAt: number } | null = null;
    for (const lobby of lobbies || []) {
      const member = (lobby.accepted || []).find(
        (m: any) =>
          m.status === "invited" &&
          memberIdentityKey(m) === meKey &&
          Number(m.inviteExpiresAt || 0) > now
      );
      if (!member) continue;
      const expiresAt = Number(member.inviteExpiresAt);
      if (!best || expiresAt < best.expiresAt) {
        best = { lobby, member, expiresAt };
      }
    }
    return best;
  }, [lobbies, meKey, now]);

  const pendingKey = pending ? `${String(pending.lobby.id)}:${pending.expiresAt}` : null;
  const visible = Boolean(pending) && pendingKey !== dismissedKey;

  const owner = pending
    ? registeredUsers.find((u: any) => String(u.id) === String(pending.lobby.ownerId)) || null
    : null;

  const ownerName = pending
    ? String(owner?.displayName || owner?.name || owner?.username || pending.lobby.ownerDiscordName || "Commander")
    : "";
  const ownerAvatar = pending
    ? String(owner?.profileGif || owner?.customAvatar || owner?.avatar || pending.lobby.ownerImage || "")
    : "";
  const nameColor = owner ? resolveNameColor(owner) : null;

  const respond = async (action: "accept" | "decline") => {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/lobbies/invite-respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId: pending.lobby.id, action }),
      });
      if (!res.ok) {
        const d: any = await res.json().catch(() => ({}));
        setError(d.error || "Something went wrong — try again.");
        setBusy(false);
        return;
      }
      setDismissedKey(`${String(pending.lobby.id)}:${pending.expiresAt}`);
      window.dispatchEvent(new Event("data-refresh"));
      onResponded?.();
    } catch {
      setError("Network error — check your connection.");
    }
    setBusy(false);
  };

  const selectedDungeons = pending
    ? Object.entries((pending.lobby.selectedDungeons || {}) as Record<string, number>)
    : [];
  const runs = pending
    ? Number(
        pending.lobby.runsCount ||
          (selectedDungeons.length
            ? selectedDungeons.reduce((a, [, n]) => a + Number(n || 0), 0)
            : 1)
      )
    : 1;
  const gold = pending
    ? Number(
        pending.lobby.totalGold ||
          (pending.lobby.pricePerRun ?? pending.lobby.goldPerRun ?? pending.lobby.price ?? 0) * runs ||
          0
      )
    : 0;
  const banner = pending ? resolveOfferBannerImage(pending.lobby, owner) : "";

  return (
    <AnimatePresence>
      {visible && pending && (
        <motion.div
          key={`invite-${pending.lobby.id}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-400/25 bg-[#080c20]/95 shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-fuchsia-500/60" />

            {banner ? (
              <div className="relative h-28 w-full overflow-hidden">
                <img src={banner} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c20] via-[#080c20]/30 to-transparent" />
              </div>
            ) : (
              <div className="h-16 w-full bg-gradient-to-br from-cyan-500/20 via-transparent to-fuchsia-500/20">
                <div className="absolute inset-x-0 top-3 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
              </div>
            )}

            <div className="relative p-5 pt-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5">
                    <UserPlus className="h-3 w-3 text-amber-300" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">Squad Invite</span>
                  </div>
                </div>
                <InviteTimer variant="player" expiresAt={pending.expiresAt} />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    if (owner?.username) window.location.href = `/player/${String(owner.username)}`;
                  }}
                  className="inline-flex items-center gap-2 text-left"
                >
                  <span className="relative inline-block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-cyan-400/40 bg-black">
                    {ownerAvatar ? (
                      <img src={ownerAvatar} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[11px] font-black uppercase text-cyan-300/70">
                        {ownerName.slice(0, 1)}
                      </span>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#080c20] bg-emerald-500" />
                  </span>
                </button>{" "}
                <span
                  className="inline-flex items-center gap-1 font-black uppercase tracking-wide"
                  style={nameColor ? { ...toNameStyle(nameColor), textShadow: `0 0 10px ${nameGlowColor(nameColor)}55` } : undefined}
                >
                  {ownerName}
                </span>{" "}
                <span className="text-slate-400">invited you to join</span>
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-300">
                    {String(pending.lobby.category || "dungeon").toUpperCase()}
                  </span>
                  {pending.lobby.serverRegion && (
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-violet-300">
                      {String(pending.lobby.serverRegion).toUpperCase()}
                    </span>
                  )}
                  {Number(pending.lobby.requiredClasses?.length || 0) > 0 && (
                    <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-fuchsia-300">
                      {pending.lobby.requiredClasses.length} Slots
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-xl font-black text-white">
                  {pending.lobby.title || `${runs}× ${pending.lobby.serviceName || "Mission"}`}
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[0.06] bg-black/30 px-2.5 py-2.5 text-center">
                    <Swords className="mx-auto mb-1 h-4 w-4 text-cyan-300" />
                    <p className="text-lg font-black tabular-nums text-white">{runs}</p>
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-500">Runs</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-black/30 px-2.5 py-2.5 text-center">
                    <Coins className="mx-auto mb-1 h-4 w-4 text-amber-300" />
                    <p className="text-lg font-black tabular-nums text-white">{Number(gold).toLocaleString()}K</p>
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-500">Gold</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-black/30 px-2.5 py-2.5 text-center">
                    <Users className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
                    <p className="text-lg font-black tabular-nums text-white">
                      {(pending.lobby.accepted || []).filter((a: any) => a.status !== "invited").length + 1}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-500">Squad</p>
                  </div>
                </div>

                {selectedDungeons.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedDungeons.map(([name, count]) => (
                      <span key={name} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-300">
                        {name} ×{count}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                    {pending.expiresAt ? `Respond before the invite expires` : "Invite"}
                  </span>
                </div>
              </div>

              {error && (
                <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-red-300">
                  {error}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => respond("decline")}
                  disabled={busy}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-600/10 text-[10px] font-black uppercase tracking-widest text-red-300 transition-all hover:bg-red-600/25 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Decline
                </button>
                <button
                  type="button"
                  onClick={() => respond("accept")}
                  disabled={busy}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> {busy ? "Joining..." : "Accept"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDismissedKey(`${String(pending.lobby.id)}:${pending.expiresAt}`)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-gray-400 transition-all hover:border-white/30 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}