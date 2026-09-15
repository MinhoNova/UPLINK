"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("UPLINK page error:", error);
    console.error("Stack:", error?.stack);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col items-center justify-center p-8 text-center">
      <ShieldAlert className="w-16 h-16 text-[#ff007f] mb-6" />
      <h1 className="text-2xl font-black uppercase tracking-widest mb-3">Signal Interrupted</h1>
      <p className="text-sm text-gray-500 max-w-md mb-4">
        Something crashed while loading the page.
      </p>
      
      {error?.message && (
        <div className="mb-6 max-w-lg">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-400 hover:text-white underline mb-2"
          >
            {showDetails ? "Hide" : "Show"} error details
          </button>
          {showDetails && (
            <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-left">
              <pre className="text-[10px] text-red-400 whitespace-pre-wrap break-all font-mono">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-[9px] text-gray-600 mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}
        </div>
      )}
      
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
      
      <p className="text-[10px] text-gray-600 mt-8 max-w-sm">
        If this persists, check browser console (F12) for more details.
      </p>
    </div>
  );
}
