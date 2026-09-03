"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Swords,
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
  Star,
  Gauge,
  MapPin,
  Layers,
  Plus,
  BookOpen,
  Globe,
  ArrowRight,
} from "lucide-react";
import { AION_SERVICES, AION_CATEGORIES, formatUsd, AionService } from "@/lib/aionServices";

// Category metadata
const CATEGORY_META: Record<string, { icon: any; color: string; glow: string }> = {
  Dungeons: { icon: Swords, color: "#00ffff", glow: "rgba(0,255,255,0.4)" },
  Leveling: { icon: Sparkles, color: "#8b5cf6", glow: "rgba(139,92,246,0.4)" },
  Boosts: { icon: Zap, color: "#38bdf8", glow: "rgba(56,189,248,0.4)" },
  PVP: { icon: Flame, color: "#f43f5e", glow: "rgba(244,63,94,0.4)" },
  Raids: { icon: Skull, color: "#a855f7", glow: "rgba(168,85,247,0.4)" },
  Currency: { icon: Coins, color: "#fbbf24", glow: "rgba(251,191,36,0.4)" },
  Collections: { icon: Gem, color: "#22d3ee", glow: "rgba(34,211,238,0.4)" },
  Professions: { icon: Star, color: "#c084fc", glow: "rgba(192,132,252,0.4)" },
};

// Top navigation bar items matching mockup
const NAV_ITEMS = [
  { label: "CLUB", icon: Crown, href: "#club", active: true },
  { label: "MISSIONS", icon: Swords, href: "#offers" },
  { label: "MARKET", icon: Coins, href: "#offers" },
  { label: "SUPPORT", icon: Search, href: "#support" },
];

// Center Filter tabs (capsules) matching mockup
const FILTER_TABS = [
  { label: "DUNGEONS", key: "Dungeons", icon: Swords },
  { label: "LEVELING", key: "Leveling", icon: Sparkles },
  { label: "BOOSTS", key: "Boosts", icon: Zap },
  { label: "PVP", key: "PVP", icon: Flame },
];

// Left vertical crystal dock items matching second image
const SIDEBAR_NAV = [
  { id: "home", label: "HOME", icon: Crown },
  { id: "groups", label: "GROUPS", icon: Users },
  { id: "raids", label: "RAIDS", icon: Skull },
  { id: "pvp", label: "PVP", icon: Swords },
  { id: "market", label: "MARKET", icon: Coins },
  { id: "guides", label: "GUIDES", icon: BookOpen },
  { id: "community", label: "COMMUNITY", icon: Globe },
];

interface OfferCard {
  id: string;
  serviceId: string;
  name: string;
  category: string;
  quantity: number;
  priceUsd: number;
  paymentMethod: "kinah" | "cash";
  speed: string;
  region: "US" | "EU" | "NA";
  owner: string;
  ownerClass: string;
  playersMeta?: string;
  rewardLabel?: string;
  bgCrop?: string;
  createdAt: number;
}

