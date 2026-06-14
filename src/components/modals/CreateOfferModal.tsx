"use client";

import { X, Coins, Send, Zap, TrendingUp, ShieldCheck, ChevronDown, Key, Minus, Plus, RefreshCw, Bookmark, Trash2 } from "lucide-react";
import { memo, useMemo, useState, useCallback, useEffect, useReducer, useRef } from "react";
import { createPortal } from "react-dom";

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormData: any;
  onSubmit: (e: React.FormEvent, data: any) => void;
  submitError?: string;
  myVfxBg?: string;
  dungeons: { name: string; img: string; short: string }[];
  classGroups: Record<string, string[]>;
  classRoleOptions: Record<string, string[]>;
  offerDrafts?: { id: string; name: string; savedAt: number; formData: any }[];
  onSaveOfferDraft?: (name: string, formData: any) => void;
  onDeleteOfferDraft?: (id: string) => void;
  onDraftLoaded?: (name: string) => void;
}

type FormAction =
  | { type: "SET"; payload: Partial<any> }
  | { type: "RESET"; payload: any }
  | { type: "SET_DUNGEONS"; payload: Record<string, number> }
  | { type: "DISTRIBUTE"; payload: number }
  | { type: "TOGGLE_ROLE"; payload: "tank" | "healer" | "dps" }
  | { type: "SET_DPS"; payload: number }
  | { type: "TOGGLE_BLOCKED"; payload: { cls: string; role: string } };

function formReducer(prev: any, action: FormAction): any {
  switch (action.type) {
    case "SET":
      return { ...prev, ...action.payload };
    case "RESET":
      return action.payload;
    case "SET_DUNGEONS": {
      const newTotal = Object.values(action.payload).reduce((s: number, c: any) => s + (Number(c) || 0), 0);
      const prevRuns = parseInt(prev.runsCount as string) || 1;
      if (newTotal !== prevRuns) {
        return { ...prev, selectedDungeons: action.payload, runsCount: newTotal.toString() };
      }
      return { ...prev, selectedDungeons: action.payload };
    }
    case "DISTRIBUTE": {
      const n = action.payload;
      const selected = prev.selectedDungeons || {};
      const names = Object.keys(selected);
      if (names.length === 0) {
        return { ...prev, runsCount: n.toString(), selectedDungeons: {} };
      }
      const base = Math.floor(n / names.length);
      const rem = n % names.length;
      const updated: Record<string, number> = {};
      names.forEach((name, i) => {
        updated[name] = base + (i < rem ? 1 : 0);
      });
      return { ...prev, runsCount: n.toString(), selectedDungeons: updated };
    }
    case "TOGGLE_ROLE": {
      const role = action.payload;
      const current = prev.roles?.[role] || 0;
      return { ...prev, roles: { ...prev.roles, [role]: current > 0 ? 0 : 1 } };
    }
    case "SET_DPS": {
      const max = prev.category === "leveling" ? 1 : 2;
      return { ...prev, roles: { ...prev.roles, dps: Math.max(0, Math.min(max, action.payload)) } };
    }
    case "TOGGLE_BLOCKED": {
      const { cls, role } = action.payload;
      const current = prev.blockedRoles || [];
      const idx = current.findIndex((b: any) => b.class === cls && b.role === role);
      let updated;
      if (idx !== -1) {
        updated = current.filter((_: any, i: number) => i !== idx);
      } else {
        updated = [...current, { class: cls, role }];
      }
      return { ...prev, blockedRoles: updated };
    }
    default:
      return prev;
  }
}

function getKeyLevels(): string[] {
  return ["0", ...Array.from({ length: 39 }, (_, i) => `+${i + 2}`)];
}

const KEY_LEVELS = getKeyLevels();

