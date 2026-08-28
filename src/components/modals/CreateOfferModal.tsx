"use client";

import {
  X,
  Coins,
  Send,
  Zap,
  ShieldCheck,
  ChevronDown,
  Minus,
  Plus,
  Bookmark,
  Trash2,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { memo, useMemo, useState, useCallback, useEffect, useReducer, useRef } from "react";
import { createPortal } from "react-dom";
import { AION_SERVICES, AION_CATEGORIES, formatUsd, AionService } from "@/lib/aionServices";

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormData: any;
  onSubmit: (e: React.FormEvent, data: any) => void;
  submitError?: string;
  myVfxBg?: string;
  offerDrafts?: { id: string; name: string; savedAt: number; formData: any }[];
  onSaveOfferDraft?: (name: string, formData: any) => void;
  onDeleteOfferDraft?: (id: string) => void;
  onDraftLoaded?: (name: string) => void;
}

type FormAction =
  | { type: "SET"; payload: Partial<any> }
  | { type: "RESET"; payload: any };

function formReducer(prev: any, action: FormAction): any {
  switch (action.type) {
    case "SET":
      return { ...prev, ...action.payload };
    case "RESET":
      return action.payload;
    default:
      return prev;
  }
}

const CATEGORY_ICON: Record<string, string> = {
  Currency: "#ffd700",
  Leveling: "#8a2be2",
  Raids: "#ff007f",
  Dungeons: "#00ffff",
  Collections: "#22d3ee",
  PVP: "#f97316",
  Professions: "#a855f7",
};

