"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Send, Loader2, ShieldCheck } from "lucide-react";
import { reviewTargetsOf, playerCanReviewLobby } from "@/lib/playerReviews";
import { resolveProfileImage, profileImgClass } from "@/lib/profileImage";

interface ReviewEntry {
  id: string;
  name: string;
  image: string;
  rating: number;
  comment: string;
  done?: boolean;
  submitted?: boolean;
}

interface SquadReviewModalProps {
  lobby: any;
  meId: string;
  registeredUsers?: any[];
  onClose: () => void;
}

const RATING_LABELS = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"];

export default function SquadReviewModal({ lobby, meId, registeredUsers = [], onClose }: SquadReviewModalProps) {
  const targets = useMemo(() => reviewTargetsOf(lobby, meId), [lobby, meId]);
  const canReview = playerCanReviewLobby(lobby, meId);
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submittedCount, setSubmittedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let existing: any[] = [];
    fetch(`/api/player-reviews?lobbyId=${encodeURIComponent(String(lobby?.id || ""))}`)
      .then((r) => r.json())
      .then((d: any) => {
        if (Array.isArray(d?.reviews)) existing = d.reviews;
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        const me = String(meId);
        setEntries(
          targets.map((t) => {
            const mine = existing.find((r) => String(r.reviewerId) === me && String(r.targetId) === String(t.id));
            return {
              id: t.id,
              name: t.name,
              image: t.image,
              rating: mine ? Number(mine.rating) : 0,
              comment: mine ? String(mine.comment || "") : "",
              done: Boolean(mine),
              submitted: Boolean(mine),
            };
          })
        );
        setSubmittedCount(existing.filter((r) => String(r.reviewerId) === me).length);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [lobby?.id, meId, targets]);

  const update = (id: string, patch: Partial<ReviewEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const submit = async (entry: ReviewEntry) => {
    if (entry.rating < 1) { setError("Pick a rating (1–5 stars) first."); return; }
    setSavingId(entry.id);
    setError("");
    try {
      const res = await fetch("/api/player-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId: String(lobby.id), targetId: entry.id, rating: entry.rating, comment: entry.comment.slice(0, 300) }),
      });
      const d: any = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "Could not submit review."); return; }
      update(entry.id, { done: true, submitted: true });
      setSubmittedCount((c) => c + 1);
    } catch {
      setError("Network error — try again.");
    } finally {
      setSavingId(null);
    }
  };

  const modalLabel = `${Number(lobby?.runsCount) || 1}× ${lobby?.title || lobby?.serviceName || "Offer"}`.slice(0, 60);
  const allDone = entries.length > 0 && entries.every((e) => e.done);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => !savingId && onClose()}>
        <motion.div
          initial={{ scale: 0.94, y: 14 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.97, y: 8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl border border-yellow-500/30 bg-[#0a0c1a]/95 p-5 shadow-[0_0_60px_rgba(234,179,8,0.14)] max-h-[86vh] overflow-y-auto custom-scrollbar"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-400/40 bg-yellow-500/10">
                <Star className="h-4 w-4 text-yellow-300" />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Squad Reviews</h3>
                <p className="truncate text-[9px] font-bold uppercase tracking-widest text-gray-500">{modalLabel}</p>
              </div>
            </div>
            <button onClick={() => !savingId && onClose()} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!canReview ? (
            <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Only squad members can review this offer.
            </p>
          ) : loading ? (
            <div className="mt-8 flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-300" />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              No squad-mates to review here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {entries.map((entry) => {
                const targetUser = registeredUsers.find((u: any) => String(u.id) === String(entry.id));
                const img = entry.image || (targetUser ? resolveProfileImage(targetUser) : "");
                return (
                  <div key={entry.id} className={`rounded-2xl border p-3 transition-all ${entry.submitted ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/10 bg-white/[0.02]"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black ${profileImgClass(img)}`}>
                        {img ? <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <span className="flex h-full w-full items-center justify-center bg-violet-500/20 text-base font-black text-violet-200">{entry.name.slice(0, 1).toUpperCase()}</span>}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white">{entry.name}</p>
                        <div className="mt-0.5 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" disabled={entry.submitted || savingId === entry.id} onClick={() => update(entry.id, { rating: n })} className={`text-base leading-none transition-transform hover:scale-125 disabled:opacity-60 ${n <= entry.rating ? "text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" : "text-slate-600"}`}>
                              ★
                            </button>
                          ))}
                          <span className="ml-1 text-[8px] font-black uppercase tracking-widest text-slate-500">{entry.rating > 0 ? RATING_LABELS[entry.rating] : ""}</span>
                        </div>
                      </div>
                      {entry.submitted && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-300">
                          <ShieldCheck className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>
                    {!entry.submitted && (
                      <>
                        <textarea
                          value={entry.comment}
                          onChange={(e) => update(entry.id, { comment: e.target.value.slice(0, 300) })}
                          placeholder="Note about this player (optional)"
                          rows={2}
                          className="mt-2.5 w-full resize-none rounded-lg border border-white/10 bg-[#050814]/70 px-3 py-2 text-[12px] font-bold text-gray-200 outline-none focus:border-yellow-400/50"
                        />
                        <button
                          onClick={() => submit(entry)}
                          disabled={savingId === entry.id}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 py-2.5 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-110 disabled:opacity-50"
                        >
                          {savingId === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit review
                        </button>
                      </>
                    )}
                  </div>
                );
              })}

              {error && <p className="text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{error}</p>}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{submittedCount}/{entries.length} submitted</span>
                {allDone && (
                  <button onClick={onClose} className="rounded-lg bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-300 hover:bg-white/10">
                    Close
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}