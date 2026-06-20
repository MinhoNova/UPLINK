"use client";

import { useEffect, useState } from "react";
import { Crown, Check, Sparkles, LogIn } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

const PERKS = [
  "Community Lounge access",
  "Profile GIF & banner uploads",
  "Avatar effects & animations",
  "Lobby VFX & custom banners",
  "Auto-apply to lobbies",
  "Hidden identity mode",
  "Unlimited daily offers",
  "Premium lobby card styling",
];

export default function ShopPageContent() {
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <main className="min-h-screen bg-[#05050a] text-white flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#00ffff]/10 via-[#8a2be2]/10 to-[#ff007f]/10 blur-[130px] rounded-full" />
      </div>
      <div className="w-full max-w-md bg-gradient-to-br from-[#0a0a16] to-black border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative z-10">
        <div className="px-6 py-8 text-center border-b border-white/5">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00ffff]/20 to-[#ff007f]/20 flex items-center justify-center border border-white/10">
            <Sparkles className="w-8 h-8 text-[#00ffff]" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest">All Features Free</h1>
          <p className="text-xs text-gray-400 font-bold mt-2 max-w-xs mx-auto leading-relaxed">
            UPLINK is completely free and open to everyone. No subscriptions, no paywalls, no daily limits.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Everything included</span>
          </div>

          <ul className="space-y-2">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-xs text-gray-300 font-medium">
                <span className="w-5 h-5 rounded-full bg-[#00ffff]/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#00ffff]" />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-white/5">
            {mounted && status === "unauthenticated" ? (
              <button
                type="button"
                onClick={() => signIn("discord")}
                className="w-full py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition flex items-center justify-center gap-2 bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black hover:opacity-90"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Discord to start
              </button>
            ) : (
              <div className="text-center py-3">
                <p className="text-sm font-black text-[#00ffff]">You&apos;re all set!</p>
                <p className="text-[10px] text-gray-500 font-bold mt-1">All features are unlocked for you.</p>
              </div>
            )}
          </div>

          <p className="text-[8px] text-gray-600 text-center font-bold uppercase tracking-widest">
            UPLINK — Free for everyone, forever.
          </p>
        </div>
      </div>
    </main>
  );
}