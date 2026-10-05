"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, ExternalLink, IdCard, Link2, Loader2, RefreshCw, Swords, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import PageBackdrop from "@/components/aion2/PageBackdrop";
import CharacterPortraitBadge from "@/components/aion2/CharacterPortraitBadge";
import CharacterPowerStats from "@/components/aion2/CharacterPowerStats";
import type { VerifiedGameCharacter } from "@/lib/aion2ClassIds";
import { aion2CharacterPageUrl, AION2_REGION_LABEL, rawPortraitUrlOf } from "@/lib/aion2ClassIds";
import {
  gameCharIdOf,
  myLinkedCharacters,
  removeCharacterById,
  saveVerifiedCharacterEntries,
} from "@/lib/characterStore";
import { useI18n } from "@/i18n/i18n";

/**
 * How many characters are re-verified at once.
 *
 * Deliberately below the 20-requests-per-minute the resolve route allows per IP:
 * a wider fan-out does not finish sooner, it just spends the budget and answers
 * 429 for the rows that would otherwise have succeeded. Four keeps a typical
 * roster of one to four characters fully parallel while leaving headroom for the
 * link-paste path, which shares the same bucket.
 */
const UPDATE_CONCURRENCY = 4;

export default function MyCharactersClient({ heroBg }: { heroBg?: string }) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const router = useRouter();

  const meId = String((session?.user as any)?.id || "");
  const meName = String((session?.user as any)?.name || "");

  const [chars, setChars] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [link, setLink] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkResult, setLinkResult] = useState<VerifiedGameCharacter | null>(null);

  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateDone, setUpdateDone] = useState(0);

  const flash = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /**
   * Read only the `characters` key.
   *
   * This used to pull all of `/api/data` — every lobby, notification and
   * registered user in the store — to render a couple of cards, and it re-ran on
   * every `data-refresh` event. That payload is what made this page crawl.
   * `/api/public-data?keys=characters` narrows the D1 read to one row, and the
   * same filtered list is what `fetchPublicCharacters` already used for writes,
   * so the two now agree on shape.
   */
  const refresh = useCallback(() => {
    if (!meId) return;
    fetch("/api/public-data?keys=characters", { credentials: "include" })
      .then((r) => r.json())
      .then((d: any) => {
        if (Array.isArray(d.characters)) setChars(d.characters);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [meId]);

  useEffect(() => {
    refresh();
    window.addEventListener("data-refresh", refresh);
    return () => window.removeEventListener("data-refresh", refresh);
  }, [refresh]);

  const myChars = useMemo(() => myLinkedCharacters(chars, meId), [chars, meId]);

  const charProfileHref = (c: any): string => {
    const rid = String(c.id || "");
    const charId = rid.startsWith("game:") ? rid.slice(5) : gameCharFallback(c);
    if (!charId || !c.serverId) return "";
    return `/character?u=${encodeURIComponent(aion2CharacterPageUrl(c.serverId, charId, c.region))}`;
  };

  const gameCharFallback = (c: any): string => String(c.gameCharacterId || c.characterId || "");

  const runResolveLink = async () => {
    if (!link.trim() || linkBusy) return;
    setLinkBusy(true); setLinkError(""); setLinkResult(null);
    try {
      const res = await fetch("/api/aion2/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: link.trim().slice(0, 500) }),
      });
      const d: any = await res.json().catch(() => ({}));
      if (!res.ok) { setLinkError(d.error || t("verify_notFound")); return; }
      if (d.alreadyLinked) { setLinkError(t("verify_alreadyLinked") || "This character is already linked to another account on the site."); return; }
      const vc = d.character as VerifiedGameCharacter;
      if (!vc?.characterId) { setLinkError(t("verify_notFound")); return; }
      const saved = await saveVerifiedCharacterEntries([vc], meId);
      if (!saved.ok) { setLinkError(saved.error || t("mychars_saveFailed")); return; }
      setLinkResult(vc);
      setLink("");
      flash(t("mychars_linked") || "Character linked");
      refresh();
    } catch {
      setLinkError(t("err_network"));
    } finally {
      setLinkBusy(false);
    }
  };

  /**
   * Re-verify every character on the page, exactly as if its link had just been
   * pasted again: each row is re-read from the official character API and the
   * stored snapshot is replaced field for field.
   *
   * The stored row is a snapshot taken at link time (`verifiedAt` is when the
   * verifier last ran), so item level and combat power sat at their linking
   * values until a link was pasted again. The per-character Refresh button was
   * scoped to characters missing a portrait, which every working character has,
   * so in practice there was no way to update anything.
   *
   * Results are collected and written in one pass. `characters` is a single
   * blob, so saving as we went would rewrite the whole roster once per
   * character — N reads, N writes, N chances to clobber a concurrent tab.
   *
   * Latency, measured from the site against NCSoft (3 runs each, October 2025):
   * the character-info call is ~1.7-2.1s for the EU shard and ~0.23s for NA,
   * and a cold portrait fetch is ~0.7-1.4s. Doing the rows one after another
   * made the wait the *sum* of those, so three EU characters cost ~6s. The rows
   * are independent, so they now go out concurrently and the wait is the
   * slowest single row instead. Concurrency is capped at UPDATE_CONCURRENCY
   * rather than unbounded: the resolve route allows 20 calls/min per IP, and a
   * fan-out wider than the rate limit would only convert calls into 429s.
   */
  const updateAllChars = async () => {
    if (updating) return;
    const targets = myChars.filter((c: any) => gameCharIdOf(c) && Number(c.serverId) > 0);
    if (targets.length === 0) {
      flash("None of your characters have a recorded server to re-check", "err");
      return;
    }
    setUpdating(true);
    setUpdateDone(0);
    try {
      const verified: VerifiedGameCharacter[] = [];
      const failed: string[] = [];
      let stopped = false;

      // Start the portraits downloading now, alongside the data calls, instead of
      // after them. NCSoft serves `max-age=864000` on a portrait URL that has no
      // version component, so this is normally a cache hit and free — but when it
      // is the cold path, the ~1s fetch overlaps the ~2s info call rather than
      // following it. `new Image` (not `fetch`) because the response has no CORS
      // headers and would be opaque; an <img> populates the same HTTP cache.
      for (const c of targets) {
        const raw = rawPortraitUrlOf(c?.portraitUrl);
        if (!raw || !/^https:\/\//.test(raw)) continue;
        const img = new Image();
        img.src = raw;
      }

      let next = 0;
      const worker = async () => {
        for (;;) {
          if (stopped) return;
          const i = next++;
          if (i >= targets.length) return;
          const c = targets[i];
          try {
            const res = await fetch("/api/aion2/resolve", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                characterId: gameCharIdOf(c),
                serverId: Number(c.serverId),
                region: c.region || "global",
              }),
            });
            // The resolve route allows 20 calls/min per IP. Stop handing out new
            // rows the moment one comes back limited, so the rows never attempted
            // are not reported as broken characters. Requests already in flight
            // are allowed to finish and are counted normally.
            if (res.status === 429) {
              stopped = true;
              return;
            }
            const d: any = await res.json().catch(() => ({}));
            const vc = d?.character as VerifiedGameCharacter | undefined;
            if (res.ok && vc?.characterId) verified.push(vc);
            else failed.push(c.name || "character");
          } catch {
            failed.push(c.name || "character");
          }
          setUpdateDone((n) => n + 1);
        }
      };
      await Promise.all(
        Array.from(
          { length: Math.min(UPDATE_CONCURRENCY, targets.length) },
          () => worker()
        )
      );
      // Anything neither verified nor failed was never started, i.e. the pass hit
      // the rate limit.
      const throttled = targets.length - verified.length - failed.length;
      if (verified.length > 0) {
        const saved = await saveVerifiedCharacterEntries(verified, meId);
        if (!saved.ok) {
          flash(saved.error || "Could not update your characters", "err");
          return;
        }
        refresh();
      }
      const remaining = throttled + failed.length;
      if (throttled > 0) {
        flash(
          `Updated ${verified.length}. Too many characters for one pass — wait a minute and press update again for the other ${remaining}.`,
          "err"
        );
      } else if (failed.length === 0) {
        flash(`${verified.length} character${verified.length === 1 ? "" : "s"} updated`);
      } else if (verified.length === 0) {
        flash(`Could not update ${failed.length} character${failed.length === 1 ? "" : "s"} — try again in a moment`, "err");
      } else {
        flash(`Updated ${verified.length}, could not update ${failed.length}`, "err");
      }
    } finally {
      setUpdating(false);
    }
  };

  const removeChar = async (c: any) => {
    if (removingId) return;
    setRemovingId(String(c.id)); 
    try {
      const res = await removeCharacterById(String(c.id), meId);
      if (!res.ok) { flash(res.error || t("mychars_removeFailed"), "err"); setConfirmRemoveId(null); return; }
      flash(t("mychars_removed") || "Character removed");
      setConfirmRemoveId(null);
      refresh();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-blue-500/30">
      <PageBackdrop heroBg={heroBg} />
      {/* `pt-32 sm:pt-36` clears the fixed `h-24` navbar. This page used `pt-8`,
          which put the heading and its buttons underneath the bar. */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-32 sm:pt-36 pb-24">
        <button
          type="button"
          onClick={() => router.push("/my-profile")}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 transition-all"
        >
          <ArrowLeft className="w-3 h-3" /> {t("mychars_back") || "Back to profile"}
        </button>

        <div className="flex items-center gap-3 pb-5 mb-6 border-b border-blue-900/30">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
            <Swords className="h-5 w-5 text-cyan-300" />
          </span>
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest text-white">{t("nav_myCharacters") || "My Characters"}</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
              {meName ? `Operative · ${meName}` : "Operative"} — {myChars.length} {t("mychars_verified") || "verified"}
            </p>
          </div>
          {loaded && myChars.length > 0 && (
            <button
              type="button"
              onClick={updateAllChars}
              disabled={updating}
              title="Re-read every linked character from the official site and update its level, item level and combat power"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
            >
              {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {updating
                ? `Updating ${updateDone}/${myChars.length}`
                : (t("mychars_updateAll") || "Update Characters")}
            </button>
          )}
        </div>

        {/* Add link card */}
        <div className="tn-light relative w-full rounded-3xl bg-[#070a1c]/70 backdrop-blur-xl border border-violet-500/25 p-6 mb-6">
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-violet-300 mb-1">
            <IdCard className="w-3.5 h-3.5" /> {t("mychars_addTitle") || "Link a new character"}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500 mb-3">
            {t("mychars_addHint") || "Paste your official character page link (aion2.plaync.com)"}
          </p>
          <div className="flex gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runResolveLink(); }}
              placeholder={t("verify_linkPlaceholder") || "Paste your official character page link"}
              className="flex-1 min-w-0 rounded-xl border border-white/10 bg-[#050814]/70 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60"
            />
            <button
              type="button"
              disabled={linkBusy || !link.trim()}
              onClick={runResolveLink}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50 shrink-0"
            >
              {linkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              {linkBusy ? (t("verify_checking") || "Checking") : (t("verify_linkButton") || "Link")}
            </button>
          </div>
          {linkError && <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-widest text-red-400">{linkError}</p>}
          {linkResult && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3">
              <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">{t("mychars_linked") || "Character linked"}</p>
            </div>
          )}
          {linkResult && Number(linkResult.level) < 45 && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-red-400">{t("apply_levelRequired") || "Boosting offers require Level 45+"} — Level {linkResult.level}</span>
            </div>
          )}
        </div>

        {/* List */}
        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : myChars.length === 0 ? (
          <div className="tn-light relative w-full rounded-3xl bg-[#070a1c]/70 backdrop-blur-xl border border-white/10 p-8 text-center">
            <IdCard className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-300">{t("mychars_empty") || "No characters linked yet"}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">{t("mychars_emptyHint") || "Paste your official character page link above to add your first character"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myChars.map((c: any) => {
              const href = charProfileHref(c);
              const cls = c.aionClass || c.gameClassLabel || "";
              return (
                <div key={String(c.id)} className="tn-light relative rounded-2xl border border-white/10 bg-black/40 overflow-hidden hover:border-[#00ffff]/40 transition-all flex gap-3 p-3">
                  {/* NC-style: the circular in-game portrait with the class emblem
                      stacked beneath it, smaller. */}
                  <CharacterPortraitBadge
                    src={c.portraitUrl}
                    aionClass={cls || "dps"}
                    level={c.level}
                    size="lg"
                    fallback={c.name || ""}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[12px] font-black text-white uppercase tracking-wider truncate">{c.name || "Character"}</span>
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full border border-white/15 bg-white/5 text-[7px] font-black uppercase tracking-widest text-slate-300">{AION2_REGION_LABEL}</span>
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300 truncate">{cls || "—"} · {c.serverName || "—"}</span>
                    <span className="flex items-center gap-2 text-[9px] font-bold text-slate-400 tabular-nums">
                      <span className="text-cyan-300">{c.level || "—"}</span> LVL
                    </span>
                    {/* Official icons + official combat-power form. */}
                    <CharacterPowerStats
                      combatPower={Number(c.cpAp) || Number(c.combatPower) || 0}
                      itemLevel={Number(c.itemLevel) || 0}
                      size="sm"
                      className="mt-0.5"
                    />
                    {Number(c.level) < 45 && (
                      <span className="inline-flex w-fit rounded border border-red-500/40 bg-red-500/10 px-1.5 py-px text-[7px] font-black uppercase tracking-widest text-red-400">{t("apply_levelRequired") || "Boosting offers require Level 45+"}</span>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {href && (
                        <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/40 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-500/20 transition-all">
                          <ExternalLink className="w-2.5 h-2.5" /> {t("verify_fullProfile") || "Full Profile"}
                        </a>
                      )}
                      {confirmRemoveId === String(c.id) ? (
                        <button
                          type="button"
                          onClick={() => removeChar(c)}
                          disabled={!!removingId}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 border border-red-500/50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-red-300 hover:bg-red-500/30 transition-all"
                        >
                          {removingId === String(c.id) ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <X className="w-2.5 h-2.5" />} {t("mychars_confirmRemove") || "Confirm remove?"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(String(c.id))}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/40 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-red-300 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> {t("mychars_remove") || "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-xl border px-4 py-2.5 text-[9px] font-black uppercase tracking-widest shadow-2xl ${toast.type === "ok" ? "border-emerald-500/40 bg-[#07120b] text-emerald-300" : "border-red-500/40 bg-[#140708] text-red-300"}`}
        >
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
}