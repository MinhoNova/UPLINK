"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Swords, ChevronLeft, Coins, Zap, ChevronDown, ArrowRight, Send, Play,
  Check, Shield, Crown, Gem, Lock, Castle, Crosshair, Users,
  FlaskConical, TrendingUp, Hash, Globe, MapPin, ChevronRight, type LucideIcon,
} from "lucide-react";
import { AION_SERVICES, AION_CATEGORIES, AION_CLASSES, AionService, AionServiceOption } from "@/lib/aionServices";
import { saveDataSmart } from "@/lib/saveDataRouter";

const STEPS = ["service", "details"] as const;
type Step = (typeof STEPS)[number];

const REGIONS = [
  { label: "EU", desc: "Europe", icon: Globe },
  { label: "NA (EAST)", desc: "North America — East", icon: MapPin },
  { label: "NA (WEST)", desc: "North America — West", icon: MapPin },
];

const REGION_FLAG: Record<string, string> = {
  "EU": "/flags/eu.svg",
  "NA (EAST)": "/flags/us.svg",
  "NA (WEST)": "/flags/us.svg",
};

const CATEGORY_META: Record<string, { icon: LucideIcon; color: string; tile: string }> = {
  Currency: { icon: Coins, color: "text-amber-300", tile: "border-amber-400/40 bg-amber-500/10" },
  Leveling: { icon: TrendingUp, color: "text-emerald-300", tile: "border-emerald-400/40 bg-emerald-500/10" },
  Raids: { icon: Swords, color: "text-rose-300", tile: "border-rose-400/40 bg-rose-500/10" },
  Dungeons: { icon: Castle, color: "text-cyan-300", tile: "border-cyan-400/40 bg-cyan-500/10" },
  PVP: { icon: Crosshair, color: "text-orange-300", tile: "border-orange-400/40 bg-orange-500/10" },
  Professions: { icon: FlaskConical, color: "text-sky-300", tile: "border-sky-400/40 bg-sky-500/10" },
};

const STEP_HINTS: Record<Step, string> = {
  service: "Pick your dungeon or service",
  details: "Final details — quantity and region",
};

