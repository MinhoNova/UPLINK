export default function Loading() {
  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#00ffff]/40 border-t-[#00ffff] rounded-full animate-spin mx-auto mb-6" />
        <p className="text-xs font-black tracking-widest text-[#00ffff] uppercase">
          Loading mission...
        </p>
      </div>
    </div>
  );
}
