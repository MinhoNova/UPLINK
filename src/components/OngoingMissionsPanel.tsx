"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Coins, Radio } from "lucide-react";
import {
  getJoinedOngoingMissions,
  getOwnerOngoingMissions,
  isEmbeddedFootArchive,
} from "@/lib/lobbyLifecycle";
import { resolveLobbyBannerBg } from "@/lib/vfxAssets";

type Props = {
  lobbies: any[];
  currentUserId: string;
  registeredUsers: any[];
  completedThreadsCount: number;
  theme: string;
  roleIconUrl: (role: string) => string;
  getVfxSettings: (user: any) => {
    showOnBanner: boolean;
    showOnOngoing: boolean;
    showOnModal: boolean;
  };
  onOpenMission: (lobbyId: string) => void;
  alignWithOfferBanners?: boolean;
  /** Sorted offer banner ids from the feed — lines up mission cards row-by-row. */
  alignOfferIds?: string[];
};

function orderByFeedIds(missions: any[], alignOfferIds?: string[]): any[] {
  if (!alignOfferIds?.length || !missions.length) return missions;
  const byId = new Map(missions.map((m) => [String(m.id), m]));
  const ordered: any[] = [];
  for (const id of alignOfferIds) {
    const m = byId.get(String(id));
    if (m) ordered.push(m);
  }
  for (const m of missions) {
    if (!alignOfferIds.includes(String(m.id))) ordered.push(m);
  }
  return ordered;
}

