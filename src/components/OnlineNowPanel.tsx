"use client";

/**
 * The "Online Now" roster, as its own panel.
 *
 * This used to be a tab inside the DM panel, which meant finding out who was
 * online meant opening your messages and then clicking across. It is a
 * different job from messaging and it gets used more often, so it lives on its
 * own — narrower than the DM panel and pinned closer to the edge, the way
 * Discord's member list sits.
 *
 * Rows are ordered by rank first (see `@/lib/onlinePresence`): the higher rank
 * is nearer the top, then whoever was seen most recently, then the name.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { MessageCircle, Radio, Search, X } from "lucide-react";
import { buildOnlineRow, sortOnlineRows, type OnlineRow } from "@/lib/onlinePresence";
import { refFor, refMatches } from "@/lib/playerIdentity";
import { resolveProfileImage, resolveProfileDisplayName, profileImgClass } from "@/lib/profileImage";

/** Rows visible before the panel starts scrolling. */
const VISIBLE_ROWS = 40;

function OnlineRowView({ row }: { row: OnlineRow }) {
  const { user } = row;
  const img = resolveProfileImage(user);

  const openDm = () => {
    // The DM panel owns the conversation, so it takes over the screen: get out
    // of the way rather than stacking two panels on top of each other.
    window.dispatchEvent(new CustomEvent("open-dm-chat", { detail: { userId: String(user.id) } }));
    window.dispatchEvent(new CustomEvent("close-online"));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDm}
      onKeyDown={(e) => { if (e.key === "Enter") openDm(); }}
      title={`${row.rank}${row.characterName ? ` · ${row.characterName}` : ""}`}
      className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-left transition-colors hover:border-white/5 hover:bg-white/[0.05]"
    >
      <div className="relative h-9 w-9 shrink-0">
        <img
          src={img}
          alt=""
          className={`${profileImgClass(img, "h-9 w-9 rounded-full border border-white/10")}`}
        />
        <img
          src={row.rankImage}
          alt={row.rank}
          className="pointer-events-none absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 object-contain"
        />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0c0c18] bg-green-400" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[11px] font-black text-white/90 transition-colors group-hover:text-white">
            {resolveProfileDisplayName(user)}
          </p>
          <span
            className="shrink-0 rounded border px-1 py-px text-[6px] font-black uppercase tracking-wider"
            style={{
              color: row.rankColor,
              borderColor: `${row.rankColor}40`,
              backgroundColor: `${row.rankColor}12`,
            }}
          >
            {row.rank}
          </span>
        </div>
        {row.characterName || row.serverName ? (
          <p className="mt-px truncate text-[9px] text-gray-500">
            {[
              row.characterName,
              row.className,
              row.serverName ? `· ${row.serverName}` : "",
              row.characterLevel > 0 ? `· Lv${row.characterLevel}` : "",
            ]
              .filter(Boolean)
              .join(" ")}
          </p>
        ) : (
          <p className="mt-px truncate text-[9px] text-gray-600">@{user?.username || "—"}</p>
        )}
      </div>

      <MessageCircle className="h-3.5 w-3.5 shrink-0 text-gray-700 transition-colors group-hover:text-[#00ffff]" />
    </div>
  );
}

export default function OnlineNowPanel() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Prefer the account row: the session cookie alone can be a login behind, and
  // the row still tracks the Discord id after a rename.
  const myRef = refFor(
    String(data?.me?.id || (session?.user as any)?.id || ""),
    String(data?.me?.username || (session?.user as any)?.username || "")
  );
  const currentUserId = myRef.id;
  const isCommunity = pathname === "/community";

  useEffect(() => {
    const open = () => {
      setIsOpen(true);
      // Both panels sit on the right edge, so one has to yield. Whoever was
      // opened last wins.
      window.dispatchEvent(new CustomEvent("close-dm"));
    };
    const close = () => setIsOpen(false);
    window.addEventListener("open-online", open);
    window.addEventListener("close-online", close);
    return () => {
      window.removeEventListener("open-online", open);
      window.removeEventListener("close-online", close);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let alive = true;

    const poll = () => {
      fetch("/api/data")
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          setData((prev: any) => (JSON.stringify(prev) === JSON.stringify(d) ? prev : d));
        })
        .catch(() => {});
    };

    poll();
    const visible = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, 4000);
    // A background tab still has to report in, or a player signed in on a second
    // tab reads as offline. Browsers throttle hidden tabs hard, so this runs on
    // its own slow cadence rather than relying on that.
    const hidden = setInterval(() => {
      if (document.visibilityState !== "visible") poll();
    }, 45_000);

    return () => {
      alive = false;
      clearInterval(visible);
      clearInterval(hidden);
    };
  }, [status]);

  const rows = useMemo(() => {
    const users: any[] = Array.isArray(data?.registeredUsers) ? data.registeredUsers : [];
    const me = users.find((u: any) => String(u?.id) === String(currentUserId));
    const blocked = new Set<string>(
      (Array.isArray(me?.blocked) ? me.blocked : []).map((b: any) => String(b))
    );

    return sortOnlineRows(
      users
        .filter(
          (u: any) =>
            u?.username &&
            String(u.id) !== currentUserId &&
            !refMatches(myRef, u.username) &&
            u.online === true &&
            !blocked.has(String(u.id))
        )
        .map(buildOnlineRow)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.registeredUsers, currentUserId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        resolveProfileDisplayName(r.user),
        r.user?.username,
        r.characterName,
        r.serverName,
        r.className,
        r.rank,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }, [rows, query]);

  const visible = showAll ? filtered : filtered.slice(0, VISIBLE_ROWS);
  const hiddenCount = filtered.length - visible.length;

  const close = useCallback(() => setIsOpen(false), []);

  if (status !== "authenticated" || isCommunity) return null;

  return (
    <div
      className={`fixed right-3 top-[5.25rem] z-[70] w-[min(320px,calc(100vw-1.5rem))] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-6 opacity-0"
        }`}
      >
        <div className="relative flex max-h-[calc(100vh-7.5rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c0c18] to-black shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_32px_rgba(34,197,94,0.07)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-green-400/8 blur-3xl" />

          <div className="relative flex items-center gap-2 border-b border-white/5 bg-black/40 px-3.5 py-3">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-white">Online Now</h3>
              <p className="text-[8px] text-gray-500">
                {rows.length} online · highest rank first
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close online list"
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative border-b border-white/5 px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 focus-within:border-green-500/40">
              <Search className="h-3 w-3 shrink-0 text-gray-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter players…"
                className="w-full bg-transparent text-[10px] text-white placeholder-gray-600 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear filter"
                  className="text-gray-600 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="relative flex-1 overflow-y-auto overscroll-contain p-1.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center px-3 py-10 text-center">
                <Radio className="mb-2 h-5 w-5 text-gray-700" />
                <p className="text-[10px] italic text-gray-600">
                  {query ? "No player matches that." : "No one is online right now — be the first in!"}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {visible.map((row) => (
                  <OnlineRowView key={String(row.user?.id)} row={row} />
                ))}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="mt-1 w-full rounded-lg border border-white/5 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Show {hiddenCount} more
                  </button>
                )}
                {showAll && filtered.length > VISIBLE_ROWS && (
                  <button
                    type="button"
                    onClick={() => setShowAll(false)}
                    className="mt-1 w-full rounded-lg border border-white/5 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

