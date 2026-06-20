"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LeaderboardView from "@/components/LeaderboardView";
import type { MythicSeasonInfo } from "@/lib/mythicSeason";
import { MYTHIC_SEASON_FALLBACK } from "@/lib/mythicSeason";

export default function LeaderboardClient() {
  const { status } = useSession();
  const router = useRouter();
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [season, setSeason] = useState<MythicSeasonInfo>(MYTHIC_SEASON_FALLBACK);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    (async () => {
      try {
        const [dataRes, seasonRes] = await Promise.all([
          fetch("/api/data", { credentials: "include" }),
          fetch("/api/leaderboard/season"),
        ]);
        if (cancelled) return;
        if (dataRes.ok) {
          const data = await dataRes.json();
          setLobbies(data.lobbies || []);
          setCharacters(data.characters || []);
          setUsers(data.registeredUsers || []);
        }
        if (seasonRes.ok) {
          setSeason(await seasonRes.json());
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  if (status === "loading" || !ready) {
    return (
      <div className="min-h-screen bg-[#030308] flex items-center justify-center text-[#00ffff] font-black uppercase tracking-[0.4em] text-xs">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <LeaderboardView
      lobbies={lobbies}
      characters={characters}
      users={users}
      season={season}
    />
  );
}
