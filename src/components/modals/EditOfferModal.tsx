"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Paintbrush, Save, Loader2, Users, Coins, Layers, MapPin, FileText, AlertTriangle } from "lucide-react";
import { AION2_CLASSES, AION2_ROLE_LABEL, aionClassRole } from "@/lib/aionClassMeta";
import { classThumbUrl } from "@/lib/classThumb";

const EDIT_REGIONS = ["EU", "NA (EAST)", "NA (WEST)"];
const MAX_CLASS_COUNT = 4;

interface EditOfferPayload {
  lobbyId: string;
  title: string;
  notes: string;
  runsCount: number;
  pricePerRun: number;
  serverRegion: string;
  customBg?: string;
  requiredClasses?: string[];
}

interface EditOfferModalProps {
  lobby: any;
  registeredUsers?: any[];
  onClose: () => void;
  onSaved: (updated: any) => void;
  onError?: (msg: string) => void;
}

export default function EditOfferModal({ lobby, registeredUsers = [], onClose, onSaved, onError }: EditOfferModalProps) {
  const owner = registeredUsers.find((u: any) => String(u.id) === String(lobby?.ownerId)) || null;
  const [title, setTitle] = useState(String(lobby?.title || "").slice(0, 60));
  const [notes, setNotes] = useState(String(lobby?.notes || "").slice(0, 400));
  const [price, setPrice] = useState(String(Number(lobby?.pricePerRun) || 0));
  const [runs, setRuns] = useState(String(Number(lobby?.runsCount) || 1));
  const [region, setRegion] = useState(String(lobby?.serverRegion || "EU").toUpperCase());
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const counts: Record<string, number> = {};
    const req: unknown = lobby?.requiredClasses;
    if (Array.isArray(req)) {
      for (const c of req) counts[String(c || "")] = (counts[String(c || "")] || 0) + 1;
    } else if (lobby?.roles && typeof lobby.roles === "object") {
      for (const [k, v] of Object.entries(lobby.roles as Record<string, unknown>)) {
        if ((AION2_CLASSES as readonly string[]).includes(k)) counts[k] = Number(v) || 0;
      }
    }
    if (Object.keys(counts).length) setClassCounts(counts);
  }, [lobby?.id, lobby?.requiredClasses, lobby?.roles]);

  const bump = (cls: string, delta: number) => {
    setClassCounts((prev) => {
      const cur = prev[cls] || 0;
      const next = Math.min(MAX_CLASS_COUNT, Math.max(0, cur + delta));
      const upd = { ...prev };
      if (next === 0) delete upd[cls];
      else upd[cls] = next;
      return upd;
    });
  };

  const pickAll = (amount: number) => {
    setClassCounts((prev) => {
      const upd: Record<string, number> = {};
      for (const c of AION2_CLASSES) {
        const cur = prev[c] || 0;
        if (cur > 0) upd[c] = cur;
      }
      if (amount > 0) for (const c of AION2_CLASSES) if (!upd[c]) upd[c] = amount;
      return upd;
    });
  };

  const upcomingClasses = useMemo(() => {
    const req: string[] = [];
    for (const [c, n] of Object.entries(classCounts)) for (let i = 0; i < n; i++) req.push(c);
    return req;
  }, [classCounts]);

  const submit = async () => {
    setSaving(true);
    setError("");
    const payload: EditOfferPayload = {
      lobbyId: String(lobby.id),
      title: title.trim().slice(0, 60) || String(lobby.title || ""),
      notes: notes.trim().slice(0, 400),
      runsCount: Math.min(99, Math.max(1, Math.round(Number(runs)) || 1)),
      pricePerRun: Math.min(99999, Math.max(0, Number(price) || 0)),
      serverRegion: region,
    };
    if (upcomingClasses.length > 0) payload.requiredClasses = upcomingClasses;
    else payload.requiredClasses = [];

    try {
      const res = await fetch("/api/lobbies/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Could not save — try again.");
        if (onError) onError(d.error || "edit_failed");
        return;
      }
      onSaved(d.lobby);
    } catch {
      setError("Network error — try again.");
      if (onError) onError("err_network");
    } finally {
      setSaving(false);
    }
  };

  const ownerName = String(owner?.displayName || owner?.name || lobby?.ownerDiscordName || "Commander").slice(0, 30);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => !saving && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="tn-light relative w-full max-w-xl rounded-3xl border border-cyan-500/25 bg-[#070a18]/95 p-6 shadow-[0_0_70px_rgba(0,229,255,0.15)] max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10">
              <Paintbrush className="h-5 w-5 text-cyan-300" />
            </span>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-white">Edit Offer</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Commander · {ownerName}</p>
            </div>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 transition-all hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400"><FileText className="h-3 w-3 text-cyan-400" /> Title</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            maxLength={60}
            placeholder="Offer title"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-black text-white outline-none transition-all focus:border-cyan-400/50"
          />
        </div>

        {/* Price + Runs + Region */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400"><Coins className="h-3 w-3 text-amber-300" /> Price / run (M)</p>
            <input type="number" min={0} max={99999} step="0.01" value={price} onChange={(e) => setPrice(e.target.value.slice(0, 8))} className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-black text-amber-200 outline-none focus:border-cyan-400/50" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400"><Layers className="h-3 w-3 text-cyan-400" /> Runs</p>
            <input type="number" min={1} max={99} value={runs} onChange={(e) => setRuns(e.target.value.slice(0, 3))} className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-black text-white outline-none focus:border-cyan-400/50" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400"><MapPin className="h-3 w-3 text-violet-300" /> Region</p>
            <div className="mt-2 grid grid-cols-1 gap-1">
              {EDIT_REGIONS.map((r) => (
                <button key={r} type="button" onClick={() => setRegion(r)} className={`rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all ${region === r ? "bg-violet-500/25 text-violet-200 border border-violet-400/40" : "border border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/25"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400"><FileText className="h-3 w-3 text-cyan-400" /> Notes / requirements</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 400))}
            maxLength={400}
            rows={3}
            placeholder="Additional requirements..."
            className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] font-bold text-gray-200 outline-none transition-all focus:border-cyan-400/50"
          />
        </div>

        {/* Class requirements */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400"><Users className="h-3 w-3 text-cyan-400" /> Class requirements <span className="text-gray-600">(0 = any)</span></p>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => pickAll(0)} className="rounded-md border border-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-gray-400 hover:border-white/25">Any</button>
              <button type="button" onClick={() => pickAll(1)} className="rounded-md border border-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-gray-400 hover:border-white/25">1 each</button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AION2_CLASSES.map((c) => {
              const n = classCounts[c] || 0;
              return (
                <div key={c} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all ${n > 0 ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-white/[0.02]"}`}>
                  <img src={classThumbUrl(c === "Spiritmaster" ? "Elementalist" : c)} alt="" className="h-6 w-6 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <span className={`min-w-0 flex-1 truncate text-xs font-black ${n > 0 ? "text-cyan-200" : "text-gray-300"}`}>{c}</span>
                  <span className="text-[8px] font-black tracking-widest text-gray-500">{AION2_ROLE_LABEL[aionClassRole(c)] || aionClassRole(c).toUpperCase()}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => bump(c, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 text-gray-300 hover:border-cyan-400/40 hover:text-white">−</button>
                    <span className={`w-5 text-center text-xs font-black ${n > 0 ? "text-cyan-200" : "text-gray-500"}`}>{n}</span>
                    <button type="button" onClick={() => bump(c, 1)} disabled={n >= MAX_CLASS_COUNT} className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 text-gray-300 hover:border-cyan-400/40 hover:text-white disabled:opacity-30">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
            <AlertTriangle className="h-3 w-3" /> {error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={submit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:from-[#08a3c4] hover:to-[#5b4ddb] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}