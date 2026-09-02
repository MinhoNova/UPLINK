"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword,
  Shield,
  Coins,
  Bell,
  ChevronDown,
  Zap,
  Users,
  Search,
  Crown,
  Sparkles,
  X,
  Send,
  Flame,
  Gem,
  Skull,
  Swords,
  Star,
  Gauge,
  MapPin,
  Layers,
  Plus,
} from "lucide-react";
import { AION_SERVICES, AION_CATEGORIES, formatUsd, AionService } from "@/lib/aionServices";

const CATEGORY_META: Record<string, { icon: any; color: string; glow: string }> = {
  Dungeons: { icon: Swords, color: "#00ffff", glow: "rgba(0,255,255,0.35)" },
  Leveling: { icon: Sparkles, color: "#8b5cf6", glow: "rgba(139,92,246,0.35)" },
  Boosts: { icon: Zap, color: "#ff007f", glow: "rgba(255,0,127,0.35)" },
  PVP: { icon: Flame, color: "#f97316", glow: "rgba(249,115,22,0.35)" },
  Raids: { icon: Skull, color: "#e11d48", glow: "rgba(225,29,72,0.35)" },
  Currency: { icon: Coins, color: "#fbbf24", glow: "rgba(251,191,36,0.35)" },
  Collections: { icon: Gem, color: "#22d3ee", glow: "rgba(34,211,238,0.35)" },
  Professions: { icon: Star, color: "#a855f7", glow: "rgba(168,85,247,0.35)" },
};

const NAV_ITEMS = [
  { label: "CLUB", icon: Crown, href: "#club" },
  { label: "MISSIONS", icon: Swords, href: "#offers" },
  { label: "MARKET", icon: Coins, href: "#offers" },
  { label: "SUPPORT", icon: Search, href: "#support" },
];

const FILTER_TABS = [
  { label: "DUNGEONS", key: "all" },
  { label: "LEVELING", key: "Leveling" },
  { label: "BOOSTS", key: "Boosts" },
  { label: "PVP", key: "PVP" },
];

const REGIONS = ["EU", "NA"] as const;

interface OfferCard {
  id: string;
  serviceId: string;
  name: string;
  category: string;
  quantity: number;
  priceUsd: number;
  paymentMethod: "kinah" | "cash";
  speed: string;
  region: string;
  owner: string;
  ownerClass: string;
  createdAt: number;
}

