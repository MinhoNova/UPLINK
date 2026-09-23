"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Zap, ShieldCheck, Check, ChevronDown, IdCard, RefreshCw } from "lucide-react";
import CharacterPortraitBadge from "@/components/aion2/CharacterPortraitBadge";

export interface AionAutoApply {
  enabled: boolean;
  aionClass: string;
  itemLevel: number;
  combatPower: number;
}

export interface AionAutoApplyModalProps {
  registeredUsers: any[];
  meId: string;
  meName?: string;
  onSave: (next: AionAutoApply) => Promise<void> | void;
  autoAccept?: boolean;
  onAutoAcceptChange?: (next: boolean) => Promise<void> | void;
}

export default function AionAutoApplyModal({
  registeredUsers,
  meId,
  meName,
  onSave,
  autoAccept = false,
  onAutoAcceptChange,
}: AionAutoApplyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [characters, setCharacters] = useState<any[]>([]);
  const [selCharId, setSelCharId] = useState("");
  const [charDropOpen, setCharDropOpen] = useState(false);

  const me = registeredUsers.find((u: any) => String(u.id) === String(meId));
  const [cfg, setCfg] = useState<AionAutoApply>({
    enabled: false,
    aionClass: "",
    itemLevel: 60,
    combatPower: 0,
  });

  useEffect(() => {
    const handler = () => setIsOpen((v) => !v);
    window.addEventListener("toggle-auto-apply-settings", handler);
    return () => window.removeEventListener("toggle-auto-apply-settings", handler);
  }, []);

  useEffect(() => {
    const stored = me?.aionAutoApply;
    if (stored && typeof stored === "object") {
      setCfg({
        enabled: stored.enabled === true,
        aionClass: typeof stored.aionClass === "string" ? stored.aionClass : "",
        itemLevel: Number(stored.itemLevel) || 60,
        combatPower: Number(stored.combatPower) || 0,
      });
    } else {
      setCfg({ enabled: false, aionClass: "", itemLevel: 60, combatPower: 0 });
    }
  }, [meId, registeredUsers, isOpen]);

  useEffect(() => {
    if (!isOpen || !meId) return;
    let alive = true;
    fetch("/api/public-data")
      .then((r) => r.json())
      .then((d: any) => {
        if (!alive) return;
        const list = (Array.isArray(d.characters) ? d.characters : []).filter((c: any) => String(c.userId) === String(meId));
        setCharacters(list);
        setSelCharId((prev) => {
          if (prev && list.some((c: any) => String(c.id) === String(prev))) return prev;
          return list[0] ? String(list[0].id) : "";
        });
        if (list[0]) setCfg((p) => ({ ...p, ...charPatch(list[0]) }));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [isOpen, meId]);

  if (!isOpen) return null;

  const commit = async (next: AionAutoApply) => {
    setError("");
    if (!meId) { setError("Sign in to use auto-apply"); return; }
    if (next.enabled && !next.aionClass) { setError("Pick a class first"); return; }
    setSaving(true);
    try {
      await onSave(next);
      setCfg(next);
    } catch {
      setError("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<AionAutoApply>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    commit(next);
  };

  const selectedChar = characters.find((c: any) => String(c.id) === String(selCharId)) || characters[0];

  const charPatch = (c: any): Partial<AionAutoApply> => {
    const patch: Partial<AionAutoApply> = {};
    const cls = c?.aionClass || c?.gameClassLabel || c?.class || "";
    if (cls) patch.aionClass = cls;
    if (Number(c?.itemLevel) > 0) patch.itemLevel = Number(c.itemLevel);
    if (Number(c?.combatPower) > 0) patch.combatPower = Number(c.combatPower);
    return patch;
  };

  const pickChar = (c: any) => {
    setSelCharId(String(c.id));
    setCharDropOpen(false);
    set({ ...charPatch(c), enabled: true });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => !saving && setIsOpen(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="tn-light relative w-full max-w-lg rounded-3xl border border-cyan-500/25 bg-[#0a0f26]/95 p-6 shadow-[0_0_60px_rgba(0,229,255,0.18)]"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10">
              <Zap className="h-5 w-5 text-cyan-300" />
            </span>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-white">Auto-Apply</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                {meName ? `Operative · ${meName}` : "Unlinked operative"}
              </p>
            </div>
          </div>
          <button
            onClick={() => !saving && setIsOpen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 transition-all hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toggle */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className={`h-4 w-4 ${cfg.enabled ? "text-emerald-400" : "text-gray-500"}`} />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Automatic applying</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                {cfg.enabled ? "Applies to matching offers automatically" : "Off — manual apply only"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!meId) { setError("Sign in to use auto-apply"); return; }
              if (!selectedChar) { setError("Link a character on an offer first — auto-apply needs your character"); return; }
              set({ enabled: !cfg.enabled });
            }}
            disabled={saving}
            className={`relative h-7 w-13 rounded-full transition-all cursor-pointer disabled:opacity-50 ${cfg.enabled ? "bg-emerald-500" : "bg-white/15"}`}
            style={{ width: 52 }}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${cfg.enabled ? "left-[26px]" : "left-1"}`}
            />
          </button>
        </div>

        {/* Auto-accept toggle */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Zap className={`h-4 w-4 ${autoAccept ? "text-fuchsia-400" : "text-gray-500"}`} />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Auto-accept applicants</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                {autoAccept ? "Accept matching applicants instantly" : "Popup + sound to review each offer"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAutoAcceptChange?.(!autoAccept)}
            disabled={saving}
            className={`relative h-7 rounded-full transition-all cursor-pointer disabled:opacity-50 ${autoAccept ? "bg-fuchsia-500" : "bg-white/15"}`}
            style={{ width: 52 }}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${autoAccept ? "left-[26px]" : "left-1"}`}
            />
          </button>
        </div>

        {/* My verified character */}
        <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5">
          <IdCard className="h-3 w-3 text-emerald-400" /> My character
          {characters.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-emerald-400/80">
              <RefreshCw className="h-2.5 w-2.5" /> VERIFIED
            </span>
          )}
        </p>
        {characters.length === 0 ? (
          <div className="mt-2 rounded-xl border border-orange-500/25 bg-orange-500/[0.06] p-3 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-300">
              Required — you must link your official character page first (open an offer and paste your link)
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white"
            >
              <IdCard className="h-3 w-3" /> Open an offer & paste your link
            </button>
          </div>
        ) : (
          <div className="mt-2 relative">
            <button
              type="button"
              onClick={() => setCharDropOpen((v) => !v)}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3 text-left transition-all hover:border-emerald-500/50 flex items-center gap-3"
            >
              <CharacterPortraitBadge
                src={selectedChar?.portraitUrl}
                aionClass={selectedChar?.aionClass || selectedChar?.gameClassLabel || "dps"}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-emerald-200">{selectedChar?.name || "—"}</p>
                <p className="truncate text-[8px] font-black uppercase tracking-widest text-cyan-300">{selectedChar?.aionClass || selectedChar?.gameClassLabel || "Class"}</p>
                <p className="truncate text-[8px] font-bold uppercase tracking-widest text-emerald-300/80">
                  {selectedChar?.raceName ? `${selectedChar.raceName} · ` : ""}{selectedChar?.serverName || ""}{selectedChar?.region ? ` · ${String(selectedChar.region).toUpperCase()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-center">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-500">Lv</p>
                  <p className="text-sm font-black text-white tabular-nums">{selectedChar?.level ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-violet-400">Item Lv</p>
                  <p className="text-sm font-black text-violet-300 tabular-nums">{Number(selectedChar?.itemLevel) > 0 ? Number(selectedChar.itemLevel).toLocaleString() : "—"}</p>
                </div>
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-amber-400">CP</p>
                  <p className="text-sm font-black text-amber-300 tabular-nums">{Number(selectedChar?.combatPower) > 0 ? Number(selectedChar.combatPower).toLocaleString() : "—"}</p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-emerald-300 transition-transform ${charDropOpen ? "rotate-180" : ""}`} />
            </button>
            {charDropOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-y-auto custom-scrollbar rounded-xl border border-white/10 bg-[#0a0f26] shadow-2xl max-h-[200px]">
                {characters.map((c: any) => {
                  const isSel = String(c.id) === String(selectedChar?.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickChar(c)}
                      className={`w-full flex items-center gap-3 p-2.5 text-left transition-all ${isSel ? "bg-emerald-500/10 text-emerald-300" : "text-white hover:bg-white/5"}`}
                    >
                      <CharacterPortraitBadge
                        src={c.portraitUrl}
                        aionClass={c.aionClass || c.gameClassLabel || "dps"}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-black">{c.name}</span>
                        <span className="block truncate text-[7px] font-black uppercase tracking-widest text-slate-500">{c.aionClass || c.gameClassLabel} · {c.serverName || ""}</span>
                      </span>
                      <span className="text-[8px] font-black text-violet-300 tabular-nums shrink-0">{Number(c.itemLevel) > 0 ? c.itemLevel : "—"} iLvl</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Auto-applies as — values always come from the linked character */}
        <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5">
            <IdCard className="h-3 w-3 text-cyan-400" /> Auto-applies as
          </p>
          <p className="mt-1.5 text-xs font-black text-white truncate">
            {cfg.aionClass ? <span className="text-cyan-300">{cfg.aionClass}</span> : <span className="text-slate-500">{(selectedChar?.aionClass || selectedChar?.gameClassLabel || "—")}</span>}
            <span className="text-slate-500"> · </span>
            <span className="text-violet-300">ilvl {Number(cfg.itemLevel) > 0 ? Number(cfg.itemLevel).toLocaleString() : "—"}</span>
            {Number(cfg.combatPower) > 0 ? (<><span className="text-slate-500"> · </span><span className="text-amber-300">CP {Number(cfg.combatPower).toLocaleString()}</span></>) : null}
          </p>
        </div>

        {error && (
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{error}</p>
        )}

        {saving && cfg.enabled && (
          <p className="mt-3 text-center text-[9px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">
            Saving...
          </p>
        )}
        {!saving && cfg.enabled && cfg.aionClass && (
          <p className="mt-3 text-center text-[9px] font-black uppercase tracking-widest text-emerald-400">
            {selectedChar ? (<span className="text-white">{selectedChar.name}</span>) : null}
            {selectedChar ? " · " : ""}will auto-apply <span className="text-cyan-300">{cfg.aionClass}</span> · ilvl {cfg.itemLevel}
            {cfg.combatPower > 0 ? ` · CP ${cfg.combatPower.toLocaleString()}` : ""} to open offers
          </p>
        )}

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => !saving && setIsOpen(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:from-[#08a3c4] hover:to-[#5b4ddb]"
          >
            <Check className="h-3.5 w-3.5" /> Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}