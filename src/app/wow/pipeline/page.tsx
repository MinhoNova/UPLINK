"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { PipelineItem } from "@/app/api/wow/pipeline/route";
import { Clock, ExternalLink, Filter, RefreshCw, AlertCircle } from "lucide-react";

const CATEGORIES = ["All", "Class Tuning", "Hotfixes", "PTR", "Blog", "Feedback", "Patch Notes", "Dungeons", "Classes", "General"];

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function regionColor(region: "US" | "EU"): string {
  return region === "US" ? "text-[#00ffff]" : "text-[#ff007f]";
}

export default function PipelinePage() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [stale, setStale] = useState(false);

  async function fetchFeed() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wow/pipeline");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
      if (data.stale) setStale(true);
    } catch (e) {
      setError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFeed(); }, []);

  const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/3 w-[600px] h-[600px] bg-[#00ffff]/[0.03] blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-[#ff007f]/[0.03] blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 pt-8">
          <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">← Back to WoW</Link>
          <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-2 tracking-tight">
            The <span className="text-[#00ffff] drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">Pipeline</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Upcoming class tuning, hotfixes, patch notes, and developer updates — straight from Blizzard.
          </p>
          <div className="flex items-center gap-3 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              Live feed
            </span>
            <span>·</span>
            <button onClick={fetchFeed} disabled={loading} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          {stale && (
            <div className="flex items-center gap-2 mt-3 text-[10px] font-black uppercase tracking-widest text-amber-400">
              <AlertCircle className="w-3 h-3" />
              Using cached data — feed may be slightly delayed
            </div>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          <Filter className="w-3.5 h-3.5 text-gray-500 mr-1 self-center" />
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? "bg-[#00ffff]/20 text-[#00ffff] border border-[#00ffff]/30" : "text-gray-500 hover:text-white bg-white/5 border border-transparent"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 animate-pulse">
                <div className="h-3 bg-white/10 rounded w-1/4 mb-3" />
                <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-full mb-1" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest">No posts in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent hover:border-white/15 hover:from-white/[0.04] transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${regionColor(item.region)}`}>{item.region}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{item.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#00ffff] transition-colors leading-snug">
                      {item.title}
                      <ExternalLink className="w-3 h-3 inline ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {timeAgo(item.pubDate)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
