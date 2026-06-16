"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Trash2 } from "lucide-react";
import HoverStarRating from "@/components/HoverStarRating";
import { profileImgClass } from "@/lib/profileImage";
import { useSession } from "next-auth/react";

type SiteReview = {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  rating: number;
  text: string;
  createdAt: number;
};

export default function ReviewsPageContent() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";
  const isAdmin = false; // admin check can be added if needed

  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"write" | "all">("all");

  const loadReviews = () => {
    setLoading(true);
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setAverage(d.average || 0);
        const mine = (d.reviews || []).find((r: SiteReview) => r.userId === currentUserId);
        if (mine) {
          setRating(mine.rating);
          setText(mine.text);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSubmit = async () => {
    if (rating < 0.5 || text.trim().length < 10) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim() }),
      });
      if (res.ok) {
        loadReviews();
        setTab("all");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const res = await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
    if (res.ok) loadReviews();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to delete review");
    }
  };

  return (
    <main className="min-h-screen bg-[#05050a] text-white flex items-start justify-center p-4 pt-24">
      <div className="fixed inset-0 pointer-events-none">
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#ff007f]/15 via-[#00ffff]/10 to-[#8a2be2]/15 blur-[130px] rounded-full" />
      </div>
      <div className="w-full max-w-lg bg-gradient-to-br from-[#0a0a16] to-black border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative z-10 max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 shrink-0">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <div className="flex-1">
            <h1 className="text-sm font-black text-white uppercase tracking-widest">Reviews</h1>
            <p className="text-[9px] text-gray-500 font-bold">
              {average > 0 ? `${average} / 5 · ${reviews.length} reviews` : "Be the first to review"}
            </p>
          </div>
        </div>

        <div className="flex border-b border-white/5 px-4 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-t-xl transition ${tab === "all" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-500"}`}
          >
            All Reviews
          </button>
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-t-xl transition ${tab === "write" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-500"}`}
          >
            Write Review
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {tab === "write" ? (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your rating</p>
                <HoverStarRating onSubmit={setRating} size={36} />
                {rating > 0 && (
                  <p className="text-center text-[10px] font-black text-yellow-400 mt-1">{rating.toFixed(1)} / 5 selected</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your opinion</p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share your experience with UPLINK..."
                  rows={4}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-500/50 resize-none placeholder:text-gray-600"
                />
              </div>
              <button
                type="button"
                disabled={submitting || rating < 0.5 || text.trim().length < 10}
                onClick={handleSubmit}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Review
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-10 h-10 text-gray-600 mx-auto mb-3 opacity-40" />
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">No reviews yet</p>
              <button
                type="button"
                onClick={() => setTab("write")}
                className="mt-4 text-[10px] font-black text-yellow-400 uppercase tracking-widest hover:underline"
              >
                Write the first review
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0 bg-black">
                      <img
                        src={r.userImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userName)}&background=0b1020&color=fbbf24&size=64`}
                        alt=""
                        className={profileImgClass(r.userImage || "", "w-full h-full rounded-full")}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate">{r.userName}</p>
                      <p className="text-[8px] text-gray-600">
                        {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.round(r.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`}
                        />
                      ))}
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(r.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/5 shrink-0">
          <a
            href="/"
            className="block w-full text-center py-2.5 rounded-xl bg-white/5 text-gray-400 font-black uppercase text-[9px] tracking-widest hover:bg-white/10 hover:text-white transition"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