const DungeonGrid = memo(function DungeonGrid({
  selectedDungeons,
  dispatch,
  dungeons,
}: {
  selectedDungeons: any;
  dispatch: React.Dispatch<FormAction>;
  dungeons: { name: string; img: string; short: string }[];
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", width: "100%" }}>
      {dungeons.map(d => {
        const count = selectedDungeons?.[d.name] || 0;
        return (
          <div
            key={d.name}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition cursor-pointer ${
              count > 0
                ? "border-[#00ffff]/40 bg-[#00ffff]/5 shadow-[0_0_8px_rgba(0,255,255,0.08)]"
                : "border-white/10 bg-black/30 hover:border-white/20"
            }`}
          >
            <img src={d.img} alt={d.name} className="w-8 h-8 rounded object-cover border border-white/10 flex-shrink-0" />
            <span className={`text-[10px] font-black truncate flex-1 ${count > 0 ? "text-[#00ffff]" : "text-white"}`}>{d.name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...selectedDungeons };
                  if (count <= 1) {
                    delete updated[d.name];
                  } else {
                    updated[d.name] = count - 1;
                  }
                  dispatch({ type: "SET_DUNGEONS", payload: updated });
                }}
                className="w-5 h-5 rounded bg-[#ff007f]/20 text-[#ff007f] font-black text-[9px] flex items-center justify-center hover:bg-[#ff007f] hover:text-white transition"
              >
                −
              </button>
              <span className={`text-[10px] font-black min-w-[12px] text-center ${count > 0 ? "text-[#00ffff]" : "text-gray-600"}`}>{count}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_DUNGEONS", payload: { ...selectedDungeons, [d.name]: count + 1 } })}
                className="w-5 h-5 rounded bg-[#00ffff]/20 text-[#00ffff] font-black text-[9px] flex items-center justify-center hover:bg-[#00ffff] hover:text-black transition"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const KeyLevelDropdown = memo(function KeyLevelDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-black/40 border border-[#00ffff]/20 rounded-lg px-3 py-1.5 text-white font-black text-base outline-none hover:border-[#00ffff]/40 transition"
      >
        <Key className="w-4 h-4" style={{ color: "#00ffff" }} />
        <span style={{ color: "#00ffff" }}>{value || "0"}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "#00ffff" }}
        />
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-[#0a0a16] border border-[#00ffff]/30 rounded-xl overflow-hidden z-50 shadow-[0_0_40px_rgba(0,255,255,0.15)] max-h-[260px] overflow-y-auto custom-scrollbar w-[10rem]">
          <div className="sticky top-0 bg-[#0a0a16] px-3 py-1.5 border-b border-white/5">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Select Level</span>
          </div>
          <div className="grid grid-cols-4 gap-1 p-1.5">
            {KEY_LEVELS.map(level => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  onChange(level);
                  setOpen(false);
                }}
                className={`px-2 py-1.5 rounded-lg text-center text-xs font-black transition ${
                  value === level
                    ? "bg-[#00ffff]/20 text-[#00ffff] shadow-[0_0_6px_rgba(0,255,255,0.2)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

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
        {category === "dungeon" ? (
          <div className="w-10 h-10 rounded-lg bg-[#00ffff]/10 border border-[#00ffff]/30 flex items-center justify-center">
            <Zap className="w-6 h-6" style={{ color: "#00ffff" }} />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[#8a2be2]/10 border border-[#8a2be2]/30 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" style={{ color: "#8a2be2" }} />
          </div>
        )}
        <span className="flex-1 text-left" style={{ color: category === "dungeon" ? "#00ffff" : "#8a2be2" }}>
          {category === "dungeon" ? "Dungeon Boost" : "Power Leveling"}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-[#0a0a16] border border-white/10 rounded-xl overflow-hidden z-[200] shadow-2xl w-[16rem]">
          <button
            type="button"
            onClick={() => {
              onChange("dungeon");
              setOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left text-base font-black transition hover:bg-white/5 ${
              category === "dungeon" ? "bg-[#00ffff]/10 text-[#00ffff]" : "text-white"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#00ffff]/10 border border-[#00ffff]/20 flex items-center justify-center">
              <Zap className="w-5 h-5" style={{ color: "#00ffff" }} />
            </div>
            Dungeon Boost
          </button>
          <button
            type="button"
            onClick={() => {
              onChange("leveling");
              setOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left text-base font-black transition hover:bg-white/5 ${
              category === "leveling" ? "bg-[#8a2be2]/10 text-[#8a2be2]" : "text-white"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#8a2be2]/10 border border-[#8a2be2]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" style={{ color: "#8a2be2" }} />
            </div>
            Power Leveling
          </button>
        </div>
      )}
    </div>
  );
});

const RegionToggle = memo(function RegionToggle({
  region,
  onChange,
}: {
  region: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-black text-sm transition border ${
        region === "EU"
          ? "bg-[#2d5ba0]/20 border-[#2d5ba0]/40 text-[#2d5ba0]"
          : "bg-[#ffd700]/20 border-[#ffd700]/40 text-[#ffd700]"
      }`}
    >
      <img src={region === "EU" ? "/flags/eu.svg" : "/flags/us.svg"} alt="" className="w-5 h-5 rounded-sm object-cover" loading="lazy" decoding="async" />
      <span>{region || "EU"}</span>
    </button>
  );
});

const RunsControl = memo(function RunsControl({
  runsCount,
  onDecrement,
  onIncrement,
  onChange,
}: {
  runsCount: string;
  onDecrement: () => void;
  onIncrement: () => void;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onDecrement}
        className="w-5 h-5 rounded-sm bg-[#ff007f]/20 text-[#ff007f] flex items-center justify-center hover:bg-[#ff007f] hover:text-white transition"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={runsCount || "1"}
        onChange={e => {
          const val = e.target.value.replace(/\D/g, "");
          onChange(val);
        }}
        className="bg-transparent font-black text-xl min-w-[1.5rem] text-center outline-none p-0 m-0 border-0 leading-none w-8"
        style={{ color: "#00ffff", caretColor: "#00ffff" }}
      />
      <button
        type="button"
        onClick={onIncrement}
        className="w-5 h-5 rounded-sm bg-[#00ffff]/20 text-[#00ffff] flex items-center justify-center hover:bg-[#00ffff] hover:text-black transition"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
});

const GoldInput = memo(function GoldInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="w-full flex items-baseline justify-center text-2xl font-black leading-none" style={{ color: "#ffd700" }}>
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
          width: `${Math.max(2, (value || "0").length)}ch`,
          minWidth: "2ch",
        }}
      />
      <span className="font-black text-base leading-none" style={{ color: "#ffd700" }}>
        K
      </span>
    </div>
  );
});

const OfferHeader = function OfferHeader({
  category,
  goldAmount,
  serverRegion,
  keyLevel,
  runsCount,
  roles,
  totalSelectedRuns,
  onSubmit,
  onClose,
  onCategoryChange,
  onRegionToggle,
  onKeyLevelChange,
  onGoldChange,
  onRunsChange,
  onRunsDecrement,
  onRunsIncrement,
}: {
  category: string;
  goldAmount: string;
  serverRegion: string;
  keyLevel: string;
  runsCount: string;
  roles: any;
  totalSelectedRuns: number;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onCategoryChange: (v: string) => void;
  onRegionToggle: () => void;
  onKeyLevelChange: (v: string) => void;
  onGoldChange: (v: string) => void;
  onRunsChange: (v: string) => void;
  onRunsDecrement: () => void;
  onRunsIncrement: () => void;
}) {
  const totalRoles = (roles?.tank || 0) + (roles?.healer || 0) + (roles?.dps || 0);
  const perRun = parseFloat(goldAmount) || 0;
  const runs = parseInt(runsCount as string) || 0;
  const totalPerRun = perRun * totalRoles;
  const totalOffer = totalPerRun * runs;

  return (
    <div className="relative z-30 mb-5 shrink-0 pr-16 md:pr-20">
      <div className="flex items-center gap-2 md:gap-3 flex-nowrap min-w-0 w-full">
        <button
          onClick={onSubmit}
          className="px-8 md:px-10 py-3.5 md:py-4 bg-[#ff007f] hover:bg-[#ff4d94] text-white font-black uppercase text-sm md:text-base rounded-xl shadow-xl transition shadow-[#ff007f]/20 hover:shadow-[#ff007f]/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
        >
          <Send className="w-5 h-5" /> Post Offer
        </button>

        <CategoryDropdown category={category} onChange={onCategoryChange} />

        <div className="flex items-stretch rounded-xl flex-nowrap shrink-0" style={{ boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
          <div className="px-2.5 md:px-3 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[4.5rem] border-r border-white/5">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 shrink-0 whitespace-nowrap" style={{ color: "#00ffff" }}>
              <Zap className="w-2.5 h-2.5" style={{ color: "#00ffff" }} /> KEY LEVEL
            </span>
            <KeyLevelDropdown value={keyLevel} onChange={onKeyLevelChange} />
          </div>
          <div className="px-2.5 md:px-3 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[4.5rem] border-l border-r border-white/5">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 shrink-0 whitespace-nowrap" style={{ color: "#00ffff" }}>
              <RefreshCw className="w-2.5 h-2.5" style={{ color: "#00ffff" }} /> RUNS
            </span>
            <RunsControl runsCount={runsCount} onDecrement={onRunsDecrement} onIncrement={onRunsIncrement} onChange={onRunsChange} />
          </div>
          <div className="px-2.5 md:px-3 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[4.5rem]">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 shrink-0 whitespace-nowrap" style={{ color: "#ffd700" }}>
              <Coins className="w-3 h-3" style={{ color: "#ffd700" }} /> PER RUN
            </span>
            <GoldInput value={goldAmount} onChange={onGoldChange} />
          </div>
          <div className="px-2.5 md:px-3 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[4.5rem] border-l border-white/5">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] shrink-0" style={{ color: "#ff66b2", whiteSpace: "nowrap" }}>
              TOTAL PLAYER
            </span>
            <span className="text-xl md:text-2xl font-black leading-none" style={{ color: "#ff66b2" }}>
              {totalPerRun % 1 === 0 ? totalPerRun : totalPerRun.toFixed(1)}
              <span className="font-black text-base" style={{ color: "#ff66b2" }}>K</span>
            </span>
          </div>
          <div className="px-2.5 md:px-3 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[4.5rem] border-l border-white/5">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] shrink-0" style={{ color: "#00ffff", whiteSpace: "nowrap" }}>
              TOTAL OFFER
            </span>
            <span className="text-xl md:text-2xl font-black leading-none" style={{ color: "#00ffff" }}>
              {totalOffer % 1 === 0 ? totalOffer : totalOffer.toFixed(1)}
              <span className="font-black text-base" style={{ color: "#00ffff" }}>K</span>
            </span>
          </div>
        </div>

        <div className="ml-auto shrink-0">
          <RegionToggle region={serverRegion} onChange={onRegionToggle} />
        </div>
      </div>
    </div>
  );
};

const LevelingHeader = memo(function LevelingHeader({
  goldAmount,
  serverRegion,
  category,
  onGoldChange,
  onRegionToggle,
  onCategoryChange,
  onSubmit,
}: {
  goldAmount: string;
  serverRegion: string;
  category: string;
  onGoldChange: (v: string) => void;
  onRegionToggle: () => void;
  onCategoryChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="relative z-30 mb-5 shrink-0 pr-16 md:pr-20">
      <div className="flex items-center gap-2 md:gap-3 flex-nowrap min-w-0 w-full">
        <button
          onClick={onSubmit}
          className="px-8 md:px-10 py-3.5 md:py-4 bg-[#ff007f] hover:bg-[#ff4d94] text-white font-black uppercase text-sm md:text-base rounded-xl shadow-xl transition shadow-[#ff007f]/20 hover:shadow-[#ff007f]/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
        >
          <Send className="w-5 h-5" /> Post Offer
        </button>

        <CategoryDropdown category={category} onChange={onCategoryChange} />

        <div className="flex items-stretch rounded-xl flex-nowrap shrink-0" style={{ boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
          <div className="px-4 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[6rem]">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 shrink-0 whitespace-nowrap" style={{ color: "#ffd700" }}>
              <Coins className="w-3 h-3" style={{ color: "#ffd700" }} /> GOLD
            </span>
            <GoldInput value={goldAmount} onChange={onGoldChange} />
          </div>
        </div>

        <div className="ml-auto shrink-0">
          <RegionToggle region={serverRegion} onChange={onRegionToggle} />
        </div>
      </div>
    </div>
  );
});

const BlockClassSection = memo(function BlockClassSection({
  blockedRoles,
  classGroups,
  classRoleOptions,
  dispatch,
}: {
  blockedRoles: any[];
  classGroups: Record<string, string[]>;
  classRoleOptions: Record<string, string[]>;
  dispatch: React.Dispatch<FormAction>;
}) {
  const classThumbSrc = (cls: string) => {
    const key =
      cls === "Death Knight" ? "DEATH KNIGHT" : cls === "Demon Hunter" ? "DEMON HUNTER" : cls.toUpperCase();
    return `/classes-thumb/${key}.png`;
  };

  const roleThumbSrc = (role: string) =>
    `/classes-thumb/${role === "tank" ? "TANK" : role === "healer" ? "HEALER" : "DPS"}.png`;

  return (
    <div className="bg-white/10 p-3 rounded-xl w-full min-w-0 flex-1 flex flex-col h-full">
      <label className="block text-[10px] font-black text-white/70 uppercase mb-2 tracking-wide flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-white/60" /> BLOCK CLASS
      </label>
      <div className="grid grid-cols-4 gap-1.5 min-w-0 w-full flex-1">
        {Object.entries(classGroups).map(([group, classes]) => {
          const allRolesInGroup: { class: string; role: string }[] = [];
          (classes as string[]).forEach(cls => {
            ((classRoleOptions[cls] || ["dps"]) as string[]).forEach(role => {
              allRolesInGroup.push({ class: cls, role });
            });
          });

          return (
            <div key={group} className="bg-white/5 rounded-lg p-1.5 min-w-0 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-1 gap-0.5 shrink-0">
                <label className="text-[7px] font-black uppercase tracking-[0.25em] text-white/60 truncate">{group}</label>
                <button
                  type="button"
                  onClick={() => {
                    const allRolesForGroup: { class: string; role: string }[] = [];
                    (classes as string[]).forEach(cls => {
                      ((classRoleOptions[cls] || ["dps"]) as string[]).forEach(role => {
                        allRolesForGroup.push({ class: cls, role });
                      });
                    });
                    const allBlocked = allRolesForGroup.every(br =>
                      (blockedRoles || []).some((c: any) => c.class === br.class && c.role === br.role)
                    );
                    const updated = allBlocked
                      ? (blockedRoles || []).filter((c: any) => !(classes as string[]).includes(c.class))
                      : [...(blockedRoles || []), ...allRolesForGroup];
                    dispatch({ type: "SET", payload: { blockedRoles: updated } });
                  }}
                  className="text-[6px] font-black uppercase tracking-wider text-red-400/70 hover:text-red-400 transition-colors shrink-0"
                >
                  BLOCK ALL
                </button>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-h-0">
                {(classes as string[])
                  .sort((a: string, b: string) => {
                    const stackA = (classRoleOptions[a] || ["dps"]).length;
                    const stackB = (classRoleOptions[b] || ["dps"]).length;
                    return stackB !== stackA ? stackB - stackA : a.localeCompare(b);
                  })
                  .map((cls: string) => {
                    const blockedForClass = (blockedRoles || []).filter((b: any) => b.class === cls);
                    const allBlocked = blockedForClass.length === (classRoleOptions[cls] || ["dps"]).length;
                    const roles = classRoleOptions[cls] || ["dps"];

                    return (
                      <div
                        key={cls}
                        className={`relative min-w-0 overflow-hidden rounded-lg border ${
                          allBlocked ? "border-red-500/30 bg-red-500/10" : "border-white/5 bg-white/[0.04]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const updated = allBlocked
                              ? (blockedRoles || []).filter((b: any) => b.class !== cls)
                              : [...(blockedRoles || []), ...(roles as string[]).map(r => ({ class: cls, role: r }))];
                            dispatch({ type: "SET", payload: { blockedRoles: updated } });
                          }}
                          className="w-full flex flex-col items-center gap-0.5 px-1 pt-1.5 pb-0.5 transition-colors hover:bg-white/[0.06]"
                        >
                          <div className="w-8 h-8 rounded-md bg-black/30 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={classThumbSrc(cls)}
                              alt=""
                              className="w-8 h-8 object-contain"
                              decoding="async"
                            />
                          </div>
                          <span className="text-[6px] font-black uppercase tracking-wide text-white/75 truncate w-full text-center leading-none px-0.5">
                            {cls}
                          </span>
                        </button>
                        <div className="flex justify-center gap-0.5 px-1 pb-1.5">
                          {(roles as string[]).map((role: string) => {
                            const isBlocked = blockedForClass.some((b: any) => b.role === role);
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  const existing = (blockedRoles || []).findIndex(
                                    (b: any) => b.class === cls && b.role === role
                                  );
                                  const updated = existing >= 0
                                    ? (blockedRoles || []).filter((_: any, i: number) => i !== existing)
                                    : [...(blockedRoles || []), { class: cls, role }];
                                  dispatch({ type: "SET", payload: { blockedRoles: updated } });
                                }}
                                className={`flex items-center justify-center w-8 h-8 rounded-md transition shrink-0 overflow-hidden ${
                                  isBlocked ? "bg-red-500/25 ring-1 ring-red-400/40" : "bg-white/10 hover:bg-white/15"
                                }`}
                              >
                                <img
                                  src={roleThumbSrc(role)}
                                  alt=""
                                  className="w-7 h-7 object-contain"
                                  decoding="async"
                                />
                              </button>
                            );
                          })}
                        </div>
                        {allBlocked && (
                          <X className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-red-400 pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const LEVELING_DEFAULT_ROLES = { tank: 1, healer: 0, dps: 1 };
const DUNGEON_DEFAULT_ROLES = { tank: 1, healer: 1, dps: 2 };

const RolesNeededSection = memo(function RolesNeededSection({
  roles,
  dispatch,
  variant = "dungeon",
}: {
  roles: Record<string, number>;
  dispatch: React.Dispatch<FormAction>;
  variant?: "dungeon" | "leveling";
}) {
  const isLeveling = variant === "leveling";
  const accent = isLeveling ? "#8a2be2" : "#00ffff";
  const activeBg = isLeveling ? "bg-[#8a2be2]/15 shadow-[0_0_8px_rgba(138,43,226,0.12)]" : "bg-[#00ffff]/15 shadow-[0_0_8px_rgba(0,255,255,0.1)]";

  return (
    <div className="bg-white/10 p-3 rounded-xl">
      <label className={`block text-[10px] font-black uppercase mb-2 tracking-wide ${isLeveling ? "text-[#8a2be2]" : "text-white/70"}`}>
        Roles Needed
      </label>
      <div className="flex flex-row flex-wrap gap-2 min-w-0">
        <div
          onClick={() => dispatch({ type: "TOGGLE_ROLE", payload: "tank" })}
          className={`relative rounded-lg transition cursor-pointer flex flex-col items-center justify-center py-3 px-3 flex-1 min-h-[72px] ${
            roles?.tank > 0 ? activeBg : "bg-white/5 opacity-50 hover:opacity-100"
          }`}
        >
          <img src="/classes-thumb/TANK.png" className="w-8 h-8 mb-1" decoding="async" alt="" />
          <span className="text-[9px] font-black uppercase text-white">Tank</span>
          <div
            className="w-2 h-2 rounded-full mt-1"
            style={{
              backgroundColor: roles?.tank > 0 ? accent : "#4b5563",
              boxShadow: roles?.tank > 0 ? `0 0 6px ${accent}` : undefined,
            }}
          />
        </div>
        {!isLeveling && (
          <div
            onClick={() => dispatch({ type: "TOGGLE_ROLE", payload: "healer" })}
            className={`relative rounded-lg transition cursor-pointer flex flex-col items-center justify-center py-3 px-3 flex-1 min-h-[72px] ${
              roles?.healer > 0 ? activeBg : "bg-white/5 opacity-50 hover:opacity-100"
            }`}
          >
            <img src="/classes-thumb/HEALER.png" className="w-8 h-8 mb-1" decoding="async" alt="" />
            <span className="text-[9px] font-black uppercase text-white">Heal</span>
            <div
              className="w-2 h-2 rounded-full mt-1"
              style={{
                backgroundColor: roles?.healer > 0 ? accent : "#4b5563",
                boxShadow: roles?.healer > 0 ? `0 0 6px ${accent}` : undefined,
              }}
            />
          </div>
        )}
        {isLeveling ? (
          <div
            onClick={() => dispatch({ type: "TOGGLE_ROLE", payload: "dps" })}
            className={`relative rounded-lg transition cursor-pointer flex flex-col items-center justify-center py-3 px-3 flex-1 min-h-[72px] ${
              roles?.dps > 0 ? activeBg : "bg-white/5 opacity-50 hover:opacity-100"
            }`}
          >
            <img src="/classes-thumb/DPS.png" className="w-8 h-8 mb-1" decoding="async" alt="" />
            <span className="text-[9px] font-black uppercase text-white">DPS</span>
            <div
              className="w-2 h-2 rounded-full mt-1"
              style={{
                backgroundColor: roles?.dps > 0 ? accent : "#4b5563",
                boxShadow: roles?.dps > 0 ? `0 0 6px ${accent}` : undefined,
              }}
            />
          </div>
        ) : (
          <div
            className={`relative rounded-lg transition flex flex-col items-center justify-center py-3 px-3 flex-1 min-h-[72px] ${
              roles?.dps > 0 ? activeBg : "bg-white/5 opacity-50 hover:opacity-100"
            }`}
          >
            <img src="/classes-thumb/DPS.png" className="w-8 h-8 mb-1" decoding="async" alt="" />
            <span className="text-[9px] font-black uppercase text-white">DPS</span>
            <div className="flex items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_DPS", payload: (roles?.dps || 0) - 1 })}
                className="w-4 h-4 rounded-sm font-black text-[8px] flex items-center justify-center transition bg-[#ff007f]/20 text-[#ff007f] hover:bg-[#ff007f] hover:text-white"
              >
                −
              </button>
              <span
                className="text-[10px] font-black min-w-[10px] text-center"
                style={{ color: roles?.dps > 0 ? accent : "#4b5563" }}
              >
                {roles?.dps || 0}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_DPS", payload: (roles?.dps || 0) + 1 })}
                disabled={(roles?.dps || 0) >= 2}
                className="w-4 h-4 rounded-sm font-black text-[8px] flex items-center justify-center transition disabled:opacity-30 bg-[#00ffff]/20 text-[#00ffff] hover:bg-[#00ffff] hover:text-black"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const LevelRangeSection = memo(function LevelRangeSection({
  startLevel,
  endLevel,
  dispatch,
}: {
  startLevel: string;
  endLevel: string;
  dispatch: React.Dispatch<FormAction>;
}) {
  return (
    <div className="bg-white/10 p-4 rounded-xl">
      <label className="block text-[10px] font-black text-[#8a2be2] uppercase mb-3 tracking-wide">Level Range</label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-[8px] font-black text-[#8a2be2] uppercase tracking-widest mb-2">From</label>
          <input
            type="number"
            min="1"
            max="90"
            value={startLevel || "1"}
            onChange={e => dispatch({ type: "SET", payload: { startLevel: e.target.value } })}
            className="w-full bg-black/40 border border-[#8a2be2]/30 rounded-lg px-4 py-3 font-black text-base text-center outline-none focus:border-[#8a2be2]/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ color: "#8a2be2" }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[8px] font-black text-[#8a2be2] uppercase tracking-widest mb-2">To</label>
          <input
            type="number"
            min="1"
            max="90"
            value={endLevel || "70"}
            onChange={e => dispatch({ type: "SET", payload: { endLevel: e.target.value } })}
            className="w-full bg-black/40 border border-[#8a2be2]/30 rounded-lg px-4 py-3 font-black text-base text-center outline-none focus:border-[#8a2be2]/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ color: "#8a2be2" }}
          />
        </div>
      </div>
    </div>
  );
});

const LevelingMinReqSection = memo(function LevelingMinReqSection({
  minIlvl,
  minScore,
  dispatch,
}: {
  minIlvl: string;
  minScore: string;
  dispatch: React.Dispatch<FormAction>;
}) {
  return (
    <div className="bg-white/10 p-3 rounded-xl">
      <label className="block text-[10px] font-black text-[#8a2be2] uppercase mb-2 tracking-wide">Requirements</label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[8px] font-black text-orange-400 text-center uppercase tracking-widest mb-1">Min iLvl</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="ilvl"
            value={minIlvl || ""}
            onChange={e => dispatch({ type: "SET", payload: { minIlvl: e.target.value.replace(/\D/g, "") } })}
            className="w-full bg-black/40 border border-orange-400/30 rounded-lg px-2 py-2.5 text-orange-400 font-black text-xs text-center outline-none focus:border-orange-400/60"
          />
        </div>
        <div>
          <label className="block text-[8px] font-black text-center uppercase tracking-widest mb-1 text-[#a855f7]">Min IO</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="io"
            value={minScore || ""}
            onChange={e => dispatch({ type: "SET", payload: { minScore: e.target.value.replace(/\D/g, "") } })}
            className="w-full bg-black/40 border border-[#8a2be2]/30 rounded-lg px-2 py-2.5 font-black text-xs text-center outline-none focus:border-[#8a2be2]/60 text-[#a855f7]"
          />
        </div>
      </div>
    </div>
  );
});

const NotesField = memo(function NotesField({
  value,
  dispatch,
  rows,
  variant = "dungeon",
}: {
  value: string;
  dispatch: React.Dispatch<FormAction>;
  rows: number;
  variant?: "dungeon" | "leveling";
}) {
  const isLeveling = variant === "leveling";
  return (
    <div className="bg-white/10 p-3 rounded-xl">
        <label className={`block text-[9px] font-black uppercase mb-2 tracking-wide ${isLeveling ? "text-[#8a2be2]" : "text-gray-400"}`}>Notes</label>
        <textarea
          rows={rows}
          placeholder="Any additional requirements..."
          value={value}
          onChange={e => dispatch({ type: "SET", payload: { notes: e.target.value } })}
          className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-white font-black text-xs outline-none resize-none ${
            isLeveling ? "border-[#8a2be2]/30 focus:border-[#8a2be2]/60 min-h-[140px]" : "border-white/10 focus:border-[#00ffff]/50"
          }`}
          style={{ resize: "none" }}
        />
      </div>
  );
});

const OfferDraftsBar = memo(function OfferDraftsBar({
  drafts,
  category,
  formState,
  onSave,
  onDelete,
  onLoad,
  onLoaded,
}: {
  drafts: { id: string; name: string; savedAt: number; formData: any }[];
  category: string;
  formState: any;
  onSave?: (name: string, formData: any) => void;
  onDelete?: (id: string) => void;
  onLoad: (formData: any) => void;
  onLoaded?: (name: string) => void;
}) {
  const [naming, setNaming] = useState(false);
  const [draftName, setDraftName] = useState("");

  const filtered = useMemo(
    () => drafts.filter(d => (d.formData?.category || "dungeon") === category),
    [drafts, category]
  );

  const confirmSave = () => {
    const name = draftName.trim();
    if (!name) return;
    onSave?.(name, { ...formState });
    setDraftName("");
    setNaming(false);
  };

  const typeLabel = category === "leveling" ? "Leveling" : "Dungeon";

  return (
    <div className="relative z-10 mt-3 pt-3 border-t border-yellow-500/20 rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.06] px-4 py-3 shadow-[0_0_24px_rgba(234,179,8,0.08)] shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-[9px] font-black uppercase tracking-[0.28em] text-yellow-400 flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5" />
          Saved Profiles — {typeLabel}
        </div>
        {naming ? (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              autoFocus
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") confirmSave(); if (e.key === "Escape") { setNaming(false); setDraftName(""); } }}
              placeholder="Name this draft..."
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
      {filtered.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filtered.map(d => (
            <div key={d.id} className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 overflow-hidden">
              <button
                type="button"
                onClick={() => { onLoad(d.formData); onLoaded?.(d.name); }}
                className="px-3 py-2 text-[10px] font-black text-white hover:bg-[#00ffff]/15 hover:text-[#00ffff] transition-all"
                title="Load this draft"
              >
                {d.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(d.id)}
                className="px-2 py-2 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-all border-l border-white/10"
                title="Delete draft"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] font-bold text-gray-500">
          No saved drafts for {typeLabel} yet — configure your offer, then tap <span className="text-yellow-400">Save Profile</span>.
        </p>
      )}
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
  dungeons,
  classGroups,
  classRoleOptions,
  offerDrafts = [],
  onSaveOfferDraft,
  onDeleteOfferDraft,
  onDraftLoaded,
}: CreateOfferModalProps) {

  const [formState, dispatch] = useReducer(formReducer, initialFormData);

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: "RESET", payload: initialFormData });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const stateRef = useRef(formState);
  stateRef.current = formState;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRef.current(e, stateRef.current);
  }, []);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const totalSelectedRuns = useMemo(() => {
    return (Object.values(formState.selectedDungeons || {}) as number[]).reduce(
      (sum: number, count: number) => sum + count, 0
    );
  }, [formState.selectedDungeons]);

  const handleCategoryChange = useCallback((v: string) => {
    dispatch({
      type: "SET",
      payload: {
        category: v,
        roles: v === "leveling" ? { ...LEVELING_DEFAULT_ROLES } : { ...DUNGEON_DEFAULT_ROLES },
      },
    });
  }, []);

  const handleRegionToggle = useCallback(() => {
    dispatch({
      type: "SET",
      payload: { serverRegion: stateRef.current.serverRegion === "EU" ? "US" : "EU" },
    });
  }, []);

  const handleKeyLevelChange = useCallback((v: string) => {
    dispatch({ type: "SET", payload: { keyLevel: v } });
  }, []);

  const handleGoldChange = useCallback((val: string) => {
    if (val === "") {
      dispatch({ type: "SET", payload: { goldAmount: "", goldPerRun: "0" } });
    } else if (/^\d*\.?\d*$/.test(val)) {
      dispatch({
        type: "SET",
        payload: { goldAmount: val, goldPerRun: (parseFloat(val) || 0).toString() },
      });
    }
  }, []);

  const handleRunsChange = useCallback((val: string) => {
    if (val === "" || parseInt(val) > 0) {
      const numVal = val === "" ? 1 : parseInt(val);
      dispatch({ type: "SET", payload: { runsCount: val || "1" } });
      if (val && numVal > 0) {
        dispatch({ type: "DISTRIBUTE", payload: numVal });
      }
    }
  }, []);

  const handleRunsDecrement = useCallback(() => {
    const current = parseInt(stateRef.current.runsCount as string) || 1;
    if (current > 1) {
      dispatch({ type: "DISTRIBUTE", payload: current - 1 });
    }
  }, []);

  const handleRunsIncrement = useCallback(() => {
    const current = parseInt(stateRef.current.runsCount as string) || 1;
    dispatch({ type: "DISTRIBUTE", payload: current + 1 });
  }, []);

  if (!isOpen) return null;

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

        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-3.5 bg-white/5 hover:bg-white/10 rounded-full z-50"
        >
          <X className="w-6 h-6" />
        </button>

        {formState.category === "dungeon" && (
          <OfferHeader
            category={formState.category}
            goldAmount={formState.goldAmount}
            serverRegion={formState.serverRegion}
            keyLevel={formState.keyLevel}
            runsCount={formState.runsCount}
            roles={formState.roles}
            totalSelectedRuns={totalSelectedRuns}
            onSubmit={handleSubmit}
            onClose={handleClose}
            onCategoryChange={handleCategoryChange}
            onRegionToggle={handleRegionToggle}
            onKeyLevelChange={handleKeyLevelChange}
            onGoldChange={handleGoldChange}
            onRunsChange={handleRunsChange}
            onRunsDecrement={handleRunsDecrement}
            onRunsIncrement={handleRunsIncrement}
          />
        )}

        {formState.category === "leveling" && (
          <LevelingHeader
            goldAmount={formState.goldAmount}
            serverRegion={formState.serverRegion}
            category={formState.category}
            onGoldChange={handleGoldChange}
            onRegionToggle={handleRegionToggle}
            onCategoryChange={handleCategoryChange}
            onSubmit={handleSubmit}
          />
        )}

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-0 min-w-0">
        {submitError && (
          <div className="absolute left-6 right-20 top-20 z-[60] rounded-xl border border-red-500/50 bg-red-950/90 px-4 py-3 shadow-[0_0_30px_rgba(239,68,68,0.25)] backdrop-blur-md">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-red-400/80">Frequency Alert</p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-red-200">{submitError}</p>
          </div>
        )}

        {formState.category === "dungeon" && (
          <div className="space-y-2 mt-2">
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
              <label className="block text-xs font-black text-[#00ffff] uppercase mb-2 tracking-wide">
                Dungeons
              </label>
              <DungeonGrid
                selectedDungeons={formState.selectedDungeons}
                dispatch={dispatch}
                dungeons={dungeons}
              />
            </div>
            <div className="flex flex-col xl:flex-row gap-2 items-stretch min-w-0 w-full">
              <div className="flex flex-[1_1_0%] min-w-0 w-full">
                <BlockClassSection
                  blockedRoles={formState.blockedRoles}
                  classGroups={classGroups}
                  classRoleOptions={classRoleOptions}
                  dispatch={dispatch}
                />
              </div>
              <div className="flex flex-col gap-2 shrink-0 w-full xl:w-[230px] xl:max-w-[230px] min-w-0">
                <RolesNeededSection roles={formState.roles} dispatch={dispatch} variant="dungeon" />
                <div className="bg-white/10 p-3 rounded-xl flex flex-col gap-2 flex-1">
                  <div className="flex flex-col gap-2 pt-0 border-t-0">
                    <div>
                      <label className="block text-[8px] font-black text-orange-400 text-center uppercase tracking-widest mb-1">Min iLvl</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="ilvl"
                        value={formState.minIlvl || ""}
                        onChange={e => dispatch({ type: "SET", payload: { minIlvl: e.target.value.replace(/\D/g, '') } })}
                        className="w-full bg-black/40 border border-orange-400/30 rounded-lg px-2 py-2.5 text-orange-400 font-black text-xs text-center outline-none focus:border-orange-400/60"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-center uppercase tracking-widest mb-1" style={{ color: "#a855f7" }}>
                        Min IO
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="io"
                        value={formState.minScore || ""}
                        onChange={e => dispatch({ type: "SET", payload: { minScore: e.target.value.replace(/\D/g, '') } })}
                        className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-2 py-2.5 font-black text-xs text-center outline-none focus:border-purple-500/60"
                        style={{ color: "#a855f7" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <NotesField value={formState.notes} dispatch={dispatch} rows={7} />
          </div>
        )}

        {formState.category === "leveling" && (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <LevelRangeSection
                startLevel={formState.startLevel}
                endLevel={formState.endLevel}
                dispatch={dispatch}
              />
              <RolesNeededSection roles={formState.roles} dispatch={dispatch} variant="leveling" />
            </div>
            <LevelingMinReqSection
              minIlvl={formState.minIlvl}
              minScore={formState.minScore}
              dispatch={dispatch}
            />
            <div className="mt-5 pt-1">
              <NotesField value={formState.notes} dispatch={dispatch} rows={6} variant="leveling" />
            </div>
          </div>
        )}
        </div>

        <OfferDraftsBar
          drafts={offerDrafts}
          category={formState.category}
          formState={formState}
          onSave={onSaveOfferDraft}
          onDelete={onDeleteOfferDraft}
          onLoad={data => dispatch({ type: "RESET", payload: data })}
          onLoaded={onDraftLoaded}
        />
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