/* ── Dungeon flip — iOS app-switcher style, full portrait images ──────────── */
function DungeonFlip({
  items,
  initialId,
  onPick,
}: {
  items: AionService[];
  initialId: string | null;
  onPick: (s: AionService) => void;
}) {
  const CARD_W = typeof window !== "undefined" ? Math.min(280, Math.max(210, Math.round(window.innerWidth * 0.26))) : 250;
  const CARD_H = Math.round(CARD_W * (1619 / 972));
  const PITCH = 62;

  const [idx, setIdx] = useState(() => Math.max(0, items.findIndex((s) => s.id === initialId)));
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const movedRef = useRef(false);

  const go = (dir: number) => {
    setIdx((i) => (i + dir + items.length) % items.length);
  };
  const jumpTo = (i: number) => setIdx(i);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    movedRef.current = false;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    setDrag(dx);
    if (Math.abs(dx) > 14) movedRef.current = true;
  };
  const onPointerUp = () => {
    if (startX.current == null) return;
    if (drag < -52) go(1);
    else if (drag > 52) go(-1);
    startX.current = null;
    setDrag(0);
    setDragging(false);
    window.setTimeout(() => { movedRef.current = false; }, 0);
  };

  const active = items[idx];

  return (
    <div className="mt-4 select-none">
      <div
        className="relative"
        style={{ height: CARD_H + 60 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* center guide glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-2xl" />

        {items.map((s, i) => {
          const d = i - idx;
          const x = d * PITCH + drag;
          const scale = d === 0 ? 1 : Math.max(0.86, 1 - Math.abs(d) * 0.07);
          const z = 30 - Math.abs(d);
          const opacity = Math.abs(d) > 2 ? 0 : Math.abs(d) === 2 ? 0.35 : Math.abs(d) === 1 ? 0.75 : 1;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => { if (movedRef.current) return; if (d === 0) onPick(s); else jumpTo(i); }}
              className="absolute left-1/2 top-1/2 overflow-hidden rounded-2xl border bg-black/70 shadow-[0_18px_50px_rgba(0,0,0,0.65)]"
              style={{
                width: CARD_W,
                height: CARD_H,
                zIndex: z,
                transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                transformOrigin: "center",
                opacity,
                transition: dragging ? "none" : "transform 380ms cubic-bezier(0.22,1,0.36,1), opacity 380ms ease",
                pointerEvents: d === 0 ? "auto" : "auto",
                borderColor: d === 0 ? "rgba(0,229,255,0.6)" : "rgba(255,255,255,0.08)",
                boxShadow: d === 0 ? "0 0 44px rgba(0,229,255,0.22), 0 18px 50px rgba(0,0,0,0.65)" : "0 18px 50px rgba(0,0,0,0.65)",
              }}
            >
              <img
                src={s.img}
                alt={s.name}
                className="h-full w-full object-cover"
                draggable={false}
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <p className={`truncate text-sm font-black uppercase tracking-wider ${d === 0 ? "text-cyan-100" : "text-gray-300"}`}>{s.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5">
                  <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                    {Number(s.basePriceKina).toFixed(2)}M KINAH
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{s.priceUnit ?? "per pc"}</span>
                </p>
              </div>
              {d === 0 && (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-cyan-400/60 bg-black/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-300 backdrop-blur">
                  <Check className="h-3 w-3" /> Selected
                </span>
              )}
            </button>
          );
        })}

        {/* arrows */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute left-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-gray-200 shadow-lg backdrop-blur transition-all hover:border-cyan-400/50 hover:text-cyan-300 cursor-pointer z-[50]"
          aria-label="Previous dungeon"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-gray-200 shadow-lg backdrop-blur transition-all hover:border-cyan-400/50 hover:text-cyan-300 cursor-pointer z-[50]"
          aria-label="Next dungeon"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* dots */}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => jumpTo(i)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${i === idx ? "w-6 bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]" : "w-1.5 bg-white/25 hover:bg-white/50"}`}
            aria-label={`Go to ${items[i].name}`}
          />
        ))}
      </div>

      {/* select strip */}
      {active && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.07] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{active.name}</p>
            <p className="truncate text-[11px] text-gray-500">{active.description}</p>
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onPick(active); }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-cyan-200 transition-all hover:bg-cyan-500/25 cursor-pointer"
          >
            Select <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Option Flip — sub-option card selector (same style, smaller) ───────── */
function OptionFlip({
  options,
  onSelect,
  onBack,
  title = "Select Difficulty / Type",
  backLabel = "Back to Services",
}: {
  options: AionServiceOption[];
  onSelect: (opt: AionServiceOption) => void;
  onBack: () => void;
  title?: string;
  backLabel?: string;
}) {
  const hasArtwork = options.some((option) => Boolean(option.img));
  const CARD_W = hasArtwork
    ? (typeof window !== "undefined" ? Math.min(280, Math.max(210, Math.round(window.innerWidth * 0.26))) : 250)
    : 220;
  const CARD_H = hasArtwork ? Math.round(CARD_W * (1619 / 972)) : 150;
  const PITCH = 48;

  const [idx, setIdx] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const movedRef = useRef(false);

  const go = (dir: number) => setIdx((i) => (i + dir + options.length) % options.length);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    movedRef.current = false;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    setDrag(e.clientX - startX.current);
    if (Math.abs(e.clientX - startX.current) > 14) movedRef.current = true;
  };
  const onPointerUp = () => {
    if (startX.current == null) return;
    if (drag < -52) go(1);
    else if (drag > 52) go(-1);
    startX.current = null;
    setDrag(0);
    setDragging(false);
    window.setTimeout(() => { movedRef.current = false; }, 0);
  };

  const active = options[idx];

  return (
    <div className="mt-4 select-none">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400 hover:border-white/25 hover:text-white transition-all cursor-pointer"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> {backLabel}
      </button>
      <p className="text-[10px] font-black tracking-[0.24em] uppercase text-cyan-300/80 mb-3 text-center">{title}</p>
      <div
        className="relative"
        style={{ height: CARD_H + 50 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {options.map((opt, i) => {
          const d = i - idx;
          const x = d * PITCH + drag;
          const scale = d === 0 ? 1 : Math.max(0.88, 1 - Math.abs(d) * 0.06);
          const z = 30 - Math.abs(d);
          const opacity = Math.abs(d) > 2 ? 0 : Math.abs(d) === 2 ? 0.35 : Math.abs(d) === 1 ? 0.75 : 1;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => { if (movedRef.current) return; if (d === 0) onSelect(opt); else setIdx(i); }}
              className="absolute left-1/2 top-1/2 overflow-hidden rounded-xl border bg-black/70 shadow-[0_12px_35px_rgba(0,0,0,0.55)]"
              style={{
                width: CARD_W,
                height: CARD_H,
                zIndex: z,
                transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                transformOrigin: "center",
                opacity,
                transition: dragging ? "none" : "transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 320ms ease",
                borderColor: d === 0 ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.08)",
                boxShadow: d === 0 ? "0 0 30px rgba(0,229,255,0.18), 0 12px 35px rgba(0,0,0,0.55)" : "0 12px 35px rgba(0,0,0,0.55)",
              }}
            >
              {opt.img ? (
                <>
                  <img src={opt.img} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-[#071126]/35" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-purple-900/30 to-black/60" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                <p className={`text-sm font-black uppercase tracking-wider ${d === 0 ? "text-cyan-100" : "text-gray-300"}`}>{opt.label}</p>
                {opt.variants && opt.variants.length > 0 ? (
                  <p className="mt-1.5 text-[10px] font-bold text-amber-300">
                    {opt.variants.map((v) => `${v.label} ${v.priceKina.toFixed(2)}M`).join("  ·  ")}
                  </p>
                ) : opt.priceKina > 0 ? (
                  <p className="mt-1.5 text-[11px] font-bold text-amber-300">{opt.priceKina.toFixed(2)}M KINAH</p>
                ) : (
                  <p className="mt-1.5 text-[11px] font-bold text-emerald-400">BASE PRICE</p>
                )}
              </div>
              {d === 0 && (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-cyan-400/60 bg-black/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-300 backdrop-blur">
                  <Check className="h-3 w-3" /> Selected
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute left-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-gray-200 shadow-lg backdrop-blur transition-all hover:border-cyan-400/50 hover:text-cyan-300 cursor-pointer z-[50]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-gray-200 shadow-lg backdrop-blur transition-all hover:border-cyan-400/50 hover:text-cyan-300 cursor-pointer z-[50]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {options.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${i === idx ? "w-5 bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]" : "w-1.5 bg-white/25 hover:bg-white/50"}`}
          />
        ))}
      </div>
      {active && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.07] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{active.label}</p>
            <p className="truncate text-[11px] text-gray-500">
              {active.variants && active.variants.length > 0
                ? `${active.variants.map((v) => `${v.label} ${v.priceKina.toFixed(2)}M`).join(" · ")}`
                : active.priceKina > 0
                ? `+${active.priceKina.toFixed(2)}M Kinah on top`
                : "Included in base price"}
            </p>
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onSelect(active); }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-cyan-200 transition-all hover:bg-cyan-500/25 cursor-pointer"
          >
            Select <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function CreateOfferPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("service");
  const [activeCat, setActiveCat] = useState("Dungeons");
  const [sel, setSel] = useState<AionService | null>(null);
  const [qty, setQty] = useState(1);
  const [region, setRegion] = useState("EU");
  const [regionOpen, setRegionOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pubError, setPubError] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [pickedOption, setPickedOption] = useState<AionServiceOption | null>(null);
  const [pickedVariant, setPickedVariant] = useState<AionServiceOption | null>(null);
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const [difficulty, setDifficulty] = useState("Normal");
  const [pricePerRun, setPricePerRun] = useState(0);
  const [maxBoosters, setMaxBoosters] = useState(1);
  const [requiredClasses, setRequiredClasses] = useState<string[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

  /* Standalone premium page — hide the global UPLINK navbar */
  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, AionService[]> = {};
    for (const cat of AION_CATEGORIES) { g[cat] = AION_SERVICES.filter((s) => s.category === cat); }
    return g;
  }, []);

  /* Categories whose services carry artwork cards (Dungeons / Raids / PVP) get the
     portrait flip; the rest keep the plain grid. */
  const flipItems = useMemo(() => {
    const m: Record<string, AionService[]> = {};
    for (const cat of AION_CATEGORIES) { m[cat] = grouped[cat].filter((s) => Boolean(s.img)); }
    return m;
  }, [grouped]);

  useEffect(() => {
    fetch("/api/data", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.marketPrices === "object") setMarketPrices(d.marketPrices);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sel) {
      const market = marketPrices[sel.name];
      setPricePerRun(market && market > 0 ? market : sel.basePriceKina);
      setShowOptions(false);
      setPickedOption(null);
      setPickedVariant(null);
      setDifficulty("Normal");
      setDifficultyOpen(false);
    }
  }, [sel?.id, marketPrices]);

  /* Clear difficulty options + price helpers for the details step */
  const difficultyOptions = useMemo(() => {
    if (!sel) return [];
    if (pickedOption?.variants?.length) {
      return pickedOption.variants.map((v) => ({ label: v.label, price: v.priceKina }));
    }
    if (sel.category === "Dungeons" && !pickedOption) {
      return [
        { label: "Normal", price: sel.basePriceKina },
        { label: "Hard", price: Math.round(sel.basePriceKina * 1.5 * 100) / 100 },
      ];
    }
    return [];
  }, [sel, pickedOption]);

  const selectDifficulty = (opt: { label: string; price: number }) => {
    setDifficulty(opt.label);
    setDifficultyOpen(false);
    setPricePerRun(opt.price);
    if (pickedOption?.variants?.length) {
      const v = pickedOption.variants.find((x) => x.label === opt.label);
      if (v) setPickedVariant(v);
    }
  };

  const applyAveragePrice = () => {
    if (!sel) return;
    const market = marketPrices[sel.name];
    if (market && market > 0) { setPricePerRun(market); return; }
    const avg = difficultyOptions.find((o) => o.label === "Average");
    if (avg) { setPricePerRun(avg.price); return; }
    setPricePerRun(sel.basePriceKina);
  };

  const canNext = !!sel;
  const stepIndex = STEPS.indexOf(step);

  const advance = () => {
    setRegionOpen(false);
    setStep("details");
  };
  const regress = () => { setRegionOpen(false); setStep(STEPS[stepIndex - 1]); };
  const resetOffer = () => { setStep("service"); setSel(null); setQty(1); setRegion("EU"); setRegionOpen(false); setPublished(false); setPubError(""); setShowOptions(false); setPickedOption(null); setPickedVariant(null); setDifficulty("Normal"); setDifficultyOpen(false); setPricePerRun(0); setMaxBoosters(1); setRequiredClasses([]); };

  const publishOffer = async () => {
    if (!session?.user) { setPubError("Sign in to publish an offer"); return; }
    if (!sel) return;
    setPublishing(true);
    setPubError("");
    try {
      const me = session.user as any;
      const live = await fetch("/api/data", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ lobbies: [] }));
      const lobbies = Array.isArray(live.lobbies) ? live.lobbies : [];
      const category = sel.category === "Leveling" ? "leveling" : "dungeon";
      const lobby = {
        id: Date.now(),
        ownerId: String(me.id || ""),
        ownerDiscordName: String(me.name || "Operative"),
        ownerHandle: String(me.username || ""),
        ownerImage: String(me.image || ""),
        ownerEffect: "none",
        category,
        title: `${qty}× ${sel.name}`,
        serviceName: String(sel.name || "Mission"),
        notes: `${sel.description || ""} · ${region}${pickedOption ? ` · ${pickedOption.label}` : ""}${difficulty !== "Average" && pickedOption?.variants?.length ? ` · ${difficulty}` : ""}${pickedVariant && difficulty === "Average" ? ` · ${pickedVariant.label}` : ""}`,
        runsCount: qty,
        pricePerRun,
        maxBoosters,
        requiredClasses: requiredClasses.length > 0 ? requiredClasses : undefined,
        selectedOption: difficulty !== "Average" ? difficulty : pickedVariant ? pickedVariant.label : pickedOption?.label || undefined,
        selectedOptionGroup: (difficulty !== "Average" || pickedVariant) ? pickedOption?.label || undefined : undefined,
        serverRegion: region,
        roles: requiredClasses.length > 0
          ? requiredClasses.reduce((acc: Record<string, number>, cls) => { acc[cls] = (acc[cls] || 0) + 1; return acc; }, {})
          : category === "leveling"
            ? { tank: 0, dps: qty }
            : { tank: 0, healer: 0, dps: qty },
        applicants: [],
        invited: [],
        accepted: [],
        customBg: sel.img || "",
        blacklistedClasses: [],
        blockedRoles: [],
        status: "standby",
        createdAt: Date.now(),
      };
      const ok = await saveDataSmart({ lobbies: [...lobbies, lobby] });
      if (!ok) { setPubError("Could not publish your offer — please try again"); return; }
      setPublished(true);
    } catch {
      setPubError("Network error — please try again");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050814] text-white selection:bg-cyan-400 selection:text-black font-sans">

      {/* ── SCENIC BACKGROUND — mirrors the lobby from the very top of the page ── */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0 bg-contain bg-top bg-no-repeat"
          style={{
            backgroundImage: `url('/AION2.png')`,
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 46%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 76%, transparent 90%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 46%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 76%, transparent 90%)",
          }}
        />
        <div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/12 via-[#050814]/35 to-[#050814]/95" />
        <div className="absolute inset-x-0 top-0 h-[230vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(5,8,20,0.3)_70vh,rgba(5,8,20,0.75)_120vh,rgba(5,8,20,0.97)_175vh,#050814_215vh)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,20,0.8)_100%)]" />
        <div className="aion-dotnet absolute inset-0 opacity-[0.10]" />
      </div>

      {/* ── PREMIUM TOP BAR ── */}
      <header className="relative z-40 border-b border-white/[0.08] bg-transparent">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 py-4">
          <a href="/" className="group flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-md transition-all hover:border-cyan-300/50 hover:text-white cursor-pointer">
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to Lobby
          </a>

          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-b from-cyan-500/20 to-purple-600/20 shadow-[0_0_18px_rgba(0,229,255,0.25)]">
              <Swords className="h-4 w-4 text-cyan-300" />
            </span>
            <div className="leading-none">
              <p className="text-lg font-black tracking-[0.14em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent">AION 2</p>
              <p className="mt-1 text-[10px] font-black tracking-[0.3em] text-amber-300/90 uppercase">Offer Forge</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {STEPS.map((s, i) => {
              const activeStep = stepIndex === i;
              const doneStep = stepIndex > i;
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <span className={`h-px w-4 ${doneStep ? "bg-cyan-400/60" : "bg-white/15"}`} />}
                  <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${activeStep ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-[0_0_12px_rgba(0,229,255,0.2)]" : doneStep ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300/80" : "border-white/[0.1] bg-white/[0.03] text-gray-500"}`}>
                    {doneStep ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}</span>}
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {published ? (
          <motion.section
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-20 mx-auto flex min-h-[72vh] max-w-[1400px] items-center justify-center px-5 sm:px-8"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-emerald-300/25 bg-[#070a1c]/90 p-10 text-center shadow-[0_0_90px_rgba(52,211,153,0.22)] backdrop-blur-2xl">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
                className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_45px_rgba(52,211,153,0.45)]"
              >
                <Check className="h-9 w-9 text-emerald-300" />
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/10" />
              </motion.div>
              <h2 className=" text-2xl font-black tracking-wide text-white">Offer Published</h2>
              <p className="mt-2 text-xs text-slate-300/90">Your mission is live for the Aion 2 community. May the Daevas answer your call.</p>
              <div className="mt-7 flex flex-col gap-2.5">
                <a href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-7 py-3 text-xs font-black tracking-[0.18em] uppercase text-white shadow-[0_0_30px_rgba(90,120,255,0.5)] transition-all hover:-translate-y-0.5 cursor-pointer">
                  <Swords className="h-3.5 w-3.5" /> Return to Lobby
                </a>
                <button type="button" onClick={resetOffer} className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-7 py-3 text-xs font-black tracking-[0.18em] uppercase text-gray-300 transition-all hover:border-white/25 hover:text-white cursor-pointer">
                  New Offer
                </button>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="forge"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-20"
          >
            {/* ── HUD HEADER ── */}
            <section className="mx-auto px-5 pt-9 pb-6 sm:px-8 max-w-[1400px]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black tracking-[0.3em] text-cyan-300 uppercase">
                    <Gem className="h-3.5 w-3.5" /> Aion 2 · Offer Forge
                  </p>
                  <h1 className="mt-3 bg-gradient-to-b from-white via-cyan-50 to-cyan-400 bg-clip-text  text-5xl font-black tracking-tight text-transparent drop-shadow-[0_0_35px_rgba(34,211,238,0.35)] sm:text-6xl">
                    Forge Your Offer
                  </h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
                    Craft a premium mission post and broadcast it to every Daeva in Atreia. Take charge of your run.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: Shield, label: "24/7 Trusted", color: "text-cyan-300" },
                    { icon: Lock, label: "Escrow Ready", color: "text-amber-300" },
                    { icon: Zap, label: "Instant Post", color: "text-purple-300" },
                  ].map((chip) => (
                    <span key={chip.label} className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-black/40 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-gray-300 backdrop-blur-md">
                      <chip.icon className={`h-3 w-3 ${chip.color}`} /> {chip.label}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* ── FORGE GRID ── */}
            <main className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                {/* ── LEFT: BUILDER ── */}
                <section className="tn-light rounded-2xl border border-white/[0.09] bg-[#070a1c]/80 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">

                  <div className="p-5 sm:p-6">
                    <AnimatePresence mode="wait">
                      {/* STEP 1 — PICK YOUR OFFER */}
                      {step === "service" && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                          {showOptions && sel ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.07] px-4 py-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${(CATEGORY_META[sel.category] ?? CATEGORY_META.Raids).tile}`}>
                                  {(() => { const CatIcon = (CATEGORY_META[sel.category] ?? CATEGORY_META.Raids).icon; return <CatIcon className={`h-5 w-5 ${(CATEGORY_META[sel.category] ?? CATEGORY_META.Raids).color}`} />; })()}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-white">{sel.name}</p>
                                  <p className="truncate text-[11px] text-gray-500">{sel.description}</p>
                                </div>
                              </div>
                              <OptionFlip
                                options={pickedOption && pickedOption.variants?.length ? pickedOption.variants : sel.options!}
                                onBack={() => {
                                  if (pickedOption && pickedOption.variants?.length) {
                                    setPickedOption(null);
                                    setPickedVariant(null);
                                  } else {
                                    setShowOptions(false);
                                    setSel(null);
                                  }
                                }}
                                onSelect={(opt) => {
                                  if (opt.variants && opt.variants.length > 0) {
                                    setPickedOption(opt);
                                    setPickedVariant(null);
                                    const defaultVariant = opt.variants[0];
                                    setPickedVariant(defaultVariant);
                                    setPricePerRun(defaultVariant.priceKina);
                                    setDifficulty(defaultVariant.label);
                                    setDifficultyOpen(false);
                                    setStep("details");
                                  } else if (pickedOption && pickedOption.variants?.length) {
                                    setPickedVariant(opt);
                                    setDifficulty(opt.label);
                                    setPricePerRun(opt.priceKina);
                                    setStep("details");
                                  } else {
                                    setPickedOption(opt);
                                    setPricePerRun(sel.basePriceKina + opt.priceKina);
                                    setStep("details");
                                  }
                                }}
                                title={pickedOption && pickedOption.variants?.length ? `Select ${pickedOption.label} Difficulty` : "Select Option"}
                                backLabel={pickedOption && pickedOption.variants?.length ? "Back to Options" : "Back to Services"}
                              />
                            </div>
                          ) : (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-[170px_1fr]">
                            {/* category rail — on the side */}
                            <div className="flex gap-1.5 overflow-x-auto md:flex-col md:overflow-visible">
                              {AION_CATEGORIES.filter((c) => grouped[c]?.length).map((cat) => {
                                const meta = CATEGORY_META[cat];
                                const CatIcon = meta.icon;
                                const isActiveCat = activeCat === cat;
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCat(cat)}
                                    className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[11px] font-black uppercase tracking-[0.12em] transition-all cursor-pointer ${
                                      isActiveCat
                                        ? "border-cyan-400/60 bg-cyan-500/[0.1] text-white shadow-[0_0_18px_rgba(0,229,255,0.14)]"
                                        : "border-white/[0.08] bg-white/[0.02] text-gray-500 hover:border-white/[0.18] hover:text-gray-300"
                                    }`}
                                  >
                                    <CatIcon className={`h-3.5 w-3.5 shrink-0 ${isActiveCat ? meta.color : "text-gray-500"}`} />
                                    <span className="min-w-0 truncate md:flex-1">{cat}</span>
                                    <span className={`ml-auto hidden rounded-full px-1.5 py-0.5 text-[8px] font-bold md:inline ${isActiveCat ? "bg-cyan-400/20 text-cyan-300" : "bg-white/[0.06] text-gray-600"}`}>
                                      {grouped[cat].length}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* services / dungeon flip of the active category */}
                            {flipItems[activeCat]?.length > 0 ? (
                              <div className="overflow-hidden">
                                <DungeonFlip
                                  items={flipItems[activeCat]}
                                  initialId={sel?.id ?? null}
                                  onPick={(svc) => {
                                    setSel(svc);
                                    if (svc.options && svc.options.length > 0) {
                                      setShowOptions(true);
                                    } else {
                                      setStep("details");
                                    }
                                  }}
                                />
                                <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600">
                                  Flip to browse — tap to select
                                </p>
                              </div>
                            ) : (
                              <div className="max-h-[52vh] overflow-y-auto pr-1.5">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  {grouped[activeCat]?.map((svc) => {
                                    const meta = CATEGORY_META[svc.category] ?? CATEGORY_META.Raids;
                                    const CatIcon = meta.icon;
                                    const isActive = sel?.id === svc.id;
                                    const variantCount = (svc.options?.length ?? 0) + (svc.extras?.length ?? 0);
                                    return (
                                      <button
                                        key={svc.id}
                                        type="button"
                                        onClick={() => {
                                          setSel(svc);
                                          if (svc.options && svc.options.length > 0) {
                                            setShowOptions(true);
                                          } else {
                                            setStep("details");
                                          }
                                        }}
                                        className={`group relative rounded-xl border p-4 text-left transition-all ${isActive ? "border-cyan-400/60 bg-cyan-500/[0.08] shadow-[0_0_26px_rgba(0,229,255,0.14)]" : "border-white/[0.09] bg-white/[0.03] hover:border-white/[0.2] hover:bg-white/[0.06]"}`}
                                      >
                                        {isActive && <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />}
                                        <span className="flex items-start justify-between gap-3">
                                          <span className="flex min-w-0 items-start gap-3">
                                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${isActive ? "border-cyan-400/50 bg-cyan-500/15" : "border-white/[0.1] bg-white/[0.04]"} transition-colors`}>
                                              <CatIcon className={`h-5 w-5 ${isActive ? "text-cyan-300" : meta.color}`} />
                                            </span>
                                            <span className="min-w-0">
                                              <span className="flex items-center gap-1.5">
                                                <span className="truncate text-sm font-bold text-white">{svc.name}</span>
                                                {svc.video && <Play className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-label="Video" />}
                                              </span>
                                              <span className="mt-0.5 block truncate text-[11px] text-gray-500">{svc.description}</span>
                                            </span>
                                          </span>
                                          {isActive ? (
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-500/20">
                                              <Check className="h-3.5 w-3.5 text-cyan-300" />
                                            </span>
                                          ) : (
                                            <span className="shrink-0 rounded-md bg-black/30 px-2 py-1 text-xs font-black text-cyan-300">{svc.priceUnit ?? "pc"}</span>
                                          )}
                                        </span>
                                        {variantCount > 0 ? (
                                          <span className="mt-3 flex flex-wrap items-center gap-1.5">
                                            {[...(svc.options ?? []), ...(svc.extras ?? [])].slice(0, 2).map((o) => (
                                              <span key={o.label} className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold text-gray-400">{o.label}</span>
                                            ))}
                                            {variantCount > 2 && (
                                              <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold text-gray-500">+{variantCount - 2} more</span>
                                            )}
                                          </span>
                                        ) : (
                                          <span className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                                            {svc.priceUnit ?? "per pc"}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        </motion.div>
                      )}

                      {/* STEP 2 — DETAILS (final) */}
                      {step === "details" && sel && (() => {
                        const meta = CATEGORY_META[sel.category] ?? CATEGORY_META.Raids;
                        const CatIcon = meta.icon;
                        return (
                          <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.07] px-3.5 py-2.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${meta.tile}`}>
                                  <CatIcon className={`h-5 w-5 ${meta.color}`} />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-white">{sel.name}</p>
                                  <p className="truncate text-[11px] text-gray-500">{sel.description}</p>
                                </div>
                              </div>
                              <span className="shrink-0 rounded-md bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">{sel.priceUnit ?? "per pc"}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                              <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                <Hash className="h-3.5 w-3.5 text-cyan-400" /> Quantity
                              </p>
                              <div className="flex items-center justify-between gap-3">
                                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-base font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">-</button>
                                <div className="text-center">
                                  <span className="block text-2xl font-black tabular-nums text-white">{qty}</span>
                                  <span className="text-[9px] font-black tracking-[0.18em] uppercase text-gray-500">{sel.priceUnit || "runs"}</span>
                                </div>
                                <button type="button" onClick={() => setQty(Math.min(100, qty + 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-base font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">+</button>
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                              <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                <Users className="h-3.5 w-3.5 text-cyan-400" /> Players
                              </p>
                              <div className="flex items-center justify-between gap-3">
                                <button type="button" onClick={() => setMaxBoosters(Math.max(1, maxBoosters - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-base font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">-</button>
                                <div className="text-center">
                                  <span className="block text-2xl font-black tabular-nums text-white">{maxBoosters}</span>
                                  <span className="text-[9px] font-black tracking-[0.18em] uppercase text-gray-500">{maxBoosters > 1 ? "Boosters" : "Booster"}</span>
                                </div>
                                <button type="button" onClick={() => setMaxBoosters(Math.min(10, maxBoosters + 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-base font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">+</button>
                              </div>
                            </div>
                            </div>

                            {difficultyOptions.length > 0 && (
                              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                                <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                  <Swords className="h-3.5 w-3.5 text-cyan-400" /> Difficulty
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                  {difficultyOptions.map((opt) => {
                                    const isActive = difficulty === opt.label;
                                    return (
                                      <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => selectDifficulty(opt)}
                                        className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-all cursor-pointer ${isActive ? "border-cyan-400/60 bg-cyan-500/15 text-white shadow-[0_0_18px_rgba(0,229,255,0.14)]" : "border-white/[0.09] bg-white/[0.03] text-gray-400 hover:border-white/[0.2] hover:text-gray-200"}`}
                                      >
                                        <span className="text-xs font-black">{opt.label}</span>
                                        <span className={`text-[9px] font-bold ${isActive ? "text-cyan-300" : "text-gray-500"}`}>{opt.price.toFixed(2)}M</span>
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">
                                  Owner picks the difficulty — price applies accordingly
                                </p>
                              </div>
                            )}

                            

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                            {/* PRICE PER RUN + SET AVERAGE */}
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                              <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                <Coins className="h-3.5 w-3.5 text-amber-300" /> Price per {sel.priceUnit?.replace("per ", "") || "run"} (Kinah)
                              </p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pricePerRun}
                                  onChange={(e) => setPricePerRun(parseFloat(e.target.value) || 0)}
                                  className="min-w-0 flex-1 rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-base font-black text-white focus:border-cyan-400/50 focus:outline-none transition-colors"
                                />
                                <span className="shrink-0 text-xs font-bold text-gray-400">M</span>
                              </div>
                              <button
                                type="button"
                                onClick={applyAveragePrice}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300 transition-all hover:bg-cyan-500/20 cursor-pointer"
                              >
                                <TrendingUp className="h-3 w-3" /> Set Average
                              </button>
                              <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">
                                {marketPrices[sel.name] && marketPrices[sel.name] > 0
                                  ? `Auto-filled from recent completed runs (market) — you can edit it`
                                  : "Average market price — you can edit it"}
                              </p>
                            </div>

                            {/* REGION (compact) */}
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                              <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                <Globe className="h-3.5 w-3.5 text-cyan-400" /> Region
                              </p>
                              <div className="flex flex-col gap-1.5">
                                {REGIONS.map((r) => {
                                  const isActive = region === r.label;
                                  return (
                                    <button key={r.label} type="button" onClick={() => { setRegion(r.label); setRegionOpen(false); }}
                                      className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left transition-all cursor-pointer ${isActive ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.05]"}`}>
                                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border ${isActive ? "border-cyan-400/50 bg-cyan-500/15" : "border-white/[0.1] bg-white/[0.04]"}`}>
                                        <img src={REGION_FLAG[r.label]} alt={r.label} className="h-5 w-5 rounded object-cover" loading="lazy" decoding="async" />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className={`block text-xs font-bold ${isActive ? "text-cyan-200" : "text-gray-200"}`}>{r.label}</span>
                                        <span className="block text-[9px] text-gray-500">{r.desc}</span>
                                      </span>
                                      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            </div>

                            {/* REQUIRED CLASS SLOTS */}
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                              <p className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                <Shield className="h-3.5 w-3.5 text-cyan-400" /> Required Classes (up to 4)
                              </p>
                              <div className="grid grid-cols-4 gap-2">
                                {AION_CLASSES.map((cls) => {
                                  const isSelected = requiredClasses.includes(cls);
                                  const imgName = cls === "Spiritmaster" ? "Elementalist" : cls;
                                  return (
                                    <button
                                      key={cls}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setRequiredClasses(requiredClasses.filter((c) => c !== cls));
                                        } else if (requiredClasses.length < 4) {
                                          setRequiredClasses([...requiredClasses, cls]);
                                        }
                                      }}
                                      className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all cursor-pointer ${isSelected ? "border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_18px_rgba(0,229,255,0.14)]" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.2] hover:bg-white/[0.06]"}`}
                                    >
                                      <img
                                        src={`/classes/${imgName}.png`}
                                        alt={cls}
                                        className="h-10 w-10 object-contain"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                                      />
                                      <span className={`text-[8px] font-black uppercase tracking-wider ${isSelected ? "text-cyan-300" : "text-gray-400"}`}>{cls}</span>
                                      {isSelected && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400">
                                          <Check className="h-3 w-3 text-black" />
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">
                                {requiredClasses.length}/4 selected — accepted players fill these slots
                              </p>
                            </div>
                          </motion.div>
                        );
                      })()}

                      {/* STEP 3 — CONFIRM (removed; details is the final step) */}
                    </AnimatePresence>
                  </div>
</section>

                {/* ── RIGHT: ORDER SUMMARY BOARD ── */}
                <aside className="h-fit lg:sticky lg:top-6">
                  <div className="tn-light relative overflow-hidden rounded-2xl border border-cyan-300/[0.18] bg-[#070a1c]/85 shadow-[0_0_60px_rgba(0,180,255,0.12)] backdrop-blur-xl">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
                    <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 rounded-tl-2xl border-l border-t border-cyan-300/40" />
                    <span className="pointer-events-none absolute right-0 top-0 h-5 w-5 rounded-tr-2xl border-r border-t border-cyan-300/40" />

                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-300" />
                          <p className="text-xs font-black tracking-[0.26em] text-white uppercase">Order Summary</p>
                        </div>
                        {sel && (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Ready
                          </span>
                        )}
                      </div>

                      {/* mini progress */}
                      <div className="mt-4 flex items-center gap-1.5">
                        {STEPS.map((s, i) => (
                          <div key={s} className={`h-1.5 flex-1 rounded-full ${stepIndex >= i ? "bg-cyan-400/70 shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "bg-white/[0.08]"}`} />
                        ))}
                      </div>

                      {/* service */}
                      <div className={`mt-5 rounded-xl border p-4 ${sel ? "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.09] to-purple-500/[0.05]" : "border-white/[0.08] bg-white/[0.03]"}`}>
                        {sel ? (() => {
                          const meta = CATEGORY_META[sel.category] ?? CATEGORY_META.Raids;
                          const CatIcon = meta.icon;
                          return (
                            <div className="flex items-start gap-3">
                              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${meta.tile}`}>
                                <CatIcon className={`h-5 w-5 ${meta.color}`} />
                              </span>
                              <div className="min-w-0 flex-1">
<div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-bold text-white">{sel.name}</p>
                  <p className="shrink-0 rounded-md bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">{sel.priceUnit ?? "pc"}</p>
                </div>
                                <p className="mt-0.5 truncate text-[11px] text-gray-500">{sel.category}</p>
                                {sel.video && (
                                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Boss Feed Active
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-gray-500">
                              <Swords className="h-5 w-5" />
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Pick a service to start</p>
                          </div>
                        )}
                      </div>

                      {/* detail rows */}
                      <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
{[
                          ["Price", sel ? `${pricePerRun.toFixed(2)}M Kinah` : "—"],
                          ["Difficulty", sel && pickedOption?.variants?.length ? difficulty : "—"],
                          ["Quantity", sel ? `${qty} × ${sel.priceUnit || "runs"}` : "—"],
                          ["Boosters", sel ? `${maxBoosters} player${maxBoosters > 1 ? "s" : ""}` : "—"],
                          ["Classes", sel ? (requiredClasses.length > 0 ? requiredClasses.join(", ") : "Any") : "—"],
                          ["Region", sel ? region : "—"],
                        ].map(([k, v], ix) => (
                          <div key={k} className={`flex items-center justify-between gap-3 py-2.5 ${ix < 5 ? "border-b border-white/[0.06]" : ""}`}>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{k}</span>
                            <span className={`text-xs font-bold ${sel ? "text-gray-200" : "text-gray-600"}`}>{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* total */}
                      <div className="mt-4 overflow-hidden rounded-xl border border-cyan-400/35 bg-gradient-to-r from-cyan-500/[0.12] to-purple-600/[0.12]">
                        <div className="flex items-end justify-between gap-3 px-5 py-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Total Price</p>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-500">{qty}× {sel?.priceUnit || "runs"}{pickedOption && difficulty !== "Average" ? ` · ${pickedOption.label} ${difficulty}` : pickedOption ? ` · ${pickedOption.label}` : " · Base"}</p>
                          </div>
                          <p className=" text-2xl font-black text-cyan-200 drop-shadow-[0_0_18px_rgba(0,229,255,0.4)] tabular-nums">{sel ? (pricePerRun * qty).toFixed(2) : "0.00"}<span className="text-base text-cyan-300 ml-1">M</span></p>
                        </div>
                      </div>

                      {/* actions */}
                      <div className="mt-5 flex flex-col gap-2">
                        {step !== "details" ? (
                          <>
                            <button
                              type="button"
                              onClick={advance}
                              disabled={!canNext}
                              className={`flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-xs font-black tracking-[0.18em] uppercase transition-all ${canNext ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200 shadow-[0_0_20px_rgba(0,229,255,0.12)] hover:bg-cyan-500/25 cursor-pointer" : "border-white/[0.08] bg-white/[0.04] text-gray-600 cursor-not-allowed"}`}
                            >
                              Continue to Details <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={regress} disabled={stepIndex === 0} className={`flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-transparent px-6 py-3 text-xs font-bold text-gray-400 transition-all ${stepIndex === 0 ? "cursor-not-allowed opacity-40" : "hover:border-white/25 hover:text-white cursor-pointer"}`}>
                              <ChevronLeft className="h-3.5 w-3.5" /> Back
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => { setStep("service"); setSel(null); setShowOptions(false); setPickedOption(null); }}
                              className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-xs font-bold text-gray-300 transition-all hover:border-white/25 hover:text-white cursor-pointer"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" /> Back to Services
                            </button>
                            <button
                              type="button"
                              onClick={publishOffer}
                              disabled={publishing}
                              className="relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-7 py-4 text-xs font-black tracking-[0.18em] uppercase text-white shadow-[0_0_34px_rgba(90,120,255,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_50px_rgba(90,120,255,0.85)] cursor-pointer disabled:opacity-60"
                            >
                              <Send className="h-3.5 w-3.5" /> {publishing ? "Publishing..." : "Publish Offer"}
                            </button>
                            {pubError && (
                              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{pubError}</p>
                            )}
                          </>
                        )}
                        <a href="/" className="mt-0.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-gray-600 transition-colors hover:text-gray-400 hover:underline cursor-pointer">
                          Cancel & return to lobby
                        </a>
                        <div className="mt-2 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-600">
                          <Shield className="h-3 w-3" /> 100% Escrow protected · Instant post
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
