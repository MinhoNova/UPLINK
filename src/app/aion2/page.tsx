"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Swords, Shield, Coins, Bell, ChevronDown, Zap, Users, Search,
  Crown, Sparkles, X, Send, Flame, Gem, Skull, Star, BookOpen,
  Globe, ArrowRight, Clipboard, Settings,
} from "lucide-react";
import { AION_SERVICES, AION_CATEGORIES, formatUsd, AionService } from "@/lib/aionServices";

/* ── NAV ── */
const NAV_ITEMS = [
  { label: "CLUB", icon: Crown, href: "#club", active: true },
  { label: "MISSIONS", icon: Swords, href: "#offers" },
  { label: "MARKET", icon: Coins, href: "#offers" },
  { label: "SUPPORT", icon: Search, href: "#support" },
];

/* ── FILTER TABS ── */
const FILTER_TABS = [
  { label: "DUNGEONS", key: "Dungeons", icon: Swords },
  { label: "LEVELING", key: "Leveling", icon: Sparkles },
  { label: "BOOSTS", key: "Boosts", icon: Zap },
  { label: "PVP", key: "PVP", icon: Flame },
];

/* ── MINI SIDEBAR ICONS (matching mockup – only 4 small icons) ── */
const MINI_DOCK = [
  { id: "home", icon: Crown },
  { id: "clipboard", icon: Clipboard },
  { id: "settings", icon: Settings },
  { id: "star", icon: Star },
];

/* ── SEED OFFERS (only 2 as shown in mockup) ── */
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
  playersMeta: string;
  rewardLabel: string;
  bgPosition: string;
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
    owner: "Kael\u2019thas",
    ownerClass: "Gladiator",
    playersMeta: "4 \u00d7 +10",
    rewardLabel: "25K PER RUN",
    bgPosition: "center 38%",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "seed-2",
    serviceId: "powerleveling",
    name: "LEVELING 1\u201380",
    category: "Leveling",
    quantity: 4,
    priceUsd: 50,
    paymentMethod: "kinah",
    speed: "Super Express",
    region: "EU",
    owner: "Nerezza",
    ownerClass: "Spiritmaster",
    playersMeta: "4 \u00d7 +10",
    rewardLabel: "50K PER RUN",
    bgPosition: "52% 58%",
    createdAt: Date.now() - 7200000,
  },
];

