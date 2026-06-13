"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Layers, Check } from "lucide-react";
import { getOfferThreadStatusMeta } from "@/lib/lobbyLifecycle";

interface OfferThreadSelectProps {
  threads: any[];
  value: string;
  onChange: (threadId: string) => void;
}

function threadMeta(thread: any, index: number) {
  const status = thread.status || "standby";
  return {
    index: index + 1,
    runs: thread.runsCount || 1,
    gold: thread.goldPerRun || 0,
    status,
    statusMeta: getOfferThreadStatusMeta(status, thread),
    members: (thread.accepted || []).length,
  };
}

export default function OfferThreadSelect({ threads, value, onChange }: OfferThreadSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedIndex = threads.findIndex((t) => String(t.id) === String(value));
  const selected = selectedIndex >= 0 ? threads[selectedIndex] : threads[0];
  const selectedMeta = selected ? threadMeta(selected, selectedIndex >= 0 ? selectedIndex : 0) : null;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!selected || !selectedMeta) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group relative flex h-10 max-w-[min(100vw-2rem,280px)] items-center gap-2.5 overflow-hidden rounded-full border border-[#00ffff]/25 bg-gradient-to-r from-black/80 via-[#0a0a14]/90 to-black/80 px-3.5 pr-3 text-left shadow-[0_0_24px_rgba(0,255,255,0.08)] outline-none transition-all hover:border-[#00ffff]/45 hover:shadow-[0_0_32px_rgba(0,255,255,0.14)] focus-visible:border-[#00ffff]/60"
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,255,255,0.06), transparent)",
          }}
        />
        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#00ffff]/30 bg-[#00ffff]/10">
          <Layers className="h-3 w-3 text-[#00ffff]" />
        </span>
        <span className="relative min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-[0.12em] text-white">
          <span className="text-[#00ffff]">T{selectedMeta.index}</span>
          <span className="mx-1.5 text-white/20">·</span>
          <span>{selectedMeta.runs}× {selectedMeta.gold}K</span>
          <span className="mx-1.5 text-white/20">·</span>
          <span style={{ color: selectedMeta.statusMeta.color }}>{selectedMeta.statusMeta.label}</span>
        </span>
        {threads.length > 1 && (
          <span className="relative shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-gray-400">
            {threads.length}
          </span>
        )}
        <ChevronDown
          className={`relative h-3.5 w-3.5 shrink-0 text-[#00ffff]/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="listbox"
            className="absolute left-0 top-[calc(100%+0.5rem)] z-[120] w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-[#00ffff]/20 bg-[#05050a]/95 shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(0,255,255,0.08)] backdrop-blur-xl"
          >
            <div className="border-b border-white/5 px-4 py-2.5">
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-gray-500">
                Mission Threads
              </p>
              <p className="mt-0.5 text-[9px] font-bold text-gray-600">
                Split runs after kick or leave
              </p>
            </div>
            <div className="custom-scrollbar max-h-[min(50vh,280px)] overflow-y-auto p-1.5">
              {threads.map((thread, i) => {
                const meta = threadMeta(thread, i);
                const isActive = String(thread.id) === String(value);
                return (
                  <button
                    key={thread.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(String(thread.id));
                      setOpen(false);
                    }}
                    className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all last:mb-0 ${
                      isActive
                        ? "bg-[#00ffff]/10 ring-1 ring-[#00ffff]/25"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black"
                      style={{
                        color: meta.statusMeta.color,
                        borderColor: `${meta.statusMeta.color}40`,
                        backgroundColor: meta.statusMeta.bg,
                      }}
                    >
                      {meta.index}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[10px] font-black uppercase tracking-wider text-white">
                          {meta.runs}× {meta.gold}K
                        </span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-widest"
                          style={{
                            color: meta.statusMeta.color,
                            backgroundColor: meta.statusMeta.bg,
                            boxShadow: `0 0 12px ${meta.statusMeta.glow}`,
                          }}
                        >
                          {meta.statusMeta.label}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-gray-600">
                        <span>{meta.members} operative{meta.members !== 1 ? "s" : ""}</span>
                        {isActive && (
                          <span className="text-[#00ffff]">· viewing</span>
                        )}
                      </span>
                    </span>
                    {isActive ? (
                      <Check className="h-4 w-4 shrink-0 text-[#00ffff]" />
                    ) : (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: meta.statusMeta.color,
                          boxShadow: `0 0 8px ${meta.statusMeta.glow}`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
