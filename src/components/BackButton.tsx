"use client";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all font-black uppercase text-[10px] tracking-widest">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}
