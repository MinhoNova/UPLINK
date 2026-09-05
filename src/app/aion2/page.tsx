"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Swords, Shield, Coins, Bell, ChevronDown, Zap, Users, Search,
  Crown, Sparkles, Flame, Star, BookOpen, MessageSquare, ClipboardList
} from "lucide-react";

/* ── NAV ── */
const NAV_ITEMS = [
  { label: "CLUB", icon: Crown, href: "#club", active: true },
  { label: "MISSIONS", icon: Swords, href: "#offers" },
  { label: "MARKET", icon: Coins, href: "#offers" },
  { label: "SUPPORT", icon: Search, href: "#support" },
];

/* ── FILTER TABS ── */
const FILTER_TABS = [
  { label: "DUNGEONS", key: "Dungeons", icon: Shield },
  { label: "LEVELING", key: "Leveling", icon: Sparkles },
  { label: "BOOSTS", key: "Boosts", icon: Zap },
  { label: "PVP", key: "PVP", icon: Swords },
];

/* ── MINI SIDEBAR ICONS ── */
const MINI_DOCK = [
  { id: "chat", icon: MessageSquare, label: "CHAT" },
  { id: "quests", icon: ClipboardList, label: "QUESTS" },
  { id: "star", icon: Star, label: "FAVORITES" },
];

/* ── SEED OFFERS ── */
interface OfferCard {
  id: string;
  name: string;
  category: string;
  region: "US" | "EU";
  playersMeta: string;
  rewardLabel: string;
  // Fallback gradient/image path for the card background
  bgTheme: string; 
}

const SEED_OFFERS: OfferCard[] = [
  {
    id: "seed-1",
    name: "DUNGEON BOOST",
    category: "Dungeons",
    region: "US",
    playersMeta: "4 × +10",
    rewardLabel: "25K PER RUN",
    bgTheme: "from-[#1a1f3c]/90 via-[#1a1f3c]/60 to-[#2c3b6b]/40",
  },
  {
    id: "seed-2",
    name: "LEVELING 1-80",
    category: "Leveling",
    region: "EU",
    playersMeta: "4 × +10",
    rewardLabel: "50K PER RUN",
    bgTheme: "from-[#1a1f3c]/90 via-[#1a1f3c]/60 to-[#3b2c6b]/40",
  },
];


