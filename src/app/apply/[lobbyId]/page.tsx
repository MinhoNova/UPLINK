"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Check, Loader2, LogIn, Shield, Sparkles, UserRound, Zap } from "lucide-react";

import CharacterPortraitBadge from "@/components/aion2/CharacterPortraitBadge";
import CharacterPowerStats from "@/components/aion2/CharacterPowerStats";
import { aionClassRole, sanitizeAionClass, BOOST_MIN_LEVEL } from "@/lib/aionClassMeta";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { emoji: string; label: string; tint: string }> = {
  leveling: { emoji: "🚀", label: "Leveling", tint: "text-violet-300" },
  dungeons: { emoji: "🏰", label: "Dungeons", tint: "text-cyan-300" },
  raids: { emoji: "⚔️", label: "Raids", tint: "text-pink-300" },
  professions: { emoji: "🛠️", label: "Professions", tint: "text-emerald-300" },
};

function gameCharIdOf(c: any): string {
  if (!c) return "";
  const rid = String(c.id || "");
  if (rid.startsWith("game:")) return rid.slice(5);
  return String(c.gameCharacterId || c.characterId || "");
}

/**
 * The character picker, on the web, reached from a Discord button.
 *
 * Discord's `custom_id` is a fixed string baked into the embed and cannot carry
 * per-user state, and a Discord select menu cannot fetch from this site's API.
 * So the button hands off here instead, where the account, the saved characters
 * and the 45+ gate already exist. This is the same picker the lobby page uses,
 * reached from a link rather than from inside the feed.
 */