const CategoryDropdown = memo(function CategoryDropdown({
  category,
  onChange,
}: {
  category: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="relative z-30" onMouseDown={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="bg-black/50 border border-white/10 rounded-xl px-5 py-3.5 text-white font-black text-base outline-none focus:border-[#00ffff]/50 transition flex items-center gap-3 hover:border-[#00ffff]/30"
      >
        <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
          <Zap className="w-6 h-6" style={{ color: "#00ffff" }} />
        </div>
        <span className="flex-1 text-left" style={{ color: "#00ffff" }}>{category || "Choose Service"}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-[#0a0a16] border border-white/10 rounded-xl overflow-hidden z-[200] shadow-2xl w-[16rem]">
          <div className="sticky top-0 bg-[#0a0a16] px-4 py-2 border-b border-white/5">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Service Category</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {AION_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => { onChange(cat); setOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-5 py-3 text-left text-base font-black transition hover:bg-white/5 ${
                  category === cat ? "bg-[#00ffff]/10 text-[#00ffff]" : "text-white"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center">
                  <Coins className="w-5 h-5" style={{ color: CATEGORY_ICON[cat] || "#00ffff" }} />
                </div>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const ServiceGrid = memo(function ServiceGrid({
  category,
  selectedId,
  onSelect,
}: {
  category: string;
  selectedId: string;
  onSelect: (s: AionService) => void;
}) {
  const services = AION_SERVICES.filter(s => s.category === category);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {services.map(s => {
        const active = s.id === selectedId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl border text-left transition cursor-pointer ${
              active
                ? "border-[#00ffff]/40 bg-[#00ffff]/5 shadow-[0_0_12px_rgba(0,255,255,0.1)]"
                : "border-white/10 bg-black/30 hover:border-white/25"
            }`}
          >
            <span className={`text-[11px] font-black leading-tight ${active ? "text-[#00ffff]" : "text-white"}`}>{s.name}</span>
            <span className="text-[9px] font-bold text-gray-400 leading-snug">{s.description}</span>
            <span className="text-[10px] font-black" style={{ color: "#ffd700" }}>
              from {formatUsd(s.basePriceUsd)}
              {s.priceUnit ? ` · ${s.priceUnit}` : ""}
            </span>
          </button>
        );
      })}
      {services.length === 0 && (
        <p className="text-[11px] text-gray-500 col-span-full p-4 text-center">No services in this category yet.</p>
      )}
    </div>
  );
});

const QuantityControl = memo(function QuantityControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const num = parseInt(value) || 1;
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onChange(String(Math.max(1, num - 1)))} className="w-6 h-6 rounded-sm bg-[#ff007f]/20 text-[#ff007f] flex items-center justify-center hover:bg-[#ff007f] hover:text-white transition">
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value || "1"}
        onChange={e => onChange(e.target.value.replace(/\D/g, "") || "1")}
        className="bg-transparent font-black text-xl min-w-[2rem] text-center outline-none p-0 m-0 border-0 leading-none w-10"
        style={{ color: "#00ffff", caretColor: "#00ffff" }}
      />
      <button type="button" onClick={() => onChange(String(num + 1))} className="w-6 h-6 rounded-sm bg-[#00ffff]/20 text-[#00ffff] flex items-center justify-center hover:bg-[#00ffff] hover:text-black transition">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
});

const UsdInput = memo(function UsdInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-baseline justify-center text-2xl font-black leading-none" style={{ color: "#ffd700" }}>
      <DollarSign className="w-5 h-5 mr-1 self-center" style={{ color: "#ffd700" }} />
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={e => {
          const val = e.target.value;
          if (/^\d*\.?\d*$/.test(val) || val === "") onChange(val);
        }}
        className="bg-transparent font-black text-2xl text-center outline-none p-0 m-0 border-0 leading-none"
        style={{
          color: "#ffd700",
          caretColor: "#ffd700",
          width: `${Math.max(3, (value || "0").length)}ch`,
          minWidth: "3ch",
        }}
      />
    </div>
  );
});

const PaymentMethodToggle = memo(function PaymentMethodToggle({
  method,
  onChange,
}: {
  method: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("kinah")}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-sm transition border ${
          method === "kinah"
            ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700]"
            : "bg-white/5 border-white/15 text-gray-400"
        }`}
      >
        <Coins className="w-4 h-4" /> Kinah
      </button>
      <button
        type="button"
        onClick={() => onChange("cash")}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-sm transition border ${
          method === "cash"
            ? "bg-[#00ffff]/15 border-[#00ffff]/40 text-[#00ffff]"
            : "bg-white/5 border-white/15 text-gray-400"
        }`}
      >
        <CreditCard className="w-4 h-4" /> Cash (USD)
      </button>
    </div>
  );
});

const ExpressToggle = memo(function ExpressToggle({
  speed,
  onChange,
  express,
  superExpress,
}: {
  speed: string;
  onChange: (v: string) => void;
  express: number;
  superExpress: number;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("standard")}
        className={`px-3 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition border ${
          speed === "standard"
            ? "bg-white/10 border-white/30 text-white"
            : "bg-white/5 border-white/10 text-gray-400"
        }`}
      >
        Standard
      </button>
      <button
        type="button"
        onClick={() => onChange("express")}
        className={`px-3 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition border ${
          speed === "express"
            ? "bg-[#00ffff]/15 border-[#00ffff]/40 text-[#00ffff]"
            : "bg-white/5 border-white/10 text-gray-400"
        }`}
      >
        Express +{formatUsd(express)}
      </button>
      <button
        type="button"
        onClick={() => onChange("super")}
        className={`px-3 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition border ${
          speed === "super"
            ? "bg-[#ff007f]/15 border-[#ff007f]/40 text-[#ff007f]"
            : "bg-white/5 border-white/10 text-gray-400"
        }`}
      >
        Super Express +{formatUsd(superExpress)}
      </button>
    </div>
  );
});

const OfferDraftsBar = memo(function OfferDraftsBar({
  drafts,
  formState,
  onSave,
  onDelete,
  onLoad,
  onLoaded,
}: {
  drafts: { id: string; name: string; savedAt: number; formData: any }[];
  formState: any;
  onSave?: (name: string, formData: any) => void;
  onDelete?: (id: string) => void;
  onLoad: (formData: any) => void;
  onLoaded?: (name: string) => void;
}) {
  const [naming, setNaming] = useState(false);
  const [draftName, setDraftName] = useState("");

  const confirmSave = () => {
    const name = draftName.trim();
    if (!name) return;
    onSave?.(name, { ...formState });
    setDraftName("");
    setNaming(false);
  };

  return (
    <div className="relative z-10 mt-3 pt-3 border-t border-yellow-500/20 rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.06] px-4 py-3 shadow-[0_0_24px_rgba(234,179,8,0.08)] shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-[9px] font-black uppercase tracking-[0.28em] text-yellow-400 flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5" />
          Saved Profiles
        </div>
        {naming ? (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              autoFocus
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") confirmSave(); if (e.key === "Escape") { setNaming(false); setDraftName(""); } }}
              placeholder="Name this profile..."
              className="flex-1 min-w-[160px] bg-black/50 border border-yellow-500/30 rounded-xl px-3 py-2 text-white text-xs font-black outline-none focus:border-yellow-500/60"
            />
            <button type="button" onClick={confirmSave} className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500 hover:text-black transition-all">Save</button>
            <button type="button" onClick={() => { setNaming(false); setDraftName(""); }} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white rounded-xl bg-white/5">Cancel</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNaming(true)}
            className="px-4 py-2 bg-yellow-500/15 border border-yellow-500/35 text-yellow-300 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500 hover:text-black transition-all"
          >
            + Save Profile
          </button>
        )}
      </div>
      {drafts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {drafts.map(d => (
            <div key={d.id} className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 overflow-hidden">
              <button
                type="button"
                onClick={() => { onLoad(d.formData); onLoaded?.(d.name); }}
                className="px-3 py-2 text-[10px] font-black text-white hover:bg-[#00ffff]/15 hover:text-[#00ffff] transition-all"
                title="Load this profile"
              >
                {d.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(d.id)}
                className="px-2 py-2 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-all border-l border-white/10"
                title="Delete profile"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] font-bold text-gray-500">
          No saved profiles yet — configure your offer, then tap <span className="text-yellow-400">Save Profile</span>.
        </p>
      )}
    </div>
  );
});

const PaymentConfirmOverlay = memo(function PaymentConfirmOverlay({
  serviceName,
  quantity,
  priceUsd,
  method,
  onConfirm,
  onCancel,
}: {
  serviceName: string;
  quantity: number;
  priceUsd: number;
  method: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm rounded-[2rem]">
      <div className="w-full max-w-md bg-[#0d0d18] border border-[#ff007f]/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(255,0,127,0.2)]">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#ff007f]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff007f]">Confirm Payment</span>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Service</span><span className="text-white font-black">{serviceName}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Quantity</span><span className="text-white font-black">{quantity}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Method</span><span className="text-white font-black">{method === "kinah" ? "Kinah" : "Cash (USD)"}</span></div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-gray-400">Total</span>
            <span className="text-[#ffd700] font-black text-lg">{method === "kinah" ? `${priceUsd.toFixed(2)}M` : formatUsd(priceUsd)}</span>
          </div>
        </div>
        <label className="flex items-center gap-2 mt-4 text-xs font-bold text-gray-300 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="accent-[#ff007f] w-4 h-4" />
          I confirm the payment for this offer. It will be posted to the lobby only after confirmation.
        </label>
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-black uppercase text-[10px] tracking-widest hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmed}
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-[#ff007f] text-white font-black uppercase text-[10px] tracking-widest hover:bg-[#ff4d94] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Confirm & Post
          </button>
        </div>
      </div>
    </div>
  );
});

function CreateOfferModal({
  isOpen,
  onClose,
  initialFormData,
  onSubmit,
  submitError,
  myVfxBg,
  offerDrafts = [],
  onSaveOfferDraft,
  onDeleteOfferDraft,
  onDraftLoaded,
}: CreateOfferModalProps) {
  const [formState, dispatch] = useReducer(formReducer, initialFormData);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: "RESET", payload: initialFormData });
      setConfirming(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const stateRef = useRef(formState);
  stateRef.current = formState;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    const service = AION_SERVICES.find(x => x.id === s.serviceId);
    if (!service) return;
    setConfirming(true);
  }, []);

  const doConfirm = useCallback(() => {
    onSubmitRef.current({ preventDefault: () => {} } as React.FormEvent, stateRef.current);
    setConfirming(false);
  }, []);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const handleCategoryChange = useCallback((v: string) => {
    dispatch({ type: "SET", payload: { category: v, serviceId: "", serviceName: "", basePriceUsd: 0 } });
  }, []);

  const handleServiceSelect = useCallback((s: AionService) => {
    dispatch({
      type: "SET",
      payload: {
        serviceId: s.id,
        serviceName: s.name,
        category: s.category,
        basePriceUsd: s.basePriceUsd,
        priceUsd: s.basePriceUsd.toFixed(2),
      },
    });
  }, []);

  if (!isOpen) return null;

  const quantity = parseInt(formState.quantity) || 1;
  const priceUsd = parseFloat(formState.priceUsd) || 0;
  const totalUsd = Math.round(priceUsd * quantity * 100) / 100;
  const service = AION_SERVICES.find(x => x.id === formState.serviceId);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black overflow-hidden" style={{ willChange: "transform" }}>
      <div className="w-full max-w-7xl h-[95vh] bg-[#0a0a16] border rounded-[2rem] p-6 md:p-8 relative border-[#ff007f]/40 flex flex-col overflow-hidden min-w-0">
        {myVfxBg && (
          <img
            src={myVfxBg}
            alt=""
            className="absolute inset-0 rounded-[2rem] w-full h-full object-cover pointer-events-none z-0"
            style={{ opacity: 0.08 }}
          />
        )}

        <button onClick={handleClose} className="absolute top-6 right-6 p-3.5 bg-white/5 hover:bg-white/10 rounded-full z-50">
          <X className="w-6 h-6" />
        </button>

        {/* HEADER */}
        <div className="relative z-30 mb-5 shrink-0 pr-16 md:pr-20">
          <div className="flex items-center gap-2 md:gap-3 flex-nowrap min-w-0 w-full">
            <button
              onClick={() => { if (formState.serviceId) setConfirming(true); }}
              className="px-8 md:px-10 py-3.5 md:py-4 bg-[#ff007f] hover:bg-[#ff4d94] text-white font-black uppercase text-sm md:text-base rounded-xl shadow-xl transition shadow-[#ff007f]/20 hover:shadow-[#ff007f]/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
            >
              <Send className="w-5 h-5" /> Post Offer
            </button>

            <CategoryDropdown category={formState.category} onChange={handleCategoryChange} />

            <div className="flex items-stretch rounded-xl flex-nowrap shrink-0" style={{ boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
              <div className="px-3 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[5rem] border-r border-white/5">
                <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: "#00ffff" }}>
                  QUANTITY
                </span>
                <QuantityControl value={formState.quantity} onChange={v => dispatch({ type: "SET", payload: { quantity: v } })} />
              </div>
              <div className="px-3 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[6.5rem]">
                <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: "#ffd700" }}>
                  PRICE (USD)
                </span>
                <UsdInput value={formState.priceUsd} onChange={v => dispatch({ type: "SET", payload: { priceUsd: v } })} />
              </div>
            </div>

            <div className="ml-auto shrink-0 hidden md:flex flex-col items-end gap-0.5">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">TOTAL</span>
              <span className="text-2xl font-black leading-none" style={{ color: "#00ffff" }}>
                {formState.paymentMethod === "kinah" ? `${totalUsd.toFixed(2)}M Kinah` : formatUsd(totalUsd)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-0 min-w-0">
          {submitError && (
            <div className="absolute left-6 right-20 top-0 z-[60] rounded-xl border border-red-500/50 bg-red-950/90 px-4 py-3 shadow-[0_0_30px_rgba(239,68,68,0.25)] backdrop-blur-md">
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-red-400/80">Frequency Alert</p>
              <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-red-200">{submitError}</p>
            </div>
          )}

          <div className="space-y-4 mt-1">
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
              <label className="block text-xs font-black text-[#00ffff] uppercase mb-3 tracking-wide">Select Service</label>
              <ServiceGrid category={formState.category} selectedId={formState.serviceId} onSelect={handleServiceSelect} />
              {!formState.category && (
                <p className="text-[11px] text-gray-500 mt-3">Pick a category above to browse Aion 2 services.</p>
              )}
            </div>

            {service && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                  <label className="block text-[10px] font-black text-white/70 uppercase mb-2 tracking-wide">Payment Method</label>
                  <PaymentMethodToggle
                    method={formState.paymentMethod}
                    onChange={v => dispatch({ type: "SET", payload: { paymentMethod: v } })}
                  />
                  <div className="mt-4">
                    <label className="block text-[10px] font-black text-white/70 uppercase mb-2 tracking-wide">Completion Speed</label>
                    <ExpressToggle
                      speed={formState.speed}
                      onChange={v => dispatch({ type: "SET", payload: { speed: v } })}
                      express={service.express}
                      superExpress={service.superExpress}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-[10px] font-black text-white/70 uppercase mb-2 tracking-wide">Per-Run / Unit Price (USD)</label>
                    <UsdInput value={formState.priceUsd} onChange={v => dispatch({ type: "SET", payload: { priceUsd: v } })} />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Catalog base: {formatUsd(service.basePriceUsd)}{service.priceUnit ? ` (${service.priceUnit})` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl flex-1">
                    <label className="block text-[10px] font-black text-white/70 uppercase mb-2 tracking-wide">Notes</label>
                    <textarea
                      rows={6}
                      placeholder="Any additional requirements..."
                      value={formState.notes || ""}
                      onChange={e => dispatch({ type: "SET", payload: { notes: e.target.value } })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-black text-xs outline-none resize-none focus:border-[#00ffff]/50"
                    />
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Total ({formState.paymentMethod === "kinah" ? "Kinah" : "USD"})</span>
                      <span className="text-[#ffd700] font-black text-lg">
                        {formState.paymentMethod === "kinah" ? `${totalUsd.toFixed(2)}M` : formatUsd(totalUsd)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">Offer is posted to the lobby only after payment is confirmed.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <OfferDraftsBar
          drafts={offerDrafts}
          formState={formState}
          onSave={onSaveOfferDraft}
          onDelete={onDeleteOfferDraft}
          onLoad={data => dispatch({ type: "RESET", payload: data })}
          onLoaded={onDraftLoaded}
        />

        {confirming && (
          <PaymentConfirmOverlay
            serviceName={formState.serviceName}
            quantity={quantity}
            priceUsd={totalUsd}
            method={formState.paymentMethod}
            onConfirm={doConfirm}
            onCancel={() => setConfirming(false)}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

export default memo(
  CreateOfferModal,
  (prev, next) =>
    prev.isOpen === next.isOpen &&
    prev.submitError === next.submitError &&
    prev.initialFormData === next.initialFormData &&
    prev.offerDrafts === next.offerDrafts
);
