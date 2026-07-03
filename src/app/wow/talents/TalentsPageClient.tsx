"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Swords, HeartHandshake, Shield, ArrowUpDown } from "lucide-react";
import Image from "next/image";
import { SPECS, getClassColor, type WoWSpec } from "@/lib/wowData";

const CLASS_NAMES: Record<string, string> = {
  "death-knight": "Death Knight",
  "demon-hunter": "Demon Hunter",
  druid: "Druid",
  evoker: "Evoker",
  hunter: "Hunter",
  mage: "Mage",
  monk: "Monk",
  paladin: "Paladin",
  priest: "Priest",
  rogue: "Rogue",
  shaman: "Shaman",
  warlock: "Warlock",
  warrior: "Warrior",
};

const ROLES = [
  { id: "all", label: "All", icon: null },
  { id: "dps", label: "DPS", icon: Swords },
  { id: "healer", label: "Healer", icon: HeartHandshake },
  { id: "tank", label: "Tank", icon: Shield },
] as const;

const roleColors: Record<string, string> = {
  dps: "#ff4444",
  healer: "#00cc66",
  tank: "#4488ff",
};

const ALL_CLASSES = Array.from(new Set(SPECS.map((s) => s.classId)))
  .sort()
  .map((id) => ({
    id,
    name: CLASS_NAMES[id] || id,
    color: getClassColor(id),
  }));

export default function TalentsPageClient() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "class">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = [...SPECS];

    if (roleFilter !== "all") {
      result = result.filter((s) => s.role === roleFilter);
    }

    if (classFilter) {
      result = result.filter((s) => s.classId === classFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          CLASS_NAMES[s.classId]?.toLowerCase().includes(q) ||
          s.role.includes(q),
      );
    }

    result.sort((a, b) => {
      let cmp: number;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = CLASS_NAMES[a.classId]?.localeCompare(CLASS_NAMES[b.classId] || "") || 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [search, roleFilter, classFilter, sortBy, sortDir]);

  const toggleSort = (field: "name" | "class") => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
            All <span className="text-[#00ffff]">Talents</span>
          </h1>
          <p className="text-sm text-gray-400">
            Browse talent builds for every spec. Filter by role, class, or search by name.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by spec or class name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ffff]/30 transition"
          />
        </div>

        {/* Role filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = roleFilter === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setRoleFilter(role.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                  isActive
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:border-white/10"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {role.label}
              </button>
            );
          })}
        </div>

        {/* Class filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {classFilter && (
            <button
              onClick={() => setClassFilter(null)}
              className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/20 transition"
            >
              ✕ Clear
            </button>
          )}
          {ALL_CLASSES.map((cls) => {
            const isActive = classFilter === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => setClassFilter(isActive ? null : cls.id)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  isActive
                    ? "text-white border-white/20"
                    : "text-gray-500 border-white/5 hover:text-white hover:border-white/10"
                }`}
                style={
                  isActive
                    ? { backgroundColor: `${cls.color}25`, borderColor: `${cls.color}60` }
                    : {}
                }
              >
                {cls.name}
              </button>
            );
          })}
        </div>

        {/* Sort header */}
        <div className="flex items-center gap-4 mb-4 text-[9px] font-black uppercase tracking-widest text-gray-500">
          <div className="flex items-center gap-2">
            <span>Sort:</span>
            <button
              onClick={() => toggleSort("name")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition ${
                sortBy === "name" ? "text-white bg-white/10" : "hover:text-white"
              }`}
            >
              Name <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => toggleSort("class")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition ${
                sortBy === "class" ? "text-white bg-white/10" : "hover:text-white"
              }`}
            >
              Class <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
          <span className="text-gray-600">{filtered.length} specs</span>
        </div>

        {/* Spec grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No specs match your filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((spec) => (
              <SpecCard key={spec.id} spec={spec} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SpecCard({ spec }: { spec: WoWSpec }) {
  const color = getClassColor(spec.classId);
  const roleIcon = spec.role === "tank" ? "🛡" : spec.role === "healer" ? "💚" : "⚔";
  const roleLabel = spec.role === "tank" ? "Tank" : spec.role === "healer" ? "Healer" : "DPS";
  const roleColor = roleColors[spec.role];

  return (
    <Link
      href={`/wow/spec/${spec.id}`}
      className="group bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-2xl p-4 hover:border-white/10 transition flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Image src={spec.icon} alt="" width={32} height={32} className="rounded-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-black text-white group-hover:text-[#00ffff] transition truncate">
          {spec.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
            {CLASS_NAMES[spec.classId] || spec.classId}
          </span>
          <span
            className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ backgroundColor: `${roleColor}20`, color: roleColor }}
          >
            {roleLabel}
          </span>
        </div>
      </div>
      <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