export default function ApplyPage() {
  const params = useParams<{ lobbyId: string }>();
  const lobbyId = String(params?.lobbyId || "");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const meId = String((session?.user as any)?.id || "");
  const meName = String(session?.user?.name || (session?.user as any)?.username || "");

  const [lobby, setLobby] = useState<any>(null);
  const [chars, setChars] = useState<any[]>([]);
  const [selCharId, setSelCharId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!lobbyId) return;
    try {
      const res = await fetch("/api/data", { credentials: "include" });
      const d: any = await res.json().catch(() => ({}));
      const allLobbies = Array.isArray(d.lobbies) ? d.lobbies : [];
      const found = allLobbies.find((l: any) => String(l.id) === String(lobbyId)) || null;
      setLobby(found);
      if (meId) {
        const mine = (Array.isArray(d.characters) ? d.characters : []).filter(
          (c: any) => String(c.userId) === String(meId),
        );
        const isLeveling = String(found?.category || "").toLowerCase() === "leveling";
        // The 45+ floor is a boosting rule; a leveling offer exists to raise a
        // character that is usually under 45, so every character is eligible there.
        const eligible = isLeveling
          ? mine
          : mine.filter((c: any) => Number(c.level ?? c.applicantLevel ?? 0) >= BOOST_MIN_LEVEL);
        setChars(eligible);
        setSelCharId((prev) => (prev && eligible.some((c: any) => String(c.id) === String(prev)) ? prev : eligible[0] ? String(eligible[0].id) : ""));
      }
    } catch {
      setError("Could not load this offer.");
    } finally {
      setLoading(false);
    }
  }, [lobbyId, meId]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    load();
  }, [load, sessionStatus]);

  const selChar = useMemo(() => chars.find((c) => String(c.id) === String(selCharId)) || null, [chars, selCharId]);
  const aionClass = sanitizeAionClass(selChar?.aionClass || selChar?.className || "");
  const isLeveling = String(lobby?.category || "").toLowerCase() === "leveling";
  const meta = CATEGORY_META[String(lobby?.category || "").toLowerCase()] || { emoji: "🎮", label: "Mission", tint: "text-cyan-300" };

  const submit = async () => {
    if (!selChar || !lobby) return;
    setBusy(true);
    setError("");
    const gid = gameCharIdOf(selChar);
    const level = Number(selChar.level ?? selChar.applicantLevel ?? 1) || 1;
    const cpAp = Number(selChar.cpAp ?? selChar.combatPower ?? 0) || 0;
    try {
      const res = await fetch("/api/lobbies/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId: lobby.id,
          applicant: {
            id: gid ? `game:${gid}` : `${meId}-main`,
            role: aionClassRole(aionClass),
            className: aionClass,
            aionClass,
            level,
            cpAp,
            applicantNote: note,
            applicantName: meName,
            ...(gid
              ? {
                  gameCharacterId: gid,
                  itemLevel: Number(selChar.itemLevel) || 0,
                  serverId: selChar.serverId,
                  serverName: selChar.serverName,
                  region: selChar.region || "global",
                  portraitUrl: String(selChar.portraitUrl || ""),
                  siteClass: selChar.aionClass || "",
                  raceName: selChar.raceName || "",
                  genderName: selChar.genderName || "",
                }
              : {}),
          },
        }),
      });
      if (res.ok) {
        setDone(true);
        window.dispatchEvent(new Event("data-refresh"));
      } else {
        const d: any = await res.json().catch(() => ({}));
        setError(d.error || "Could not send your application.");
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-emerald-400/10">
            <Check className="h-8 w-8 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-black text-white">Application sent</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
            {String(lobby?.ownerHandle || lobby?.ownerDiscordName || "The owner")} reviews applicants on the offer thread. You will get a
            bot DM the moment they invite you.
          </p>
          <button
            onClick={() => router.push(`/manage/${lobbyId}`)}
            className="mt-6 rounded-xl bg-cyan-400/15 px-5 py-2.5 text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/40 transition hover:bg-cyan-400/25"
          >
            Open offer thread
          </button>
        </motion.div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 text-center">
        <div className="text-4xl">{meta.emoji}</div>
        <h1 className="mt-2 text-2xl font-black text-white">
          {String(lobby?.title || (lobby ? `${meta.label} offer` : "Offer unavailable"))}
        </h1>
        {lobby ? (
          <p className="mt-1 text-sm text-slate-400">
            {String(lobby.ownerHandle || lobby.ownerDiscordName || "Unknown")} · {String(lobby.serverRegion || "Global")}
          </p>
        ) : (
          <p className="mt-1 text-sm text-amber-300/90">This offer no longer exists or was removed by its owner.</p>
        )}
      </div>

      {lobby ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Offer" value={`${lobby.totalGold || 0}K`} />
          <Stat label="Runs" value={String(lobby.runsCount || lobby.startLevel || "—")} />
          <Stat label="Min iLvl" value={lobby.minIlvl ? `${lobby.minIlvl}+` : "—"} />
          <Stat label="Key" value={String(lobby.keyLevel || "—")} />
        </div>
      ) : null}

      {sessionStatus !== "loading" && !meId ? (
        <Callout icon={<LogIn className="h-5 w-5" />} title="Sign in to apply">
          Your Discord account is what links you to your saved characters. Sign in, add a character if you have not already, then come
          back to this link.
          <button
            onClick={() => signIn("discord")}
            className="mt-4 w-full rounded-xl bg-[#5865F2] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4752c4]"
          >
            Sign in with Discord
          </button>
        </Callout>
      ) : chars.length === 0 ? (
        <Callout icon={<UserRound className="h-5 w-5" />} title={isLeveling ? "No character yet" : "No eligible character"}>
          {isLeveling
            ? "Add the character you want to level to your profile, then reopen this link."
            : <>Boosting offers need a Level {BOOST_MIN_LEVEL}+ character. Add one to your profile, then reopen this link.</>}
          <button
            onClick={() => router.push("/my-characters")}
            className="mt-4 w-full rounded-xl bg-cyan-400/15 px-5 py-3 text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/40 transition hover:bg-cyan-400/25"
          >
            Add a character
          </button>
        </Callout>
      ) : (
        <>
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Apply with</p>
          <div className="space-y-2">
            {chars.map((c) => {
              const active = String(c.id) === String(selCharId);
              return (
                <button
                  key={String(c.id)}
                  onClick={() => setSelCharId(String(c.id))}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-cyan-400/60 bg-cyan-400/10"
                      : "border-slate-700/60 bg-slate-900/40 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="relative h-14 w-14 shrink-0">
                    <CharacterPortraitBadge
                      src={String(c.portraitUrl || "")}
                      aionClass={sanitizeAionClass(c.aionClass || c.className || "")}
                      level={Number(c.level ?? 0) || undefined}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-white">{String(c.name || "Unnamed")}</div>
                    <div className="truncate text-xs text-slate-400">
                      {sanitizeAionClass(c.aionClass || c.className || "Unknown class")}
                      {c.serverName ? ` · ${c.serverName}` : ""}
                    </div>
                    <div className="mt-1.5">
                      <CharacterPowerStats
                        combatPower={Number(c.cpAp ?? c.combatPower ?? 0) || 0}
                        itemLevel={Number(c.itemLevel) || 0}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${active ? "border-cyan-300 bg-cyan-400/30" : "border-slate-600"}`} />
                </button>
              );
            })}
          </div>

          <label className="mt-5 block text-xs font-black uppercase tracking-widest text-slate-500" htmlFor="apply-note">
            Note for the owner
          </label>
          <textarea
            id="apply-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Availability, gear you can bring, anything that helps you get picked."
            className="mt-2 w-full resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
          />

          {error ? <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}

          <button
            onClick={submit}
            disabled={busy || !selChar}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400/20 px-5 py-3.5 text-sm font-black text-cyan-200 ring-1 ring-cyan-400/50 transition hover:bg-cyan-400/30 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {busy ? "Sending…" : "Send application"}
          </button>

          <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            UPLINK coordinates introductions only. No payments or loot pass through us.
          </p>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#04060f] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.10),transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-slate-800/70 bg-[#070b1a]/80 p-6 shadow-2xl backdrop-blur-sm">
        {children}
      </div>
      <div className="relative mx-auto mt-6 flex max-w-lg items-center justify-center gap-2 text-[11px] text-slate-600">
        <Sparkles className="h-3 w-3" /> UPLINK · Aion 2 Global LFG
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-2.5 text-center">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-black text-cyan-300">{value}</div>
    </div>
  );
}

function Callout({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-5 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">{icon}</div>
      <h2 className="text-base font-black text-white">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-slate-400">{children}</div>
    </div>
  );
}