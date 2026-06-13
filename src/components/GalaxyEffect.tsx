export default function GalaxyEffect() {
  return (
    <div className="absolute inset-[-8px] rounded-full z-0">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7c3aed]/40 via-[#00ffff]/20 to-[#ff007f]/30 animate-pulse blur-md" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#a855f7]/30 via-transparent to-[#00ffff]/20 animate-pulse blur-sm" style={{ animationDelay: "0.5s" }} />
    </div>
  );
}
