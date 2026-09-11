"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Users, Swords, MessageSquare, Shield, Check, Trash2,
  Radio, Send, Clock,
} from "lucide-react";
import { roleIconUrl, classThumbUrl } from "@/lib/classThumb";
import {
  resolveProfileImage,
  resolveProfileDisplayName,
  resolveNameColor,
} from "@/lib/profileImage";
import {
  confirmApplicantJoin,
  repairLobbyRoles,
  acceptedExcludingMember,
  memberIdentityKey,
} from "@/lib/lobbyLifecycle";
import { toNameStyle, nameGlowColor } from "@/components/GradientColorPicker";

type Tab = "squad" | "applicants" | "chat";

interface Props {
  open: boolean;
  onClose: () => void;
  lobby: any;
  lobbies: any[];
  setLobbies: (u: any[] | ((prev: any[]) => any[])) => void;
  registeredUsers: any[];
  currentUserId: string;
  meName: string;
  renderDualColorName?: (n: string) => any;
}

export default function OfferManager({
  open,
  onClose,
  lobby,
  lobbies,
  setLobbies,
  registeredUsers,
  currentUserId,
  meName,
  renderDualColorName,
}: Props) {
  const [tab, setTab] = useState<Tab>("applicants");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [msg, setMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const meUser = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
  const myAvatar = resolveProfileImage(
    meUser || { avatar: "" },
    String((meUser as any)?.name || meName || "Operative")
  );

  const userOf = (member: any) =>
    registeredUsers.find((u: any) => String(u.id) === String(member.applicantId || member.userId));

  const memberName = (m: any) =>
    resolveProfileDisplayName(
      userOf(m) || { name: m.applicantName || m.name },
      m.applicantName || m.name || "Operative"
    );

  const memberAvatar = (m: any) => {
    const u = userOf(m);
    return resolveProfileImage(u || { name: memberName(m) }, memberName(m));
  };

  const aionClassOf = (m: any) => String(m.aionClass || m.className || m.class || "");
  const levelOf = (m: any) => String(m.level || m.applicantLevel || "");
  const noteOf = (m: any) => String(m.applicantNote || m.note || "");

  const totalRuns = lobby?.selectedDungeons
    ? (Object.values(lobby.selectedDungeons) as number[]).reduce((a: number, b: number) => a + b, 0)
    : lobby?.runsCount || 1;

  const openRolesOf = () => {
    const roles = lobby?.roles || {};
    return Object.entries(roles)
      .filter(([, n]) => Number(n) > 0)
      .map(([role, n]) => ({ role, n: Number(n) }));
  };

  const openSlots = openRolesOf();

  const applicants = useMemo(
    () => (lobby?.applicants || []).filter((a: any) => {
      const key = memberIdentityKey(a);
      return !(lobby?.accepted || []).some((x: any) => memberIdentityKey(x) === key);
    }),
    [lobby]
  );
  const squad = lobby?.accepted || [];

  useEffect(() => {
    if (open) {
      setTab("applicants");
      setMsg("");
      setToast("");
    }
  }, [open, lobby?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lobby?.messages?.length]);

  const showToast = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(""), 2600);
  };

  const persistAll = async (next: any[]) => {
    setLobbies(next);
    const res = await fetch("/api/lobbies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lobbies: next }),
    });
    if (!res.ok) {
      showToast("Could not save — try again");
      return false;
    }
    window.dispatchEvent(new Event("data-refresh"));
    return true;
  };

  const acceptApplicant = async (app: any) => {
    if (!lobby) return;
    setSaving(true);
    const updated = confirmApplicantJoin(lobby, app);
    const next = lobbies.map((l: any) => (String(l.id) === String(lobby.id) ? updated : l));
    const ok = await persistAll(next);
    if (ok) showToast("Applicant accepted into squad");
    setSaving(false);
  };

  const rejectApplicant = async (app: any) => {
    if (!lobby) return;
    setSaving(true);
    const key = memberIdentityKey(app);
    const nextApplicants = (lobby.applicants || []).filter(
      (a: any) => memberIdentityKey(a) !== key && String(a.id) !== String(app.id)
    );
    const updated = { ...lobby, applicants: nextApplicants };
    const next = lobbies.map((l: any) => (String(l.id) === String(lobby.id) ? updated : l));
    const ok = await persistAll(next);
    if (ok) showToast("Application declined");
    setSaving(false);
  };

  const kickMember = async (member: any) => {
    if (!lobby) return;
    setSaving(true);
    const nextAccepted = acceptedExcludingMember(lobby.accepted || [], member);
    const updated = repairLobbyRoles({ ...lobby, accepted: nextAccepted });
    const next = lobbies.map((l: any) => (String(l.id) === String(lobby.id) ? updated : l));
    const ok = await persistAll(next);
    if (ok) showToast("Member removed from squad");
    setSaving(false);
  };

  const sendMessage = async () => {
    const text = (msg || "").trim();
    if (!lobby || !text || saving) return;
    setSaving(true);
    const message = {
      id: Date.now(),
      fromId: currentUserId,
      from: String(meUser?.displayName || meUser?.name || meName || "Operative"),
      fromHandle: String(meUser?.username || ""),
      fromAvatar: myAvatar,
      fromEffect: "none",
      text,
      image: null,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = {
      ...lobby,
      messages: [...(lobby.messages || []), message],
    };
    const next = lobbies.map((l: any) => (String(l.id) === String(lobby.id) ? updated : l));
    const ok = await persistAll(next);
    setSaving(false);
    if (ok) {
      setMsg("");
    } else {
      showToast("Could not send message");
    }
  };

  const messages = lobby?.messages || [];

  return (
    <AnimatePresence>
      {open && lobby && (
        <>
          <motion.div
            key="manager-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="manager-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-[440px] flex-col border-l border-cyan-500/20 bg-[#070b1c]/98 shadow-[-20px_0_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-purple-500/60" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.24em] text-cyan-300">
                  <Radio className="h-3 w-3" /> Offer Command
                </p>
                <h2 className="mt-1 truncate text-base font-black uppercase tracking-wide text-white">
                  {lobby.title || `${totalRuns}× Mission`}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-300">
                    {String(lobby.category || "dungeon").toUpperCase()}
                  </span>
                  {lobby.serverRegion && (
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-violet-300">
                      {String(lobby.serverRegion).toUpperCase()}
                    </span>
                  )}
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-300">
                    {lobby.status === "in_progress" ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 transition-all hover:border-white/25 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/[0.07] px-4 py-2.5">
              {([
                { key: "applicants", label: `Applicants (${applicants.length})`, icon: Users },
                { key: "squad", label: `Squad (${squad.length}/4)`, icon: Shield },
                { key: "chat", label: "Chat", icon: MessageSquare },
              ] as { key: Tab; label: string; icon: any }[]).map((tb) => {
                const active = tab === tb.key;
                const Icon = tb.icon;
                return (
                  <button
                    key={tb.key}
                    onClick={() => setTab(tb.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                      active
                        ? "border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 shadow-[0_0_14px_rgba(0,229,255,0.12)]"
                        : "border border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Icon className="h-3 w-3" /> {tb.label}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
              {toast && (
                <div className="mb-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  {toast}
                </div>
              )}

              {/* ── APPLICANTS ── */}
              {tab === "applicants" && (
                <div className="space-y-2.5">
                  {openSlots.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                      <Swords className="h-3 w-3 text-cyan-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">OPEN:</span>
                      {openSlots.map((r) => (
                        <span key={r.role} className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-cyan-300">
                          {r.n} {r.role.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  {applicants.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30">
                      <Users className="h-10 w-10 mb-3" />
                      <p className="text-[9px] font-black uppercase tracking-widest">No applications yet</p>
                    </div>
                  )}
                  {applicants.map((app: any) => {
                    const aName = memberName(app);
                    const aColor = resolveNameColor(userOf(app) || { name: aName });
                    return (
                      <div key={app.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all hover:border-cyan-400/30">
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            <div className="h-11 w-11 rounded-full overflow-hidden border border-cyan-400/25 bg-black/40 ring-1 ring-[#00ffff]/20">
                              <img src={memberAvatar(app)} alt="" className="h-full w-full object-cover" />
                            </div>
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#070b1c] bg-emerald-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-xs font-black tracking-wide"
                              style={aColor ? { ...toNameStyle(aColor), textShadow: `0 0 10px ${nameGlowColor(aColor)}55` } : undefined}
                            >
                              {aName}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <img src={classThumbUrl(aionClassOf(app))} alt="" title={aionClassOf(app) || "Class"} className="h-4 w-4 object-contain" />
                              <span className="text-[9px] font-black uppercase tracking-wider text-cyan-200">
                                {aionClassOf(app) || "—"}
                              </span>
                              <span className="text-[9px] font-black text-[#c084fc] tabular-nums">
                                {levelOf(app) ? `Lv ${levelOf(app)}` : "Lv —"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {noteOf(app) && (
                          <p className="mt-2 rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1.5 text-[10px] leading-snug text-gray-300">
                            {noteOf(app)}
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            onClick={() => acceptApplicant(app)}
                            disabled={saving}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" /> Accept
                          </button>
                          <button
                            onClick={() => rejectApplicant(app)}
                            disabled={saving}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-600/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-red-300 transition-all hover:bg-red-600/20 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" /> Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── SQUAD ── */}
              {tab === "squad" && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                    <Shield className="h-3 w-3 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Squad {squad.length}/4
                    </span>
                  </div>
                  {squad.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30">
                      <Shield className="h-10 w-10 mb-3" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Squad is empty</p>
                    </div>
                  )}
                  {squad.map((member: any) => {
                    const mName = memberName(member);
                    const mColor = resolveNameColor(userOf(member) || { name: mName });
                    const isSelf = String(member.applicantId || member.userId || member.id) === String(currentUserId);
                    return (
                      <div key={memberIdentityKey(member) || member.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="shrink-0">
                            <div className="h-11 w-11 rounded-full overflow-hidden border border-emerald-400/25 bg-black/40 ring-1 ring-emerald-400/20">
                              <img src={memberAvatar(member)} alt="" className="h-full w-full object-cover" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-xs font-black tracking-wide"
                              style={mColor ? { ...toNameStyle(mColor), textShadow: `0 0 10px ${nameGlowColor(mColor)}55` } : undefined}
                            >
                              {mName}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <img src={roleIconUrl(member.role || "dps")} alt="" title={member.role || "dps"} className="h-4 w-4 object-contain" />
                              <span className="text-[9px] font-black uppercase tracking-wider text-gray-300">
                                {String(member.role || "dps").toUpperCase()}
                              </span>
                              <span className="text-[9px] font-black text-cyan-300">{aionClassOf(member) || "—"}</span>
                              <span className="text-[9px] font-black text-[#c084fc] tabular-nums">
                                {levelOf(member) ? `Lv ${levelOf(member)}` : ""}
                              </span>
                            </div>
                          </div>
                          {!isSelf && (
                            <button
                              onClick={() => kickMember(member)}
                              disabled={saving}
                              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-500 transition-all hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" /> Kick
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── CHAT ── */}
              {tab === "chat" && (
                <div className="flex flex-col">
                  <div className="space-y-3">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 opacity-30">
                        <MessageSquare className="h-10 w-10 mb-3" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No messages yet</p>
                      </div>
                    )}
                    {messages.map((m: any, i: number) => {
                      const isMine = String(m.fromId || m.userId) === String(currentUserId);
                      const mName = String(m.from || m.fromHandle || "Operative");
                      return (
                        <div key={m.id || i} className={`flex items-start gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                          <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border border-white/10 bg-black/40">
                            <img src={m.fromAvatar || ""} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className={`min-w-0 max-w-[75%] rounded-2xl border px-3 py-2 ${
                            isMine
                              ? "border-cyan-400/30 bg-cyan-500/15"
                              : "border-white/[0.07] bg-white/[0.04]"
                          }`}>
                            <div className="mb-0.5 flex items-center justify-between gap-3">
                              <span className="text-[8px] font-black uppercase tracking-widest text-cyan-300">{mName}</span>
                              <span className="text-[8px] text-gray-500">{m.time}</span>
                            </div>
                            <p className="text-[11px] leading-snug text-gray-100 break-words">{m.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="sticky bottom-0 mt-3 flex items-center gap-2 bg-[#070b1c] pb-1">
                    <input
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Message the squad..."
                      maxLength={300}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-cyan-400/50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={saving || !msg.trim()}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:from-[#08a3c4] hover:to-[#5b4ddb] disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {tab !== "chat" && (
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 flex items-center gap-2 opacity-70">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                    {lobby.status === "in_progress" ? "Mission active — squad locked" : "Standby — applicants can join"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}