export default function Aion2ClubPage() {
  const [activeTab, setActiveTab] = useState("Dungeons");
  const [activeDock, setActiveDock] = useState("chat");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* Hide the global UPLINK navbar so only our custom header shows */
  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  const displayOffers = useMemo(() => {
    return SEED_OFFERS.filter((o) => o.category.toLowerCase() === activeTab.toLowerCase());
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 w-full z-50 bg-[#050814]/80 backdrop-blur-xl border-b border-blue-900/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#club" className="flex items-center gap-3 cursor-pointer group">
            {/* Minimal wing ornament */}
            <div className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
               <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-blue-400" stroke="currentColor" strokeWidth="1.5">
                 <path d="M12 22s-8-4.5-8-11.8A6 6 0 0 1 12 2a6 6 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
               </svg>
            </div>
            <div className="flex items-baseline tracking-widest font-serif">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">AION</span>
              <span className="text-4xl font-black italic ml-1 text-transparent bg-clip-text bg-gradient-to-b from-blue-300 to-purple-400 drop-shadow-[0_0_15px_rgba(120,160,255,0.5)]">2</span>
            </div>
          </a>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = !!item.active;
              return (
                <a key={item.label} href={item.href} className="flex items-center gap-2 group cursor-pointer">
                  <Icon className={`w-4 h-4 transition-colors ${active ? "text-blue-400" : "text-slate-500 group-hover:text-blue-300"}`} />
                  <span className={`text-xs font-bold tracking-[0.2em] transition-colors ${active ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-5">
            <button className="relative text-slate-400 hover:text-blue-300 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            </button>

            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-[#0a0f26]/80 border border-blue-900/50 hover:border-blue-500/50 transition-all shadow-inner group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-800 p-0.5 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  <div className="w-full h-full rounded-full bg-[#050814] flex items-center justify-center overflow-hidden">
                    {/* Placeholder for portrait */}
                    <span className="text-[10px] font-bold text-blue-200">OS</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold tracking-widest text-white uppercase group-hover:text-blue-100">OMAR SALEH</span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest border border-purple-500/30 bg-purple-500/10 text-purple-300">CLUB</span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-56 bg-[#0a0f26]/95 backdrop-blur-xl border border-blue-900/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2 z-50">
                    {["Profile", "My Characters", "Wallet", "Settings"].map((item) => (
                      <button key={item} className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-600/20 transition-all flex justify-between items-center">
                        {item}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden pt-20">
        
        {/* Background Video (with dark blue overlay) */}
        <div className="absolute inset-0 z-0">
          <video className="w-full h-full object-cover" autoPlay muted loop playsInline>
            <source src="/aion%202%20bg%20small.mp4" type="video/mp4" />
          </video>
          {/* Mockup matching overlay: deep navy/purple vignette */}
          <div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050814] via-[#050814]/60 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,20,0.8)_100%)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center mt-12">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            {/* Massive Title mimicking mockup */}
            <h1 className="text-7xl sm:text-9xl font-black font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-500 drop-shadow-[0_0_40px_rgba(59,130,246,0.6)] mb-2">
              AION <span className="italic text-purple-400">2</span>
            </h1>
            
            <div className="flex items-center gap-6 mt-4">
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/50" />
              <h2 className="text-sm sm:text-base font-bold tracking-[0.4em] text-blue-100 uppercase">Find Your Crew</h2>
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/50" />
            </div>

            <p className="mt-4 text-[11px] font-bold tracking-[0.3em] text-slate-400 uppercase">
              Keys <span className="mx-2 text-purple-500/50">✦</span> 
              Boosts <span className="mx-2 text-purple-500/50">✦</span> 
              Leveling
            </p>
            <p className="mt-2 text-xs text-slate-500 font-medium">Find trusted players for your next adventure.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="mt-12">
            <button className="relative group overflow-hidden rounded-full p-[1px] shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] transition-all duration-500">
              {/* Animated border gradient */}
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />
              
              {/* Button inner */}
              <div className="relative bg-[#0a0f26]/90 backdrop-blur-xl px-16 py-4 rounded-full flex items-center justify-center gap-4">
                 <span className="text-xs font-black tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                   Create Your Offer
                 </span>
                 <span className="text-blue-300 group-hover:translate-x-1 transition-transform">›</span>
              </div>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══ FILTER TABS ═══ */}
      <section className="relative z-20 w-full flex justify-center -mt-8 mb-12">
        <div className="flex items-center gap-2 sm:gap-4 p-2 bg-[#050814]/60 backdrop-blur-md rounded-full border border-blue-900/30">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative flex items-center gap-3 px-8 py-3 rounded-full text-[11px] font-bold tracking-[0.2em] transition-all duration-300 ${isActive ? 'bg-[#151c3d] text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/40' : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-[2px] bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ MAIN CONTENT GRID ═══ */}
      <main className="max-w-[1600px] mx-auto px-6 pb-24 relative z-20">
        <div className="grid grid-cols-[auto_1fr_340px] gap-8">
          
          {/* 1. Left Mini Sidebar (Floating Tools) */}
          <aside className="hidden lg:flex flex-col gap-4 mt-12">
            {MINI_DOCK.map((item) => {
              const active = activeDock === item.id;
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActiveDock(item.id)} className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${active ? 'bg-[#151c3d] text-blue-300 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-[#0a0f26]/80 text-slate-500 border border-blue-900/40 hover:text-blue-300 hover:border-blue-500/30'}`}>
                   <Icon className="w-5 h-5" />
                   {active && <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                </button>
              )
            })}
          </aside>

          {/* 2. Center Column: Offers */}
          <section className="min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-blue-900/30">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black tracking-[0.25em] text-blue-100 uppercase font-serif">Available Offers</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold tracking-widest text-emerald-300 uppercase">New Offers Online</span>
              </div>
            </div>

            {/* Offer List */}
            <div className="space-y-4">
              {displayOffers.map((offer) => (
                <motion.div key={offer.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.01 }} className="relative w-full h-24 rounded-full bg-[#0a0f26] border border-blue-900/40 overflow-hidden flex items-center pr-2 pl-4 cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all">
                  
                  {/* Mockup placeholder background (Right side gradient/image) */}
                  <div className={`absolute right-0 top-0 bottom-0 w-2/3 bg-gradient-to-l ${offer.bgTheme} pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity`} />
                  
                  <div className="relative z-10 flex items-center w-full gap-6">
                    {/* Rank/Class Icon */}
                    <div className="w-16 h-16 rounded-full bg-[#050814]/80 border border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:border-blue-400/60 transition-colors">
                      <Star className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    </div>

                    {/* Offer Details */}
                    <div className="flex-1">
                      <h4 className="text-sm font-black tracking-widest text-white uppercase group-hover:text-blue-200 transition-colors">{offer.name}</h4>
                      <div className="flex items-center gap-5 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200/80">
                          <span>{offer.playersMeta}</span>
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-black text-gray-300">
                          <Image src={offer.region === "EU" ? "/flags/eu.svg" : "/flags/us.svg"} alt={offer.region} width={14} height={10} className="rounded-sm" />
                          <span>{offer.region}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400">
                          <Coins className="w-3 h-3" />
                          <span>{offer.rewardLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {displayOffers.length === 0 && (
                <div className="text-center py-16 bg-[#0a0f26]/40 border border-blue-900/30 rounded-[2rem]">
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No matching offers found</p>
                </div>
              )}
            </div>
          </section>

          {/* 3. Right Sidebar: Ongoing Missions */}
          <aside className="w-full">
             <div className="relative w-full rounded-3xl bg-[#0a0f26]/80 backdrop-blur-xl border border-blue-900/40 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
               
               {/* Widget Header */}
               <div className="flex items-center gap-3 pb-4 mb-6 border-b border-blue-900/30">
                 <Shield className="w-4 h-4 text-blue-400" />
                 <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100 font-serif">Ongoing Missions</h3>
               </div>

               {/* Empty State */}
               <div className="flex flex-col items-center text-center py-10">
                 <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                   <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                   {/* Simplified geometric icon mimicking the mockup's center crystal */}
                   <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                     <path d="M50 10 L85 80 H15 Z" stroke="#60a5fa" strokeWidth="3" fill="rgba(96, 165, 250, 0.1)" />
                     <circle cx="50" cy="55" r="15" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
                     <circle cx="50" cy="55" r="4" fill="#93c5fd" />
                   </svg>
                 </div>
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">No Active Missions</p>
               </div>
             </div>
          </aside>
        </div>
      </main>
    </div>
  );
}