export default function OngoingMissionsPanel({
  lobbies,
  currentUserId,
  registeredUsers,
  completedThreadsCount,
  theme,
  roleIconUrl,
  getVfxSettings,
  onOpenMission,
  alignWithOfferBanners = false,
  alignOfferIds,
}: Props) {
  const ownerMissions = orderByFeedIds(
    getOwnerOngoingMissions(lobbies, currentUserId),
    alignOfferIds
  );
  const joinedMissions = getJoinedOngoingMissions(lobbies, currentUserId);
  const hasActiveMissions = ownerMissions.length > 0 || joinedMissions.length > 0;

  const renderMissionCard = (l: any) => (
    <motion.div
      whileHover={{ x: 5 }}
      key={l.id}
      className={`shrink-0 p-3 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden min-h-[132px] flex flex-col justify-center ${
        theme === "light"
          ? "border-black/10 bg-white hover:bg-white shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
      onClick={() => onOpenMission(String(l.id))}
    >
      {(() => {
        const ownerUser = registeredUsers.find((u: any) => u.id === l.ownerId);
        const vfxOn = ownerUser && getVfxSettings(ownerUser).showOnOngoing;
        const bgPoster = vfxOn
          ? resolveLobbyBannerBg(l, ownerUser, ownerUser?.activeVfx)
          : null;
        return bgPoster ? (
          <div className="absolute inset-0 z-0">
            <img src={bgPoster} className="w-full h-full object-cover opacity-100" alt="" loading="lazy" decoding="async" />
          </div>
        ) : null;
      })()}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff007f]/5 blur-2xl rounded-full translate-x-12 -translate-y-12" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="min-w-0 w-1/3 shrink-0">
          <p
            className={`text-xl font-black truncate uppercase tracking-tighter leading-none ${
              theme === "light" ? "text-[#00ffff]" : "text-[#00ffff]"
            }`}
          >
            {l.category === "leveling" ? (
              <>
                <span className="text-[11px] font-black text-white/55 align-middle">Leveling </span>
                <span>
                  {l.startLevel || "1"}-{l.endLevel || "80"}
                </span>
              </>
            ) : (
              (() => {
                const totalRuns = l.selectedDungeons
                  ? (Object.values(l.selectedDungeons) as number[]).reduce((a, b) => a + b, 0)
                  : l.runsCount || 1;
                return `${totalRuns}x ${l.keyLevel || "+10"}`;
              })()
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[9px] px-3 py-1 rounded-full font-black tracking-[0.1em] border ${
              l.status === "completed" && l.payoutStatus === "paid"
                ? "bg-green-500/20 text-green-500 border-green-500/30"
                : l.status === "unpaid" || isEmbeddedFootArchive(l)
                  ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                  : l.status === "payment_pending"
                    ? "bg-orange-500/20 text-orange-500 border-orange-500/30"
                    : l.status === "in_progress"
                      ? "bg-green-500/20 text-green-500 border-green-500/30"
                      : "bg-[#ff007f]/20 text-[#ff007f] border-[#ff007f]/30"
            }`}
          >
            {l.status === "completed" && l.payoutStatus === "paid"
              ? "COMPLETED ✓ PAID"
              : l.status === "unpaid" || isEmbeddedFootArchive(l)
                ? "UNPAID ⏳"
                : l.status === "payment_pending"
                  ? "PAYMENT PENDING"
                  : l.status === "in_progress"
                    ? "ACTIVE OPS"
                    : "STANDBY"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-[15px] font-black text-yellow-500">
              {l.totalGold || (l.goldPerRun || 0) * (l.runsCount || 1)}K
            </span>
          </div>
          {l.category !== "leveling" && (
            <span className="text-[10px] font-black uppercase text-[#00ffff]">
              {l.goldPerRun}K <span className="text-[#00ffff]/70">per run</span>
            </span>
          )}
        </div>
        <div className="flex flex-col items-end justify-end">
          <span className="text-[8px] font-black text-[#8a2be2] uppercase tracking-[0.2em] mb-1">
            Squad
          </span>
          <div className="flex -space-x-1">
            {(l.accepted || []).map((a: any, i: number) => (
              <div
                key={i}
                title={a.name}
                className="w-6 h-6 rounded-lg border border-white/10 bg-black flex items-center justify-center shadow-lg overflow-hidden transition-transform hover:-translate-y-1"
              >
                <img
                  src={roleIconUrl(a.role || "dps")}
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                  alt=""
                />
              </div>
            ))}
            {Array.from({ length: 4 - (l.accepted?.length || 0) }).map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-lg border border-dashed border-white/5 bg-transparent flex items-center justify-center brightness-50"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div
      className={`w-full xl:w-[300px] shrink-0 flex flex-col self-start ${
        alignWithOfferBanners ? "mt-[5.75rem]" : ""
      }`}
    >
      <div
        className={`rounded-[2.5rem] border shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col transition-colors duration-500 ${
          alignWithOfferBanners ? "p-4 pt-3" : "p-6"
        } ${
          theme === "light"
            ? "bg-white border-black/10 shadow-[0_30px_80px_rgba(15,23,42,0.14)]"
            : "bg-[linear-gradient(180deg,rgba(4,4,8,0.98),rgba(0,0,0,1))] border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-20 h-20 rounded-full translate-x-6 -translate-y-6 ${
            theme === "light" ? "bg-[#00ffff]/5 blur-3xl" : "bg-black/80 blur-2xl"
          }`}
        />
        <h3
          className={`text-[13px] font-black uppercase tracking-[0.3em] flex items-center gap-2 relative z-10 ${
            alignWithOfferBanners ? "mb-2" : "mb-4"
          } ${theme === "light" ? "text-[#00ffff]" : "text-white/90"}`}
        >
          <Clock className="w-5 h-5 text-[#ff007f]" />
          Ongoing Missions
        </h3>

        <div className="space-y-4 relative z-10 w-full">
          {ownerMissions.map(renderMissionCard)}
          {joinedMissions.map(renderMissionCard)}
          {!hasActiveMissions && (
            <div className="text-center opacity-70 w-full flex flex-col items-center justify-center py-6">
              <Radio className="w-10 h-10 mx-auto text-[#00ffff]/50 mb-3" />
              <p className="text-[12px] font-black uppercase tracking-[0.25em] text-gray-500">
                No Active Missions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