const SEED_OFFERS: OfferCard[] = [
  {
    id: "seed-1",
    serviceId: "expeditions",
    name: "Expeditions",
    category: "Dungeons",
    quantity: 4,
    priceUsd: 21.5,
    paymentMethod: "kinah",
    speed: "Express",
    region: "EU",
    owner: "Kael'thas",
    ownerClass: "Templar",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "seed-2",
    serviceId: "powerleveling",
    name: "Powerleveling",
    category: "Leveling",
    quantity: 1,
    priceUsd: 184,
    paymentMethod: "cash",
    speed: "Super Express",
    region: "EU",
    owner: "Nerezza",
    ownerClass: "Spiritmaster",
    createdAt: Date.now() - 7200000,
  },
  {
    id: "seed-3",
    serviceId: "abyss-points",
    name: "Abyss Points Farm",
    category: "PVP",
    quantity: 10,
    priceUsd: 80,
    paymentMethod: "kinah",
    speed: "Standard",
    region: "NA",
    owner: "Vaeloria",
    ownerClass: "Assassin",
    createdAt: Date.now() - 10800000,
  },
  {
    id: "seed-4",
    serviceId: "ludra",
    name: "Abyssal Forge: Ludra",
    category: "Raids",
    quantity: 2,
    priceUsd: 93,
    paymentMethod: "cash",
    speed: "Express",
    region: "NA",
    owner: "Aurelius",
    ownerClass: "Cleric",
    createdAt: Date.now() - 14400000,
  },
];

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Aion2LobbyPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [offers, setOffers] = useState<OfferCard[]>(SEED_OFFERS);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("EU");
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; size: number; delay: number; dur: number }[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Floating particles
  useEffect(() => {
    const p = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 5,
      delay: Math.random() * 8,
      dur: 10 + Math.random() * 12,
    }));
    setParticles(p);
  }, []);

  const filtered = useMemo(
    () => (activeTab === "all" ? offers : offers.filter(o => o.category === activeTab)),
    [activeTab, offers]
  );

  const handlePublish = useCallback((data: { serviceId: string; quantity: number; priceUsd: number; paymentMethod: "kinah" | "cash"; speed: string }) => {
    const svc = AION_SERVICES.find(s => s.id === data.serviceId);
    if (!svc) return;
    const offer: OfferCard = {
      id: Date.now().toString(),
      serviceId: svc.id,
      name: svc.name,
      category: svc.category,
      quantity: data.quantity,
      priceUsd: data.priceUsd,
      paymentMethod: data.paymentMethod,
      speed: data.speed,
      region: selectedRegion,
      owner: "You",
      ownerClass: "Daeva",
      createdAt: Date.now(),
    };
    setOffers(prev => [offer, ...prev]);
    setShowCreate(false);
    setActiveTab("all");
  }, [selectedRegion]);

  return (
    <div className="min-h-screen bg-[#05060f] text-white relative overflow-x-hidden">
      {/* Global background */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/AIO2.png')", opacity: 0.4 }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#05060f]/70 via-[#070a1a]/85 to-[#05060f]" />

      {/* Floating particles */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: "radial-gradient(circle, rgba(0,255,255,0.6), transparent)",
              boxShadow: "0 0 6px rgba(0,255,255,0.4)",
              animation: `floatUp ${p.dur}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#05060f]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Branding */}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-600/30 border border-cyan-300/40 flex items-center justify-center overflow-hidden">
              <Swords className="w-5 h-5 text-cyan-300" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-cyan-300/20" />
            </div>
            <div className="leading-none">
              <div className="text-[11px] font-black tracking-[0.3em] text-cyan-200 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">AION 2</div>
              <div className="text-[7px] font-bold tracking-[0.25em] text-purple-400/80 uppercase mt-1">Community Lobby</div>
            </div>
          </button>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {NAV_ITEMS.map(item => (
              <a
                key={item.label}
                href={item.href}
                className="group relative px-4 py-2 text-[10px] font-black tracking-[0.2em] text-gray-400 hover:text-cyan-200 transition-colors flex items-center gap-2"
              >
                <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-300 transition-colors" />
                <span>{item.label}</span>
                <span className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-all scale-x-0 group-hover:scale-x-100 origin-center" style={{ transition: "all .3s" }} />
              </a>
            ))}
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="relative w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center hover:border-cyan-400/40 transition-colors">
              <Bell className="w-4 h-4 text-gray-300" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,255,255,0.8)]" />
            </button>

            {/* User */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-400/40 transition-colors"
              >
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/40 to-cyan-500/30 border border-purple-400/40 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-200" />
                </div>
                <div className="hidden sm:block text-left leading-none">
                  <div className="text-[10px] font-black text-white">Vaeloria</div>
                  <div className="text-[7px] font-bold text-purple-400 mt-0.5 flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> CLUB
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-[#0a0c18]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    {["Profile", "My Offers", "Balance", "Settings"].map(label => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-[11px] font-black text-gray-300 hover:bg-white/5 hover:text-cyan-200 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section id="club" className="relative pt-14 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto relative">
          {/* Wing decorations left/right */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-40 h-72 pointer-events-none opacity-60 hidden lg:block">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(0,255,255,0.18),transparent)]" />
            <div className="absolute left-4 top-1/2 w-px h-56 bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent rotate-[-20deg] origin-center" />
            <div className="absolute left-8 top-1/2 w-px h-48 bg-gradient-to-b from-transparent via-cyan-300/30 to-transparent rotate-[-8deg] origin-center" />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-72 pointer-events-none opacity-60 hidden lg:block">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)]" />
            <div className="absolute right-4 top-1/2 w-px h-56 bg-gradient-to-b from-transparent via-purple-300/40 to-transparent rotate-[20deg] origin-center" />
            <div className="absolute right-8 top-1/2 w-px h-48 bg-gradient-to-b from-transparent via-purple-300/30 to-transparent rotate-[8deg] origin-center" />
          </div>

          {/* Top aurora */}
          <div className="absolute inset-x-0 -top-6 h-40 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(0,255,255,0.08),transparent)]" />

          <div className="relative text-center py-10">
            <div className="inline-flex items-center gap-3 mb-6 px-5 py-2 rounded-full border border-cyan-300/20 bg-black/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[9px] font-black tracking-[0.35em] text-cyan-100/80 uppercase">The First Egyptian Aion 2 Community</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[0.12em] text-white leading-none">
              <span className="bg-gradient-to-b from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.35)]">AION 2</span>
            </h1>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black tracking-[0.3em] uppercase bg-gradient-to-r from-cyan-200 via-white to-purple-300 bg-clip-text text-transparent">
              FIND YOUR CREW
            </h2>
            <p className="mt-4 text-[10px] sm:text-xs font-black tracking-[0.4em] text-gray-400 uppercase">
              KEYS <span className="text-cyan-400 mx-1">•</span> BOOSTS <span className="text-purple-400 mx-1">•</span> LEVELING
            </p>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="group relative px-8 sm:px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm text-white overflow-hidden
                  bg-gradient-to-r from-cyan-500/25 via-purple-600/25 to-cyan-500/25 border border-cyan-300/40
                  shadow-[0_0_30px_rgba(0,255,255,0.15)] hover:shadow-[0_0_50px_rgba(139,92,246,0.3)]
                  hover:border-purple-300/60 transition-all duration-300"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700" />
                <span className="relative flex items-center gap-2">
                  <Plus className="w-4 h-4" /> CREATE YOUR OFFER
                </span>
              </button>
            </div>

            {/* Mini stats */}
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              {[
                { icon: Users, label: "1,630 PROs online", color: "#00ffff" },
                { icon: Zap, label: "5.0 rated", color: "#fbbf24" },
                { icon: Shield, label: "Safe & secure", color: "#8b5cf6" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 border border-white/10 backdrop-blur-md">
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  <span className="text-[9px] font-black tracking-widest text-gray-300 uppercase">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <style>{`
            @keyframes floatUp {
              0% { transform: translateY(0); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 0.6; }
              100% { transform: translateY(-120px); opacity: 0; }
            }
          `}</style>
        </div>
      </section>

      {/* ============ CATEGORY TABS ============ */}
      <section className="px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {FILTER_TABS.map(tab => {
              const meta = activeTab === tab.key ? (tab.key === "all" ? CATEGORY_META.Dungeons : CATEGORY_META[tab.key as string] || CATEGORY_META.Dungeons) : null;
              const Icon = (tab.key === "all" ? Swords : tab.key === "Leveling" ? Gem : tab.key === "Boosts" ? Zap : Flame);
              const color = meta?.color || "#00ffff";
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all duration-300 border
                    ${active
                      ? "bg-black/40 border-cyan-300/40 text-cyan-200 shadow-[0_0_25px_rgba(0,255,255,0.15)]"
                      : "bg-black/20 border-white/10 text-gray-400 hover:text-white hover:border-purple-300/40 hover:bg-black/30"}`}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="tabglow"
                      className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ OFFERS + SIDEBAR ============ */}
      <section id="offers" className="px-4 sm:px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Offers */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-[0.25em] text-cyan-100 flex items-center gap-2">
                <Swords className="w-4 h-4 text-cyan-300" />
                {activeTab === "all" ? "Open Missions" : activeTab}
              </h2>
              <div className="flex items-center gap-2">
                {REGIONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRegion(r)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest border transition-colors ${
                      selectedRegion === r
                        ? "bg-cyan-400/15 border-cyan-300/50 text-cyan-200"
                        : "bg-white/[0.03] border-white/10 text-gray-400"
                    }`}
                  >
                    <MapPin className="w-3 h-3 inline mr-1" />{r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filtered.map(offer => {
                  const svc = AION_SERVICES.find(s => s.id === offer.serviceId);
                  const meta = CATEGORY_META[offer.category] || CATEGORY_META.Dungeons;
                  const Icon = meta.icon;
                  const value = offer.quantity * offer.priceUsd;
                  return (
                    <motion.div
                      key={offer.id}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ y: -4 }}
                      className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/45 backdrop-blur-md transition-all duration-300
                        hover:border-cyan-300/40 hover:shadow-[0_0_40px_rgba(0,255,255,0.12)] hover:bg-black/60"
                    >
                      {/* background art */}
                      <div
                        className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                        style={{ backgroundImage: "url('/AIO2.png')", backgroundSize: "cover", backgroundPosition: "center" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />

                      <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* icon */}
                        <div
                          className="relative w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ borderColor: `${meta.color}55`, background: `${meta.color}14`, boxShadow: `0 0 18px ${meta.glow}22` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: meta.color }} />
                        </div>

                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-black text-white truncate">{offer.name}</h3>
                            <span
                              className="px-2 py-0.5 rounded-md text-[7px] font-black tracking-widest uppercase border"
                              style={{ color: meta.color, borderColor: `${meta.color}44`, background: `${meta.color}10` }}
                            >
                              {offer.category}
                            </span>
                            {offer.speed !== "Standard" && (
                              <span className="px-2 py-0.5 rounded-md text-[7px] font-black tracking-widest uppercase text-[#ff007f] border border-[#ff007f]/40 bg-[#ff007f]/10">
                                <Zap className="w-2.5 h-2.5 inline mr-0.5" />{offer.speed}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-gray-400 font-bold">
                            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> x{offer.quantity}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offer.region}</span>
                            <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> by {offer.owner} · {offer.ownerClass}</span>
                            <span className="text-gray-600 hidden sm:inline">{formatTime(offer.createdAt)}</span>
                          </div>
                        </div>

                        {/* price */}
                        <div className="text-right shrink-0">
                          <div className="text-lg sm:text-xl font-black" style={{ color: offer.paymentMethod === "cash" ? "#ffd700" : "#00ffff" }}>
                            {offer.paymentMethod === "cash" ? formatUsd(value) : `${Math.round(value)}K`}
                          </div>
                          <div className="text-[7px] font-black tracking-widest uppercase text-gray-500">
                            {offer.paymentMethod === "cash" ? "USD" : "Kinah"}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="text-center py-16 bg-black/30 border border-white/10 rounded-2xl">
                  <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-black uppercase tracking-widest">No active missions</p>
                  <p className="text-gray-600 text-[10px] font-bold mt-2">Create your offer to start.</p>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR — ONGOING MISSIONS */}
          <aside className="min-w-0">
            <div className="relative rounded-2xl overflow-hidden border border-purple-300/20 bg-black/40 backdrop-blur-md p-5">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(120%_80%_at_50%_0%,#8b5cf6,transparent)]" />
              <div className="relative">
                {/* Emblem */}
                <div className="mx-auto w-16 h-16 rounded-full border border-purple-300/40 bg-gradient-to-br from-purple-600/20 to-cyan-500/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(139,92,246,0.25)]">
                  <Shield className="w-8 h-8 text-purple-300 drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
                </div>
                <h3 className="text-center text-[11px] font-black tracking-[0.25em] text-purple-100 uppercase mb-1">
                  Ongoing Missions
                </h3>
                <p className="text-center text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-5">Your active operations</p>

                <div className="text-center py-6 border border-white/5 rounded-xl bg-white/[0.02]">
                  <Sparkles className="w-6 h-6 text-purple-400/60 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Active Missions</p>
                  <p className="text-[9px] text-gray-600 font-bold mt-1">Post an offer to begin your journey.</p>
                </div>
              </div>
            </div>

            {/* CLUB mini panel */}
            <div id="support" className="mt-4 relative rounded-2xl overflow-hidden border border-cyan-300/20 bg-black/40 backdrop-blur-md p-5">
              <div className="text-[9px] font-black tracking-[0.25em] text-cyan-200 uppercase flex items-center gap-2 mb-3">
                <Crown className="w-3.5 h-3.5 text-cyan-300" /> The AION 2 Club
              </div>
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                Join the first Egyptian Aion 2 community. Find crews, trade Kinah, post boosts and level together.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center">
        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em]">
          Powered by UPLINK <span className="text-cyan-500/70">•</span> Aion 2 Community Lobby
        </p>
      </footer>

      {/* ============ CREATE OFFER MODAL ============ */}
      <AnimatePresence>
        {showCreate && (
          <CreateOfferPanel
            onClose={() => setShowCreate(false)}
            onPublish={handlePublish}
            region={selectedRegion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateOfferPanel({
  onClose,
  onPublish,
  region,
}: {
  onClose: () => void;
  onPublish: (data: { serviceId: string; quantity: number; priceUsd: number; paymentMethod: "kinah" | "cash"; speed: string }) => void;
  region: string;
}) {
  const [cat, setCat] = useState<string>(AION_CATEGORIES[3] || "Dungeons");
  const [serviceId, setServiceId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [method, setMethod] = useState<"kinah" | "cash">("kinah");
  const [speed, setSpeed] = useState("Standard");

  const services = AION_SERVICES.filter(s => s.category === cat);

  const selectService = (svc: AionService) => {
    setServiceId(svc.id);
    setPrice(svc.basePriceUsd.toFixed(2));
  };

  const total = (parseFloat(price) || 0) * qty;
  const canPublish = serviceId && (parseFloat(price) || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0a0c18]/95 border border-cyan-300/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,255,255,0.15)]"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-300" /> Create Your Offer
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category picker */}
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Category</label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {AION_CATEGORIES.map(c => {
            const meta = CATEGORY_META[c] || CATEGORY_META.Dungeons;
            const active = cat === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => { setCat(c); setServiceId(""); }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest border transition-colors ${
                  active ? "bg-cyan-400/15 border-cyan-300/50 text-cyan-200" : "bg-white/[0.03] border-white/10 text-gray-400"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Service picker */}
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Service</label>
        <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {services.map(svc => {
            const active = svc.id === serviceId;
            const meta = CATEGORY_META[svc.category] || CATEGORY_META.Dungeons;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => selectService(svc)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  active ? "border-cyan-300/50 bg-cyan-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <meta.icon className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                  <span className="text-[11px] font-black text-white truncate">{svc.name}</span>
                </div>
                <span className="text-[9px] font-black text-yellow-500 shrink-0">{formatUsd(svc.basePriceUsd)}</span>
              </button>
            );
          })}
        </div>

        {/* Qty + price */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Quantity</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 font-black text-white hover:border-cyan-300/40">−</button>
              <span className="flex-1 text-center font-black text-lg text-white">{qty}</span>
              <button type="button" onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 font-black text-white hover:border-cyan-300/40">+</button>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Unit Price (USD)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm font-black text-white placeholder:text-gray-600 outline-none focus:border-cyan-300/50"
            />
          </div>
        </div>

        {/* Method + speed */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Payment</label>
            <div className="flex gap-1.5">
              {(["kinah", "cash"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-colors ${
                    method === m ? "bg-cyan-400/15 border-cyan-300/50 text-cyan-200" : "bg-white/[0.03] border-white/10 text-gray-400"
                  }`}
                >
                  {m === "kinah" ? <Coins className="w-3 h-3 inline mr-1" /> : <Gem className="w-3 h-3 inline mr-1" />}{m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Speed</label>
            <select
              value={speed}
              onChange={e => setSpeed(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm font-black text-white outline-none focus:border-cyan-300/50"
            >
              <option>Standard</option>
              <option>Express</option>
              <option>Super Express</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.04] p-3 flex items-center justify-between mb-4">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total · {method === "cash" ? "USD" : "Kinah"} · {region}</span>
          <span className="text-lg font-black text-yellow-400">{method === "cash" ? formatUsd(total) : `${Math.round(total)}K`}</span>
        </div>

        <button
          type="button"
          disabled={!canPublish}
          onClick={() => onPublish({ serviceId, quantity: qty, priceUsd: parseFloat(price), paymentMethod: method, speed })}
          className="w-full py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-white
            bg-gradient-to-r from-cyan-500/25 via-purple-600/25 to-cyan-500/25 border border-cyan-300/40
            hover:border-cyan-300/70 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all
            disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send className="w-3.5 h-3.5" /> Publish Offer
        </button>
      </motion.div>
    </motion.div>
  );
}