/* ════════════════════════════════════════════════════════════════════ */
export default function Aion2ClubPage() {
  const [activeTab, setActiveTab] = useState("Dungeons");
  const [activeDock, setActiveDock] = useState("home");
  const [offers, setOffers] = useState<OfferCard[]>(SEED_OFFERS);
  const [showCreate, setShowCreate] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* Hide the global UPLINK navbar so only our custom header shows */
  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  const filteredOffers = useMemo(() => {
    if (activeTab === "all") return offers;
    return offers.filter((o) => o.category.toLowerCase() === activeTab.toLowerCase());
  }, [activeTab, offers]);

  /* Show all offers when category filter returns empty */
  const displayOffers = filteredOffers.length > 0 ? filteredOffers : offers;

  const handlePublish = useCallback(
    (data: { serviceId: string; quantity: number; priceUsd: number; paymentMethod: "kinah" | "cash"; speed: string }) => {
      const svc = AION_SERVICES.find((s) => s.id === data.serviceId);
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
        playersMeta: data.quantity + " \u00d7 PARTY",
        rewardLabel: data.paymentMethod === "cash" ? formatUsd(data.priceUsd * data.quantity) : Math.round(data.priceUsd * data.quantity) + "K PER RUN",
        bgPosition: "center 35%",
        createdAt: Date.now(),
      };
      setOffers((prev) => [newOffer, ...prev]);
      setShowCreate(false);
      setActiveTab(cat);
    },
    [],
  );

  return (
    <div className="min-h-screen bg-[#04050d] text-white relative selection:bg-cyan-500 selection:text-black font-sans overflow-x-hidden">

      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#050612]/70 border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <a href="#club" className="flex items-center gap-2 group cursor-pointer select-none">
            <span className="text-2xl sm:text-3xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent font-serif">AION</span>
            <span className="text-2xl sm:text-3xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 via-sky-300 to-purple-400 bg-clip-text text-transparent font-serif">2</span>
          </a>

          {/* Center nav pills */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = !!item.active;
              return (
                <a key={item.label} href={item.href} className={active ? "flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black tracking-[0.18em] text-cyan-200 bg-cyan-500/15 border border-cyan-400/50 shadow-[0_0_14px_rgba(0,255,255,0.3)]" : "flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black tracking-[0.18em] text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"}>
                  <Icon className={active ? "w-3.5 h-3.5 text-cyan-300" : "w-3.5 h-3.5 text-gray-500"} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right: bell + user */}
          <div className="flex items-center gap-3">
            <button type="button" className="relative w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-gray-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,1)]" />
            </button>

            {/* User capsule */}
            <div className="relative">
              <button type="button" onClick={() => setUserMenuOpen((p) => !p)} className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-[#0b0e22]/80 border border-purple-400/25 hover:border-cyan-400/50 transition-all group cursor-pointer">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-cyan-300/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500/40 via-sky-600/30 to-purple-600/40 flex items-center justify-center text-[10px] font-black text-cyan-100">OS</div>
                </div>
                <div className="text-left flex items-center gap-2">
                  <span className="text-[11px] font-black tracking-wider text-white uppercase">OMAR SALEH</span>
                  <span className="px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">CLUB</span>
                </div>
                <ChevronDown className={userMenuOpen ? "w-3.5 h-3.5 text-gray-400 rotate-180 transition-transform" : "w-3.5 h-3.5 text-gray-400 transition-transform"} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-full mt-2 w-48 bg-[#090c1e]/98 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-1.5">
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</div>
                      <div className="text-xs font-black text-cyan-300 truncate">Omar Saleh</div>
                    </div>
                    {["Profile", "My Missions", "Kinah Wallet", "Settings"].map((item) => (
                      <button key={item} type="button" onClick={() => setUserMenuOpen(false)} className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-gray-300 hover:text-cyan-200 hover:bg-cyan-500/10 transition-all flex items-center justify-between cursor-pointer">
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

      {/* ═══ HERO SECTION ═══ */}
      <section id="club" className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden pt-16">

        {/* Full-width animated video background — characters prominent */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/aion%202%20bg%20small.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Lighter overlays so characters stay visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04050d] via-transparent to-[#04050d]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(4,5,13,0.5)_75%)] pointer-events-none" />
      </section>

      {/* ═══ FILTER TABS ═══ */}
      <section className="px-4 sm:px-6 relative z-20 -mt-2 mb-8">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={isActive ? "flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-full text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer bg-gradient-to-r from-cyan-500/20 via-blue-600/30 to-purple-600/20 border-2 border-cyan-300/70 text-white shadow-[0_0_20px_rgba(0,255,255,0.35)] scale-105" : "flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-full text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer bg-[#070b1e]/60 border border-white/[0.1] text-gray-400 hover:text-white hover:border-cyan-400/40"}>
                <Icon className={isActive ? "w-4 h-4 text-cyan-300" : "w-4 h-4 text-gray-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="max-w-[1700px] mx-auto px-4 sm:px-8 pb-20 relative z-20">
        <div className="flex gap-6 items-start">

          {/* ── Mini floating sidebar (4 small icons matching mockup) ── */}
          <aside className="hidden xl:flex flex-col items-center gap-2 pt-2 w-12 shrink-0 sticky top-20">
            {MINI_DOCK.map((item) => {
              const Icon = item.icon;
              const active = activeDock === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setActiveDock(item.id)} className={active ? "w-10 h-10 rounded-xl bg-[#0a0e24] border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,255,255,0.3)] transition-all cursor-pointer" : "w-10 h-10 rounded-xl bg-[#0a0e24]/60 border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all cursor-pointer"}>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </aside>

          {/* ── Content grid: offers + ongoing missions ── */}
          <div id="offers" className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

            {/* Left: Available Offers */}
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <span className="text-cyan-400 text-base">&#10022;</span>
                  <h3 className="text-base sm:text-lg font-black tracking-[0.25em] uppercase text-white font-serif">AVAILABLE OFFERS</h3>
                  <span className="text-cyan-400 text-base">&#10022;</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                  <span className="text-[9px] font-black tracking-widest text-cyan-200 uppercase">NEW OFFERS ONLINE</span>
                </div>
              </div>

              <div className="space-y-4">
                {displayOffers.map((offer) => {
                  const isEU = offer.region === "EU";
                  return (
                    <motion.div key={offer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} className="group relative rounded-2xl overflow-hidden border border-white/[0.1] hover:border-cyan-400/50 bg-[#070919]/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all duration-300">
                      {/* Right ambient glow */}
                      <div className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none opacity-50 group-hover:opacity-70 transition-all duration-500" style={{ background: "radial-gradient(ellipse at right center, rgba(56,189,248,0.25), transparent 70%)" }} />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#070919] via-[#070919]/70 to-transparent pointer-events-none" />

                      {/* Card content */}
                      <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Rank diamond */}
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-gradient-to-b from-[#141b3f] to-[#0c1027] border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,255,255,0.2)] group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="url(#rkG)" />
                              <circle cx="12" cy="12" r="2" fill="#ffffff" />
                              <defs>
                                <linearGradient id="rkG" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#67e8f9" />
                                  <stop offset="1" stopColor="#a855f7" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-black tracking-wider text-white uppercase group-hover:text-cyan-200 transition-colors">{offer.name}</h4>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-300">
                                <span>{offer.playersMeta}</span>
                                <Users className="w-3.5 h-3.5 text-cyan-400" />
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-black text-gray-200">
                                <Image src={isEU ? "/flags/eu.svg" : "/flags/us.svg"} alt={offer.region} width={14} height={10} className="rounded-xs" />
                                <span>{offer.region}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span>{offer.rewardLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {displayOffers.length === 0 && (
                  <div className="text-center py-16 bg-[#070919]/60 border border-white/[0.08] rounded-2xl">
                    <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">No active offers</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Ongoing Missions */}
            <aside className="w-full">
              <div className="relative rounded-3xl overflow-hidden border border-cyan-500/20 bg-[#060818]/85 backdrop-blur-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-white/[0.08]">
                  <Shield className="w-4 h-4 text-cyan-300" />
                  <h3 className="text-xs font-black tracking-[0.25em] uppercase text-cyan-100 font-serif">ONGOING MISSIONS</h3>
                </div>

                <div className="flex flex-col items-center justify-center py-8 text-center">
                  {/* Aion triangle glyph */}
                  <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                    <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
                      <path d="M50 8L92 82H8L50 8Z" stroke="url(#gG)" strokeWidth="2.5" fill="rgba(6,182,212,0.04)" />
                      <circle cx="50" cy="54" r="20" stroke="url(#gG)" strokeWidth="1.5" strokeDasharray="4 3" />
                      <circle cx="50" cy="54" r="5" fill="#38bdf8" />
                      <circle cx="50" cy="54" r="9" stroke="#38bdf8" strokeWidth="1" opacity="0.5" />
                      <line x1="50" y1="34" x2="50" y2="22" stroke="#a5f3fc" strokeWidth="1.5" />
                      <line x1="33" y1="63" x2="22" y2="69" stroke="#a5f3fc" strokeWidth="1.5" />
                      <line x1="67" y1="63" x2="78" y2="69" stroke="#a5f3fc" strokeWidth="1.5" />
                      <defs>
                        <linearGradient id="gG" x1="50" y1="8" x2="50" y2="82" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#a5f3fc" />
                          <stop offset="0.5" stopColor="#38bdf8" />
                          <stop offset="1" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">NO ACTIVE MISSIONS</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-1.5 max-w-[200px] leading-relaxed">Create or accept an offer to embark on your Daeva journey.</p>

                  <button type="button" onClick={() => setShowCreate(true)} className="mt-5 px-5 py-2 rounded-full text-[9px] font-black tracking-[0.2em] uppercase text-cyan-300 bg-cyan-500/10 border border-cyan-400/35 hover:bg-cyan-500/20 hover:border-cyan-300 transition-all cursor-pointer">
                    START AN OPERATION
                  </button>
                </div>
              </div>

              <div id="support" className="mt-4 rounded-2xl border border-white/[0.06] bg-[#060818]/50 p-4 text-center">
                <div className="text-[9px] font-black text-cyan-300 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> AION 2 EGYPTIAN COMMUNITY
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Join hundreds of Egyptian Daevas on Discord for daily Abyss runs, trading &amp; voice rooms.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 py-8 text-center border-t border-white/[0.06] relative z-20">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">
          POWERED BY UPLINK <span className="text-cyan-400 mx-2">&bull;</span> AION 2 COMMUNITY LOBBY
        </p>
      </footer>

      {/* ═══ CREATE OFFER MODAL ═══ */}
      <AnimatePresence>
        {showCreate && <CreateOfferModal onClose={() => setShowCreate(false)} onPublish={handlePublish} />}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
function CreateOfferModal({ onClose, onPublish }: {
  onClose: () => void;
  onPublish: (data: { serviceId: string; quantity: number; priceUsd: number; paymentMethod: "kinah" | "cash"; speed: string }) => void;
}) {
  const [cat, setCat] = useState("Dungeons");
  const [serviceId, setServiceId] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("25");
  const [method, setMethod] = useState<"kinah" | "cash">("kinah");
  const [speed, setSpeed] = useState("Standard");

  const services = AION_SERVICES.filter((s) => s.category === cat);
  const selectService = (svc: AionService) => { setServiceId(svc.id); setPrice(svc.basePriceUsd.toFixed(0)); };
  const total = (parseFloat(price) || 0) * qty;
  const canPublish = (parseFloat(price) || 0) > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#070a1e]/95 border-2 border-cyan-400/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,255,255,0.2)]">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-300" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white font-serif">CREATE YOUR OFFER</h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-400/50 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="text-[10px] font-black text-cyan-200 uppercase tracking-widest block mb-2">Category</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {AION_CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => { setCat(c); setServiceId(""); }} className={cat === c ? "px-3.5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all cursor-pointer" : "px-3.5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border bg-white/[0.03] border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"}>
              {c}
            </button>
          ))}
        </div>

        <label className="text-[10px] font-black text-cyan-200 uppercase tracking-widest block mb-2">Service Type</label>
        <div className="space-y-2 mb-5 max-h-44 overflow-y-auto pr-1">
          {services.map((svc) => (
            <button key={svc.id} type="button" onClick={() => selectService(svc)} className={svc.id === serviceId ? "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-left border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(0,255,255,0.25)] transition-all cursor-pointer" : "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-left border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/30 transition-all cursor-pointer"}>
              <span className="text-xs font-black truncate">{svc.name}</span>
              <span className="text-[10px] font-black text-amber-400">{formatUsd(svc.basePriceUsd)}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Party / Slots</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-black text-white hover:border-cyan-400/50 cursor-pointer">&minus;</button>
              <span className="flex-1 text-center font-black text-base text-white">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-black text-white hover:border-cyan-400/50 cursor-pointer">+</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Price Per Run ({method === "kinah" ? "K" : "$"})</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25" className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-white outline-none focus:border-cyan-400/70" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Payment</label>
            <div className="flex gap-2">
              {(["kinah", "cash"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} className={method === m ? "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,255,255,0.3)] transition-all cursor-pointer" : "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-white/[0.03] border-white/10 text-gray-400 transition-all cursor-pointer"}>
                  {m === "kinah" ? "Kinah" : "USD"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Speed</label>
            <select value={speed} onChange={(e) => setSpeed(e.target.value)} className="w-full bg-[#090d24] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-black text-white outline-none focus:border-cyan-400/70">
              <option>Standard</option>
              <option>Express</option>
              <option>Super Express</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4 flex items-center justify-between mb-6">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total Reward</span>
          <span className="text-xl font-black text-amber-300">{method === "cash" ? formatUsd(total) : Math.round(total) + "K Kinah"}</span>
        </div>

        <button type="button" disabled={!canPublish} onClick={() => onPublish({ serviceId: serviceId || "custom", quantity: qty, priceUsd: parseFloat(price) || 25, paymentMethod: method, speed })} className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 border-2 border-cyan-300/80 shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:shadow-[0_0_45px_rgba(0,255,255,0.7)] hover:border-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
          <Send className="w-4 h-4" /> PUBLISH OFFER
        </button>
      </motion.div>
    </motion.div>
  );
}
