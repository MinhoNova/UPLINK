"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, ChevronRight, Gamepad2, Globe, Shield, Terminal } from "lucide-react";

export default function CitypunksWireframe() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); }
  }, [status, router]);
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-[#00ffff] selection:text-black">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-screen flex flex-col justify-end overflow-hidden border-b border-gray-800">
        
        {/* Placeholder for Large Video */}
        <div className="absolute inset-0 z-0 bg-gray-900/50 flex items-center justify-center">
          <div className="text-gray-600 flex flex-col items-center gap-4">
            <Globe className="w-16 h-16 animate-pulse opacity-20" />
            <span className="uppercase tracking-widest text-sm font-bold opacity-30">[ BACKGROUND VIDEO LOOP ]</span>
          </div>
          {/* Cyberpunk Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/30" />
        </div>

        {/* Hero Content (Bottom Left) */}
        <div className="relative z-10 p-8 md:p-16 max-w-5xl">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff007f] drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
            Citypunks
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-10 font-mono">
            Take back the concrete jungle. High-octane cyber-warfare in a dystopian metropolis.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Main CTA */}
            <button className="group relative px-8 py-4 bg-[#00ffff] text-black font-bold uppercase tracking-wider overflow-hidden">
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" /> Play The Game
              </span>
            </button>

            {/* Watch Trailer CTA */}
            <button className="group px-8 py-4 border-2 border-gray-500 hover:border-[#ff007f] text-white font-bold uppercase tracking-wider transition-colors flex items-center gap-3 backdrop-blur-sm bg-black/20">
              <div className="w-8 h-8 rounded-full bg-[#ff007f]/20 flex items-center justify-center group-hover:bg-[#ff007f] transition-colors">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              Watch Trailer
            </button>
          </div>
        </div>
      </section>


      {/* 2. FEATURES SECTION */}
      <section className="py-24 px-8 md:px-16 max-w-7xl mx-auto">
        <div className="mb-16 flex items-center gap-4">
          <div className="h-px bg-[#00ffff] flex-1 opacity-50" />
          <h2 className="text-3xl font-black uppercase tracking-widest text-[#00ffff]">Core Directives</h2>
          <div className="h-px bg-[#00ffff] flex-1 opacity-50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Feature 1 */}
          <div className="group relative border border-gray-800 bg-[#0a0a0a] overflow-hidden hover:border-gray-600 transition-colors">
            <div className="aspect-video bg-gray-900 flex items-center justify-center border-b border-gray-800">
              <Shield className="w-12 h-12 text-gray-700 group-hover:text-[#ff007f] transition-colors duration-500" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold uppercase mb-3 group-hover:text-[#ff007f] transition-colors">Augmented Combat</h3>
              <p className="text-gray-400 font-mono text-sm leading-relaxed">
                Customize your operative with illegal cybernetic enhancements. Master fluid movement mechanics, wall-running, and tactical bullet-time to outmaneuver corporate security forces.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative border border-gray-800 bg-[#0a0a0a] overflow-hidden hover:border-gray-600 transition-colors">
            <div className="aspect-video bg-gray-900 flex items-center justify-center border-b border-gray-800">
              <Terminal className="w-12 h-12 text-gray-700 group-hover:text-[#00ffff] transition-colors duration-500" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold uppercase mb-3 group-hover:text-[#00ffff] transition-colors">Neural Net Hacking</h3>
              <p className="text-gray-400 font-mono text-sm leading-relaxed">
                Infiltrate enemy networks in real-time. Override turrets, manipulate environments, and steal classified data while engaging in intense firefights. The city is your weapon.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* 3. NEWS SECTION */}
      <section className="py-24 px-8 md:px-16 bg-[#0a0a0a] border-y border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl font-black uppercase tracking-widest">Transmission Log</h2>
            <Link href="#" className="hidden sm:flex items-center gap-2 text-sm font-mono text-[#00ffff] hover:text-white transition-colors">
              READ ALL LOGS <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* News Item 1 */}
            <article className="border border-gray-800 hover:border-gray-600 transition-colors bg-[#050505]">
              <div className="aspect-[4/3] bg-gray-900 flex items-center justify-center">
                 <span className="text-xs font-mono text-gray-700">[ IMAGE ]</span>
              </div>
              <div className="p-6">
                <time className="text-xs text-[#ff007f] font-mono mb-2 block">SYS.DATE: 2026.04.12</time>
                <h4 className="text-lg font-bold mb-2 uppercase line-clamp-2">Patch 1.2: The Neon Syndicate expansion is live</h4>
                <p className="text-gray-500 text-sm line-clamp-3 mb-4">Explore the newly unlocked underground sector, featuring 3 new weapons, a new faction, and expanded cyberware options.</p>
              </div>
            </article>

            {/* News Item 2 */}
            <article className="border border-gray-800 hover:border-gray-600 transition-colors bg-[#050505]">
              <div className="aspect-[4/3] bg-gray-900 flex items-center justify-center">
                 <span className="text-xs font-mono text-gray-700">[ IMAGE ]</span>
              </div>
              <div className="p-6">
                <time className="text-xs text-[#00ffff] font-mono mb-2 block">SYS.DATE: 2026.03.28</time>
                <h4 className="text-lg font-bold mb-2 uppercase line-clamp-2">Dev Diary: Rebuilding the combat mechanics</h4>
                <p className="text-gray-500 text-sm line-clamp-3 mb-4">A deep dive into how we overhauled the melee system to be more responsive and rewarding for aggressive playstyles.</p>
              </div>
            </article>

            {/* News Item 3 */}
            <article className="border border-gray-800 hover:border-gray-600 transition-colors bg-[#050505]">
              <div className="aspect-[4/3] bg-gray-900 flex items-center justify-center">
                 <span className="text-xs font-mono text-gray-700">[ IMAGE ]</span>
              </div>
              <div className="p-6">
                <time className="text-xs text-gray-500 font-mono mb-2 block">SYS.DATE: 2026.03.15</time>
                <h4 className="text-lg font-bold mb-2 uppercase line-clamp-2">Community Event: Megacorp Takedown</h4>
                <p className="text-gray-500 text-sm line-clamp-3 mb-4">Join forces with other operatives this weekend to hack the mainframe of OmniCorp and earn exclusive cosmetic rewards.</p>
              </div>
            </article>
          </div>
          
          {/* Mobile Read More */}
          <Link href="#" className="mt-8 flex sm:hidden items-center justify-center gap-2 text-sm font-mono text-[#00ffff]">
            READ ALL LOGS <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>


      {/* 4. BIG CTA SECTION */}
      <section className="relative py-32 px-8 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,127,0.15)_0%,#050505_70%)]" />
        
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
            Join the Resistance
          </h2>
          <p className="text-xl text-gray-400 font-mono mb-10">
            The city needs you. Jack in, gear up, and take down the system. Available now on PC and next-gen consoles.
          </p>
          
          <button className="group relative px-12 py-5 bg-[#ff007f] text-white font-black text-xl uppercase tracking-widest overflow-hidden hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative flex items-center gap-3 shadow-sm">
              <Gamepad2 className="w-6 h-6" /> PLAY FOR FREE
            </span>
          </button>
        </div>
      </section>


      {/* 5. FOOTER */}
      <footer className="border-t border-gray-800 bg-[#020202] py-12 px-8 md:px-16 text-sm font-mono text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tighter uppercase">Citypunks</span>
            <span>© 2026</span>
          </div>
          
          <div className="flex gap-6">
            <Link href="#" className="hover:text-[#00ffff] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#00ffff] transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-[#00ffff] transition-colors">Support</Link>
          </div>
          
          <div className="flex gap-4">
            {/* Social Placeholders */}
            <div className="w-8 h-8 rounded border border-gray-700 flex items-center justify-center hover:border-[#ff007f] transition-colors cursor-pointer text-xs">X</div>
            <div className="w-8 h-8 rounded border border-gray-700 flex items-center justify-center hover:border-[#ff007f] transition-colors cursor-pointer text-xs">YT</div>
            <div className="w-8 h-8 rounded border border-gray-700 flex items-center justify-center hover:border-[#ff007f] transition-colors cursor-pointer text-xs">DC</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
