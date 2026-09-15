import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-8 text-center">
      <div>
        <ShieldAlert className="w-16 h-16 text-[#ff007f] mx-auto mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-3">
          Thread Not Found
        </h1>
        <p className="text-sm text-gray-500 max-w-md mb-8">
          This mission thread may have been deleted or you may not have access to it.
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-[#00ffff] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