const SEED_OFFERS: OfferCard[] = [
  {
    id: "seed-1",
    serviceId: "dungeon-boost",
    name: "DUNGEON BOOST",
    category: "Dungeons",
    quantity: 4,
    priceUsd: 25,
    paymentMethod: "kinah",
    speed: "Express",
    region: "US",
    owner: "Kael'thas",
    ownerClass: "Gladiator",
    playersMeta: "4 × +10",
    rewardLabel: "25K PER RUN",
    bgCrop: "center 38%",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "seed-2",
    serviceId: "powerleveling",
    name: "LEVELING 1-80",
    category: "Leveling",
    quantity: 4,
    priceUsd: 50,
    paymentMethod: "kinah",
    speed: "Super Express",
    region: "EU",
    owner: "Nerezza",
    ownerClass: "Spiritmaster",
    playersMeta: "4 × +10",
    rewardLabel: "50K PER RUN",
    bgCrop: "52% 58%",
    createdAt: Date.now() - 7200000,
  },
  {
    id: "seed-3",
    serviceId: "ludra",
    name: "ABYSSAL FORGE: LUDRA",
    category: "Dungeons",
    quantity: 2,
    priceUsd: 93,
    paymentMethod: "cash",
    speed: "Express",
    region: "US",
    owner: "Aurelius",
    ownerClass: "Templar",
    playersMeta: "2 × RAID",
    rewardLabel: "$93 / CLEAR",
    bgCrop: "48% 30%",
    createdAt: Date.now() - 10800000,
  },
  {
    id: "seed-4",
    serviceId: "abyss-points",
    name: "ABYSS POINTS ARENA",
    category: "PVP",
    quantity: 10,
    priceUsd: 80,
    paymentMethod: "kinah",
    speed: "Standard",
    region: "EU",
    owner: "Vaeloria",
    ownerClass: "Assassin",
    playersMeta: "3v3 & 5v5",
    rewardLabel: "80K PER RUN",
    bgCrop: "35% 25%",
    createdAt: Date.now() - 14400000,
  },
];

