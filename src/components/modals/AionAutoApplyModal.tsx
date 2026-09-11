"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Zap, ShieldCheck, Users, Check } from "lucide-react";
import { AION2_CLASSES, AION2_ROLE_LABEL, aionClassRole, AION2_LEVEL_MAX } from "@/lib/aionClassMeta";

export interface AionAutoApply {
  enabled: boolean;
  aionClass: string;
  itemLevel: number;
}

export interface AionAutoApplyModalProps {
  registeredUsers: any[];
  meId: string;
  meName?: string;
  onSave: (next: AionAutoApply) => Promise<void> | void;
}

export default function AionAutoApplyModal({
  registeredUsers,
  meId,
  meName,
  onSave,
}: AionAutoApplyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const me = registeredUsers.find((u: any) => String(u.id) === String(meId));
  const [cfg, setCfg] = useState<AionAutoApply>({
    enabled: false,
    aionClass: "",
    itemLevel: 60,
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
      });
    } else {
      setCfg({ enabled: false, aionClass: "", itemLevel: 60 });
    }
  }, [meId, registeredUsers, isOpen]);

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

  const clampLevel = (v: number) =>
    Math.min(AION2_LEVEL_MAX, Math.max(1, Math.round(v) || 1));

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
            onClick={() => set({ enabled: !cfg.enabled })}
            disabled={saving}
            className={`relative h-7 w-13 rounded-full transition-all cursor-pointer disabled:opacity-50 ${cfg.enabled ? "bg-emerald-500" : "bg-white/15"}`}
            style={{ width: 52 }}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${cfg.enabled ? "left-[26px]" : "left-1"}`}
            />
          </button>
        </div>

        {/* Class */}
        <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5">
          <Users className="h-3 w-3 text-cyan-400" /> My class
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {AION2_CLASSES.map((c) => {
            const isActive = cfg.aionClass === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => set({ aionClass: c, enabled: true })}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${isActive ? "border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_16px_rgba(0,229,255,0.15)]" : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"}`}
              >
                <img
                  src={`/classes/${c === "Spiritmaster" ? "Elementalist" : c}.png`}
                  alt=""
                  className="h-6 w-6 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                />
                <span className={`min-w-0 flex-1 truncate text-xs font-black ${isActive ? "text-cyan-200" : "text-gray-200"}`}>{c}</span>
                <span className="text-[8px] font-black tracking-widest text-gray-500">{AION2_ROLE_LABEL[aionClassRole(c)] || aionClassRole(c).toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Item Level */}
        <div className="mt-5">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Item Level</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => set({ itemLevel: clampLevel(cfg.itemLevel - 1) })}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-lg font-black text-gray-300 transition-all hover:border-white/25 hover:text-white"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={AION2_LEVEL_MAX}
              value={cfg.itemLevel}
              onChange={(e) => set({ itemLevel: clampLevel(Number(e.target.value) || 1) })}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-sm font-black text-white outline-none transition-all focus:border-cyan-400/50"
            />
            <button
              type="button"
              onClick={() => set({ itemLevel: clampLevel(cfg.itemLevel + 1) })}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-lg font-black text-gray-300 transition-all hover:border-white/25 hover:text-white"
            >
              +
            </button>
          </div>
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
            Will auto-apply <span className="text-cyan-300">{cfg.aionClass}</span> · ilvl {cfg.itemLevel} to open offers
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