"use client";

import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("UPLINK page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col items-center justify-center p-8 text-center">
      <ShieldAlert className="w-16 h-16 text-[#ff007f] mb-6" />
      <h1 className="text-2xl font-black uppercase tracking-widest mb-3">Signal Interrupted</h1>
      <p className="text-sm text-gray-500 max-w-md mb-8">
        Something crashed while loading the page. Try reloading — if it keeps happening, clear site data for localhost.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-8 py-3 bg-[#00ffff] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:opacity-90"
        >
          Reload
        </button>
        <button
          onClick={() => { window.location.href = "/"; }}
          className="px-8 py-3 bg-white/10 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white/20"
        >
          Back
        </button>
      </div>
    </div>
  );
}