export default function Aion2ClubPage() {
  const [activeTab, setActiveTab] = useState<string>("Dungeons");
  const [activeSidebar, setActiveSidebar] = useState<string>("home");
  const [offers, setOffers] = useState<OfferCard[]>(SEED_OFFERS);
  const [showCreate, setShowCreate] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; size: number; delay: number; dur: number }[]>([]);

  // Subtle ethereal ambient floating particles
  useEffect(() => {
    const p = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 8,
      dur: 8 + Math.random() * 10,
    }));
    setParticles(p);
  }, []);

  const filteredOffers = useMemo(() => {
    if (activeTab === "all") return offers;
    return offers.filter(o => o.category.toLowerCase() === activeTab.toLowerCase());
  }, [activeTab, offers]);

  const handlePublish = useCallback((data: { serviceId: string; quantity: number; priceUsd: number; paymentMethod: "kinah" | "cash"; speed: string }) => {
    const svc = AION_SERVICES.find(s => s.id === data.serviceId);
    const cat = svc?.category || "Dungeons";
    const newOffer: OfferCard = {
      id: Date.now().toString(),
      serviceId: data.serviceId,
      name: svc?.name?.toUpperCase() || "CUSTOM MISSION",
      category: cat,
      quantity: data.quantity,
      priceUsd: data.priceUsd,
      paymentMethod: data.paymentMethod,
      speed: data.speed,
      region: "US",
      owner: "Omar Saleh",
      ownerClass: "Daeva",
      playersMeta: `${data.quantity} × PARTY`,
      rewardLabel: data.paymentMethod === "cash" ? formatUsd(data.priceUsd * data.quantity) : `${Math.round(data.priceUsd * data.quantity)}K PER RUN`,
      bgCrop: "center 35%",
      createdAt: Date.now(),
    };
    setOffers(prev => [newOffer, ...prev]);
    setShowCreate(false);
    setActiveTab(cat);
  }, []);

  return (
    <div className="min-h-screen bg-[#04050d] text-white relative selection:bg-cyan-500 selection:text-black font-sans overflow-x-hidden">
      {/* ================= GLOBAL AMBIENT BACKGROUND ================= */}
      <div
        className="fixed inset-0 -z-30 bg-cover bg-center pointer-events-none opacity-40 mix-blend-screen scale-105"
        style={{ backgroundImage: "url('/AIO2.png')", filter: "blur(20px)" }}
      />
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#04050d]/80 via-[#070919]/90 to-[#04050d] pointer-events-none" />

      {/* Floating particles */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute rounded-full pointer-events-none opacity-60"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: "radial-gradient(circle, rgba(96, 235, 255, 0.8), rgba(168, 85, 247, 0.2))",
              boxShadow: "0 0 10px rgba(0, 240, 255, 0.7)",
              animation: `aionFloat ${p.dur}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ================= TOP NAVIGATION HEADER ================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050612]/85 border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
          
          {/* Logo with Crystalline Wings */}
          <a href="#club" className="flex items-center gap-3 group relative cursor-pointer select-none">
            {/* Left wing ornament */}
            <div className="hidden sm:block text-cyan-400/80 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" className="transform -scale-x-100">
                <path d="M5 20C15 17 25 10 35 2C31 12 25 22 17 28C24 25 32 20 37 14C32 24 24 32 12 36C20 32 26 28 29 23C23 29 14 34 5 36C8 30 10 24 5 20Z" fill="url(#wingGrad)" />
                <defs>
                  <linearGradient id="wingGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="0.7" stopColor="#818cf8" />
                    <stop offset="1" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* AION 2 Core Logo */}
            <div className="flex items-center">
              <span className="text-2xl sm:text-3xl font-black tracking-[0.25em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(56,189,248,0.7)] font-serif">
                AION
              </span>
              <span className="ml-1.5 text-2xl sm:text-3xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] font-serif">
                2
              </span>
            </div>

            {/* Right wing ornament */}
            <div className="hidden sm:block text-cyan-400/80 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M5 20C15 17 25 10 35 2C31 12 25 22 17 28C24 25 32 20 37 14C32 24 24 32 12 36C20 32 26 28 29 23C23 29 14 34 5 36C8 30 10 24 5 20Z" fill="url(#wingGradRight)" />
                <defs>
                  <linearGradient id="wingGradRight" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="0.7" stopColor="#818cf8" />
                    <stop offset="1" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </a>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3 bg-black/40 border border-white/[0.08] px-3 py-1.5 rounded-full backdrop-blur-md">
            {NAV_ITEMS.map(item => {
              const isActive = item.label === "CLUB";
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-[11px] font-black tracking-[0.2em] transition-all duration-300 ${
                    isActive
                      ? "text-cyan-200 bg-gradient-to-r from-cyan-500/20 via-sky-500/30 to-blue-600/20 border border-cyan-400/60 shadow-[0_0_20px_rgba(0,255,255,0.35)]"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-300 drop-shadow-[0_0_6px_rgba(0,255,255,0.8)]" : "text-gray-500"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,255,255,1)]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right User Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative w-10 h-10 rounded-full bg-[#0a0d20] border border-cyan-500/20 flex items-center justify-center text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,1)]" />
            </button>

            {/* User Profile Capsule */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(prev => !prev)}
                className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-[#0b0e22]/90 border border-purple-400/30 hover:border-cyan-400/60 transition-all shadow-[0_0_15px_rgba(139,92,246,0.15)] group cursor-pointer"
              >
                {/* Character Avatar */}
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-cyan-300/60 shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: "url('/AIO2.png')", backgroundPosition: "78% 25%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Name and Pill Badge */}
                <div className="text-left flex items-center gap-2">
                  <span className="text-[11px] font-black tracking-wider text-white group-hover:text-cyan-200 transition-colors uppercase">
                    OMAR SALEH
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
                    CLUB
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#090c1e]/98 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-1.5"
                  >
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</div>
                      <div className="text-xs font-black text-cyan-300 truncate">Omar Saleh · Daeva</div>
                    </div>
                    {["Profile", "My Missions", "Kinah Wallet", "Guild Lobby", "Settings"].map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-gray-300 hover:text-cyan-200 hover:bg-cyan-500/10 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>{item}</span>
                        <ArrowRight className="w-3 h-3 opacity-40" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION (`#club`) ================= */}
      <section id="club" className="relative min-h-[560px] lg:min-h-[640px] flex items-center justify-center overflow-hidden pt-6 pb-12 px-4 sm:px-6">
        {/* Background Artwork - AIO2.png Clean high-res with atmospheric layers */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/AIO2.png')",
            backgroundPosition: "center 32%",
          }}
        />

        {/* Ambient Dark Gradient Vignettes for dramatic focus on the characters & citadel */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04050d] via-[#04050d]/20 to-[#04050d]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(4,5,13,0.15)_0%,rgba(4,5,13,0.85)_80%)] pointer-events-none" />

        {/* Center Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center pt-8">
          
          {/* AION 2 Massive Emblem */}
          <div className="relative select-none">
            {/* Portal ring aura behind logo */}
            <div className="absolute -inset-10 bg-[radial-gradient(circle,rgba(56,189,248,0.25)_0%,rgba(168,85,247,0.15)_50%,transparent_70%)] blur-2xl pointer-events-none" />
            
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-[0.14em] font-serif leading-none">
              <span className="bg-gradient-to-b from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(56,189,248,0.8)]">
                AION
              </span>
              <span className="ml-2 bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(168,85,247,0.9)] italic">
                2
              </span>
            </h1>
          </div>

          {/* Subtitle: FIND YOUR CREW */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-cyan-400 text-sm">✦</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.3em] uppercase bg-gradient-to-r from-cyan-200 via-white to-purple-300 bg-clip-text text-transparent font-serif">
              FIND YOUR CREW
            </h2>
            <span className="text-cyan-400 text-sm">✦</span>
          </div>

          {/* Keywords */}
          <p className="mt-3 text-[10px] sm:text-xs font-black tracking-[0.35em] text-gray-300 uppercase">
            KEYS <span className="text-cyan-400 mx-2">•</span> BOOSTS <span className="text-purple-400 mx-2">•</span> LEVELING
          </p>

          <p className="mt-2 text-xs sm:text-sm font-medium text-gray-300/80 max-w-lg tracking-wide">
            Find trusted players for your next adventure.
          </p>

          {/* ================= FANTASY CRYSTAL CTA BUTTON ================= */}
          <div className="mt-8 relative group">
            {/* Outer Wing Filigree Ornaments Left & Right */}
            <div className="absolute -left-7 sm:-left-9 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-200/90 group-hover:text-cyan-100 transition-all group-hover:-translate-x-1 duration-300 drop-shadow-[0_0_12px_rgba(0,255,255,0.8)]">
              <svg width="42" height="42" viewBox="0 0 50 50" fill="none">
                <path d="M48 25C30 25 20 18 10 5C14 16 22 23 32 25C20 27 12 34 8 45C20 32 30 25 48 25Z" fill="url(#leftBracket)" />
                <circle cx="8" cy="25" r="2.5" fill="#a5f3fc" />
                <defs>
                  <linearGradient id="leftBracket" x1="50" y1="25" x2="5" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e0f2fe" />
                    <stop offset="0.5" stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="absolute -right-7 sm:-right-9 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-200/90 group-hover:text-cyan-100 transition-all group-hover:translate-x-1 duration-300 drop-shadow-[0_0_12px_rgba(0,255,255,0.8)]">
              <svg width="42" height="42" viewBox="0 0 50 50" fill="none" className="transform -scale-x-100">
                <path d="M48 25C30 25 20 18 10 5C14 16 22 23 32 25C20 27 12 34 8 45C20 32 30 25 48 25Z" fill="url(#rightBracket)" />
                <circle cx="8" cy="25" r="2.5" fill="#a5f3fc" />
                <defs>
                  <linearGradient id="rightBracket" x1="50" y1="25" x2="5" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e0f2fe" />
                    <stop offset="0.5" stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* The Main Crystal Button Body */}
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="relative px-10 sm:px-16 py-4 rounded-full font-black uppercase tracking-[0.25em] text-xs sm:text-sm text-white
                bg-gradient-to-r from-[#142358] via-[#21388b] to-[#401f78]
                border-2 border-cyan-300/80
                shadow-[0_0_30px_rgba(0,229,255,0.6),0_0_70px_rgba(139,92,246,0.4),inset_0_1px_3px_rgba(255,255,255,0.8)]
                hover:shadow-[0_0_45px_rgba(0,229,255,0.9),0_0_90px_rgba(139,92,246,0.6),inset_0_1px_4px_rgba(255,255,255,1)]
                hover:border-white hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Top diamond jewel */}
              <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-cyan-200 shadow-[0_0_8px_rgba(0,255,255,1)]" />

              {/* Shimmer light sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-in-out" />

              {/* Button text */}
              <span className="relative flex items-center justify-center gap-3 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] text-cyan-50">
                <span>CREATE YOUR OFFER</span>
                <span className="text-cyan-300 group-hover:translate-x-1 transition-transform">›</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= FILTER TABS BAR (CENTERED CAPSULES) ================= */}
      <section className="px-4 sm:px-6 relative z-20 -mt-2 mb-8">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {FILTER_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-full text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/25 via-blue-600/35 to-purple-600/25 border-2 border-cyan-300/80 text-white shadow-[0_0_25px_rgba(0,255,255,0.45)] scale-105"
                    : "bg-[#070b1e]/80 border border-white/[0.08] text-gray-400 hover:text-white hover:border-cyan-400/40 hover:bg-[#0a0f2c]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" : "text-gray-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= MAIN CONTAINER WITH LEFT CRYSTAL DOCK & OFFERS ================= */}
      <main className="max-w-[1700px] mx-auto px-4 sm:px-8 pb-20 relative z-20">
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          
          {/* ================= LEFT VERTICAL CRYSTAL DOCK (SIDEBAR) ================= */}
          {/* Styled exactly like the second image that the user loved */}
          <aside className="w-full xl:w-28 shrink-0 flex xl:flex-col items-center justify-center">
            <div className="w-full max-w-sm xl:max-w-none relative rounded-3xl bg-[#060817]/85 backdrop-blur-2xl border border-cyan-500/25 p-3 sm:p-4 flex xl:flex-col items-center justify-around xl:justify-start gap-3 sm:gap-4 shadow-[0_0_35px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,255,255,0.03)]">
              
              {/* Top Crystalline Spire Ornament */}
              <div className="hidden xl:flex justify-center -mt-7 mb-1 text-cyan-300/80 drop-shadow-[0_0_12px_rgba(0,255,255,0.7)]">
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M16 0L24 14L16 22L8 14L16 0Z" fill="url(#spireGradTop)" />
                  <circle cx="16" cy="14" r="1.5" fill="#ffffff" />
                  <defs>
                    <linearGradient id="spireGradTop" x1="16" y1="0" x2="16" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#a5f3fc" />
                      <stop offset="0.6" stopColor="#38bdf8" />
                      <stop offset="1" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Vertical Sidebar Buttons */}
              {SIDEBAR_NAV.map(item => {
                const isActive = activeSidebar === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSidebar(item.id);
                      if (item.id === "home") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else if (item.id === "groups") {
                        document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" });
                      } else if (item.id === "raids") {
                        setActiveTab("Dungeons");
                        document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" });
                      } else if (item.id === "pvp") {
                        setActiveTab("PVP");
                        document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className={`group relative flex flex-col items-center justify-center w-14 xl:w-20 py-2.5 xl:py-3.5 rounded-2xl transition-all duration-300 cursor-pointer select-none ${
                      isActive
                        ? "bg-gradient-to-b from-cyan-500/25 via-blue-600/30 to-purple-600/20 border border-cyan-400/80 shadow-[0_0_22px_rgba(0,255,255,0.45)] text-cyan-100"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-cyan-500/20"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-1.5 transition-transform group-hover:scale-110 ${
                        isActive ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" : "text-gray-400 group-hover:text-cyan-200"
                      }`}
                    />
                    <span className="text-[8px] xl:text-[9px] font-black tracking-widest uppercase">
                      {item.label}
                    </span>
                  </button>
                );
              })}

              {/* Bottom Crystalline Spire Ornament */}
              <div className="hidden xl:flex justify-center -mb-7 mt-1 text-cyan-300/80 drop-shadow-[0_0_12px_rgba(0,255,255,0.7)]">
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="transform rotate-180">
                  <path d="M16 0L24 14L16 22L8 14L16 0Z" fill="url(#spireGradBot)" />
                  <circle cx="16" cy="14" r="1.5" fill="#ffffff" />
                  <defs>
                    <linearGradient id="spireGradBot" x1="16" y1="0" x2="16" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#a5f3fc" />
                      <stop offset="0.6" stopColor="#38bdf8" />
                      <stop offset="1" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

            </div>
          </aside>

          {/* ================= MAIN CONTENT: OFFERS (LEFT) & ONGOING MISSIONS (RIGHT) ================= */}
          <div id="offers" className="flex-1 w-full grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            
            {/* Left Column: AVAILABLE OFFERS */}
            <div>
              {/* Header Bar */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <span className="text-cyan-400 text-base">✦</span>
                  <h3 className="text-base sm:text-lg font-black tracking-[0.25em] uppercase text-white font-serif">
                    AVAILABLE OFFERS
                  </h3>
                  <span className="text-cyan-400 text-base">✦</span>
                </div>

                {/* Status indicator badge matching mockup */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                  <span className="text-[9px] font-black tracking-widest text-cyan-200 uppercase">
                    NEW OFFERS ONLINE
                  </span>
                </div>
              </div>

              {/* Offer Cards List */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredOffers.map((offer) => {
                    const isEU = offer.region === "EU";

                    return (
                      <motion.div
                        key={offer.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ y: -3, scale: 1.01 }}
                        className="group relative rounded-2xl overflow-hidden border border-white/[0.12] hover:border-cyan-400/60 bg-[#070919]/90 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_0_35px_rgba(0,255,255,0.25)] transition-all duration-300"
                      >
                        {/* Right side scenic landscape crop from AIO2.png with smooth gradient fade into card */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-[55%] sm:w-[50%] bg-cover bg-no-repeat pointer-events-none opacity-45 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
                          style={{
                            backgroundImage: "url('/AIO2.png')",
                            backgroundPosition: offer.bgCrop || "center",
                            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 30%, black 100%)",
                            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 30%, black 100%)",
                          }}
                        />

                        {/* Subtle inner dark vignette */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#070919] via-[#070919]/75 to-transparent pointer-events-none" />

                        {/* Card Content Row */}
                        <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          
                          {/* Left: Rank Insignia & Title */}
                          <div className="flex items-center gap-4 min-w-0">
                            
                            {/* Celestial Diamond Rank Crest */}
                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-gradient-to-b from-[#141b3f] to-[#0c1027] border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.25)] group-hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all">
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
                                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="url(#rankGrad)" />
                                <circle cx="12" cy="12" r="2" fill="#ffffff" />
                                <defs>
                                  <linearGradient id="rankGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#67e8f9" />
                                    <stop offset="1" stopColor="#a855f7" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                              <h4 className="text-sm sm:text-base font-black tracking-wider text-white uppercase group-hover:text-cyan-200 transition-colors">
                                {offer.name}
                              </h4>
                              
                              {/* Metadata chips */}
                              <div className="flex items-center gap-3 sm:gap-4 mt-2 flex-wrap">
                                {/* Party Size */}
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-300">
                                  <span>{offer.playersMeta || "4 × +10"}</span>
                                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                                </div>

                                {/* Region Flag */}
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-black text-gray-200">
                                  <Image
                                    src={isEU ? "/flags/eu.svg" : "/flags/us.svg"}
                                    alt={offer.region}
                                    width={14}
                                    height={10}
                                    className="rounded-xs"
                                  />
                                  <span>{offer.region}</span>
                                </div>

                                {/* Coin Price / Reward */}
                                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                                  <Coins className="w-3 h-3 text-amber-400" />
                                  <span>{offer.rewardLabel || `${offer.priceUsd}K PER RUN`}</span>
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* Right Action: Quick Request Button */}
                          <div className="shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setShowCreate(true)}
                              className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-200 bg-cyan-500/15 border border-cyan-400/40 hover:bg-cyan-500/30 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all cursor-pointer"
                            >
                              JOIN GROUP
                            </button>
                          </div>

                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredOffers.length === 0 && (
                  <div className="text-center py-16 bg-[#070919]/60 border border-white/[0.08] rounded-2xl">
                    <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">No active offers in this category</p>
                    <p className="text-gray-600 text-[11px] font-bold mt-1">Be the first to create an offer!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: ONGOING MISSIONS WIDGET */}
            <aside className="w-full">
              <div className="relative rounded-3xl overflow-hidden border border-cyan-500/25 bg-[#060818]/90 backdrop-blur-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                
                {/* Header with Fantasy Crest Icon */}
                <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-white/[0.08]">
                  <Shield className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.7)]" />
                  <h3 className="text-xs font-black tracking-[0.25em] uppercase text-cyan-100 font-serif">
                    ONGOING MISSIONS
                  </h3>
                </div>

                {/* Center Sacred Aion Glyph matching mockup */}
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  
                  {/* Glowing sacred triangle glyph */}
                  <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-cyan-500/15 rounded-full blur-xl pointer-events-none" />
                    <svg width="84" height="84" viewBox="0 0 100 100" fill="none" className="text-cyan-300 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">
                      {/* Outer Sacred Triangle */}
                      <path d="M50 8L92 82H8L50 8Z" stroke="url(#glyphGrad)" strokeWidth="3" fill="rgba(6, 182, 212, 0.05)" />
                      {/* Inner Concentric Circle */}
                      <circle cx="50" cy="54" r="22" stroke="url(#glyphGrad)" strokeWidth="2" strokeDasharray="4 3" />
                      {/* Center Rune Point */}
                      <circle cx="50" cy="54" r="5" fill="#38bdf8" />
                      <circle cx="50" cy="54" r="10" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                      {/* Radial Rays */}
                      <line x1="50" y1="32" x2="50" y2="20" stroke="#a5f3fc" strokeWidth="2" />
                      <line x1="31" y1="65" x2="20" y2="71" stroke="#a5f3fc" strokeWidth="2" />
                      <line x1="69" y1="65" x2="80" y2="71" stroke="#a5f3fc" strokeWidth="2" />
                      <defs>
                        <linearGradient id="glyphGrad" x1="50" y1="8" x2="50" y2="82" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#a5f3fc" />
                          <stop offset="0.5" stopColor="#38bdf8" />
                          <stop offset="1" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-200">
                    NO ACTIVE MISSIONS
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold mt-1.5 max-w-[200px] leading-relaxed">
                    Create or accept an offer to embark on your Daeva journey.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="mt-6 px-6 py-2.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase text-cyan-300 bg-cyan-500/10 border border-cyan-400/40 hover:bg-cyan-500/25 hover:border-cyan-300 transition-all cursor-pointer"
                  >
                    START AN OPERATION
                  </button>
                </div>

              </div>

              {/* Extra Community Quick Banner */}
              <div id="support" className="mt-5 rounded-2xl border border-white/[0.08] bg-[#060818]/60 p-4 text-center">
                <div className="text-[9px] font-black text-cyan-300 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> AION 2 EGYPTIAN COMMUNITY
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Join hundreds of Egyptian Daevas on Discord for daily Abyss runs, trading & voice rooms.
                </p>
              </div>
            </aside>

          </div>

        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="px-6 py-8 text-center border-t border-white/[0.06] relative z-20">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">
          POWERED BY UPLINK <span className="text-cyan-400 mx-2">•</span> AION 2 COMMUNITY LOBBY
        </p>
      </footer>

      {/* ================= CREATE OFFER MODAL ================= */}
      <AnimatePresence>
        {showCreate && (
          <CreateOfferModal
            onClose={() => setShowCreate(false)}
            onPublish={handlePublish}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes aionFloat {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-140px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Modal Component for creating offers
function CreateOfferModal({
  onClose,
  onPublish,
}: {
  onClose: () => void;
  onPublish: (data: { serviceId: string; quantity: number; priceUsd: number; paymentMethod: "kinah" | "cash"; speed: string }) => void;
}) {
  const [cat, setCat] = useState<string>("Dungeons");
  const [serviceId, setServiceId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("25");
  const [method, setMethod] = useState<"kinah" | "cash">("kinah");
  const [speed, setSpeed] = useState("Standard");

  const services = AION_SERVICES.filter(s => s.category === cat);

  const selectService = (svc: AionService) => {
    setServiceId(svc.id);
    setPrice(svc.basePriceUsd.toFixed(0));
  };

  const total = (parseFloat(price) || 0) * qty;
  const canPublish = (parseFloat(price) || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#070a1e]/95 border-2 border-cyan-400/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,255,255,0.2)]"
      >
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white font-serif">
              CREATE YOUR OFFER
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-400/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category picker */}
        <label className="text-[10px] font-black text-cyan-200 uppercase tracking-widest block mb-2">Category</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {AION_CATEGORIES.map(c => {
            const active = cat === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => { setCat(c); setServiceId(""); }}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all cursor-pointer ${
                  active
                    ? "bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                    : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Service picker */}
        <label className="text-[10px] font-black text-cyan-200 uppercase tracking-widest block mb-2">Service Type</label>
        <div className="space-y-2 mb-5 max-h-44 overflow-y-auto pr-1">
          {services.map(svc => {
            const active = svc.id === serviceId;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => selectService(svc)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? "border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(0,255,255,0.25)]"
                    : "border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/30"
                }`}
              >
                <span className="text-xs font-black truncate">{svc.name}</span>
                <span className="text-[10px] font-black text-amber-400">{formatUsd(svc.basePriceUsd)}</span>
              </button>
            );
          })}
        </div>

        {/* Quantity & Unit Price */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Party / Slots</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-black text-white hover:border-cyan-400/50 cursor-pointer"
              >−</button>
              <span className="flex-1 text-center font-black text-base text-white">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-black text-white hover:border-cyan-400/50 cursor-pointer"
              >+</button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Price Per Run ({method === "kinah" ? "K" : "$"})</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="25"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-white outline-none focus:border-cyan-400/70"
            />
          </div>
        </div>

        {/* Payment method */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Payment</label>
            <div className="flex gap-2">
              {(["kinah", "cash"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    method === m
                      ? "bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,255,255,0.3)]"
                      : "bg-white/[0.03] border-white/10 text-gray-400"
                  }`}
                >
                  {m === "kinah" ? "Kinah" : "USD"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Speed</label>
            <select
              value={speed}
              onChange={e => setSpeed(e.target.value)}
              className="w-full bg-[#090d24] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-black text-white outline-none focus:border-cyan-400/70"
            >
              <option>Standard</option>
              <option>Express</option>
              <option>Super Express</option>
            </select>
          </div>
        </div>

        {/* Total Price Banner */}
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4 flex items-center justify-between mb-6">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total Reward</span>
          <span className="text-xl font-black text-amber-300">
            {method === "cash" ? formatUsd(total) : `${Math.round(total)}K Kinah`}
          </span>
        </div>

        {/* Publish Button */}
        <button
          type="button"
          disabled={!canPublish}
          onClick={() => onPublish({ serviceId: serviceId || "custom", quantity: qty, priceUsd: parseFloat(price) || 25, paymentMethod: method, speed })}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-white
            bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600
            border-2 border-cyan-300/80 shadow-[0_0_30px_rgba(0,255,255,0.4)]
            hover:shadow-[0_0_45px_rgba(0,255,255,0.7)] hover:border-white transition-all
            disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" /> PUBLISH OFFER
        </button>
      </motion.div>
    </motion.div>
  );
}
