"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentMythicPlusSeason, MYTHIC_SEASON_FALLBACK } from "@/lib/mythicSeason";
import { getAffixForWeek, getCurrentWeek, getAffix, getAffixColor, type AffixWeek } from "@/lib/wowAffixes";
import { CalendarDays, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function AffixBadge({ id }: { id: string }) {
  const affix = getAffix(id);
  const color = getAffixColor(id);
  return (
    <div
      className="flex items-center gap-2 bg-[#0c0c18] border rounded-lg px-3 py-2"
      style={{ borderColor: `${color}35` }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {affix.icon}
      </span>
      <div>
        <div className="text-xs font-bold text-white">{affix.name}</div>
        <div className="text-[9px] text-gray-500 leading-tight max-w-[280px]">{affix.description}</div>
      </div>
    </div>
  );
}

export default function AffixesPageClient() {
  const [seasonInfo, setSeasonInfo] = useState(MYTHIC_SEASON_FALLBACK);
  const [loaded, setLoaded] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    getCurrentMythicPlusSeason().then((info) => {
      setSeasonInfo(info);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    const fallbackWeek = getAffixForWeek(MYTHIC_SEASON_FALLBACK.startMs ? new Date(MYTHIC_SEASON_FALLBACK.startMs) : new Date("2026-03-24"), getCurrentWeek(new Date("2026-03-24")), MYTHIC_SEASON_FALLBACK.slug);
    return <AffixesShell seasonName={MYTHIC_SEASON_FALLBACK.name} weeks={[fallbackWeek]} offset={0} setOffset={() => {}} loading />;
  }

  const startDate = new Date(seasonInfo.startMs);
  const currentWeek = getCurrentWeek(startDate);
  const displayWeek = currentWeek + offset;
  const week = getAffixForWeek(startDate, displayWeek, seasonInfo.slug);
  const nextWeek = getAffixForWeek(startDate, displayWeek + 1, seasonInfo.slug);

  const currentDate = week.startDate;
  const nextDate = nextWeek.startDate;

  const seasonStartKey = seasonInfo.startMs.toString();

  return (
    <AffixesShell seasonName={seasonInfo.name} weeks={[week, nextWeek]} offset={offset} setOffset={setOffset} loading={false} />
  );
}

function AffixesShell({ seasonName, weeks, offset, setOffset, loading }: {
  seasonName: string;
  weeks: AffixWeek[];
  offset: number;
  setOffset: (n: number) => void;
  loading: boolean;
}) {
  const currentWeek = weeks[0];
  const nextWeek = weeks[1];

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/3 w-[600px] h-[600px] bg-[#9b59b6]/[0.03] blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-[#3498db]/[0.03] blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 pt-8">
          <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">← Back to WoW</Link>
          <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-2 tracking-tight">
            Mythic+ <span className="text-[#9b59b6] drop-shadow-[0_0_15px_rgba(155,89,182,0.4)]">Affixes</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Current and upcoming Mythic+ affixes for {seasonName}. Updated weekly.
          </p>
          {loading && (
            <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest text-amber-400">
              <AlertCircle className="w-3 h-3" /> Loading season data...
            </div>
          )}
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setOffset(offset - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 transition">
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {offset === 0 ? "Current Week" : `Week ${weeks[0]?.weekNumber || ""}`}
            </span>
          </div>
          <button onClick={() => setOffset(offset + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 transition">
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current/Selected Week */}
          {currentWeek && (
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c0c18] to-black overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-base font-black text-white">This Week</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">
                  {formatDate(currentWeek.startDate)} — {formatDate(new Date(currentWeek.startDate.getTime() + 6 * 24 * 60 * 60 * 1000))}
                </p>
              </div>
              <div className="p-6 space-y-3">
                {currentWeek.all.map((affixId) => (
                  <AffixBadge key={affixId} id={affixId} />
                ))}
              </div>
            </div>
          )}

          {/* Next Week */}
          {nextWeek && (
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c0c18] to-black overflow-hidden opacity-80">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-base font-black text-white">Next Week</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">
                  {formatDate(nextWeek.startDate)} — {formatDate(new Date(nextWeek.startDate.getTime() + 6 * 24 * 60 * 60 * 1000))}
                </p>
              </div>
              <div className="p-6 space-y-3">
                {nextWeek.all.map((affixId) => (
                  <AffixBadge key={affixId} id={affixId} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Affix reference */}
        <div className="mt-12 border-t border-white/5 pt-10">
          <h2 className="text-lg font-black text-white mb-4">All Affixes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {["fortified", "tyrannical", "bolstering", "raging", "sanguine", "spiteful", "storming", "bursting", "volcanic", "grievous", "explosive", "necrotic", "quaking", "skittish", "inspiring", "entangling", "xalatath", "ascendant", "challenger"].map((id) => (
              <AffixBadge key={id} id={id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
