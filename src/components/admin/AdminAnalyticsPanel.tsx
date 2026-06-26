"use client";

import { useEffect, useState } from "react";
import { Eye, Users, BarChart3, RefreshCw } from "lucide-react";

interface Stats {
  todayPageViews: number;
  todayUniqueVisitors: number;
  allTimePageViews: number;
}

export default function AdminAnalyticsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/view");
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div id="admin-analytics" className="scroll-mt-24">
      <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <BarChart3 className="text-[#00ffff] w-6 h-6" /> Analytics
          </h2>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && !stats ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 animate-pulse">
                <div className="h-3 w-20 bg-white/5 rounded mb-3" />
                <div className="h-8 w-24 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Eye className="w-5 h-5" />}
              label="Today Page Views"
              value={stats.todayPageViews}
              color="#00ffff"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Today Unique Visitors"
              value={stats.todayUniqueVisitors}
              color="#aaff00"
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="All-Time Page Views"
              value={stats.allTimePageViews}
              color="#ff007f"
            />
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Failed to load analytics.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6" style={{ borderColor: `${color}15` }}>
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-4xl font-black text-white">{value.toLocaleString()}</div>
    </div>
  );
}
