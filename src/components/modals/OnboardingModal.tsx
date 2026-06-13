"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProtocolMark } from "@/components/ProtocolMark";

interface OnboardingModalProps {
  isOpen: boolean;
  data: { interests: string[]; raiderLink: string; battleTag: string };
  setData: (data: any) => void;
  onSubmit: () => void;
}

export default function OnboardingModal({ isOpen, data, setData, onSubmit }: OnboardingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden"
        >
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{
              scale: [1.1, 1.2, 1.1],
              opacity: 1,
            }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 z-0"
          >
            <img
              src="/animated_galaxy_bg_1778221194532.png"
              className="w-full h-full object-cover opacity-80"
              alt="Galaxy"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.95, y: 30 },
              visible: {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  type: "spring",
                  damping: 25,
                  stiffness: 120,
                  staggerChildren: 0.1,
                },
              },
              exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
              e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
            }}
            style={{ background: "transparent" }}
            className="w-full max-w-lg backdrop-blur-2xl border border-white/20 rounded-[3rem] overflow-hidden relative p-12 group/modal"
          >
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/modal:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.15),rgba(168,85,247,0.1),transparent_80%)]"></div>
            </div>

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[#4f46e5]/10 blur-[120px] rounded-full"></div>
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[#7c3aed]/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10">
              <motion.div
                variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
                className="flex flex-col items-center text-center mb-12"
              >
                <ProtocolMark variant={1} className="w-20 h-20 text-white mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]" />
                <h2 className="text-5xl font-black tracking-widest uppercase mb-2 bg-gradient-to-r from-[#00ffff] to-[#ff007f] bg-clip-text text-transparent">
                  UPLINK
                </h2>
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black text-[#00ffff] uppercase tracking-[0.4em] ml-4 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                    Neural Signature
                  </label>
                  <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-2 group focus-within:bg-[#00ffff]/10 focus-within:border-[#00ffff] transition-all shadow-[0_0_30px_rgba(0,255,255,0.1)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffff]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="flex items-center gap-4 px-4 relative z-10">
                      <img src="/classes/Battle.net.svg" className="w-9 h-9 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" alt="Bnet" />
                      <input
                        type="text"
                        placeholder="Username#1234"
                        value={data.battleTag}
                        onChange={(e) => setData({ ...data, battleTag: e.target.value })}
                        className="w-full bg-transparent py-4 text-white outline-none font-black placeholder:text-white/10 uppercase"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black text-[#ff007f] uppercase tracking-[0.4em] ml-4 drop-shadow-[0_0_5px_rgba(255,0,127,0.5)]">
                    Combat Registry
                  </label>
                  <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-2 group focus-within:bg-[#ff007f]/10 focus-within:border-[#ff007f] transition-all shadow-[0_0_30px_rgba(255,0,127,0.1)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff007f]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="flex items-center gap-4 px-4 relative z-10">
                      <img src="/classes/RAIDER IO.svg" className="w-9 h-9 drop-shadow-[0_0_8px_rgba(255,0,127,0.5)]" alt="RIO" />
                      <input
                        type="text"
                        placeholder="https://raider.io/characters/..."
                        value={data.raiderLink}
                        onChange={(e) => setData({ ...data, raiderLink: e.target.value })}
                        className="w-full bg-transparent py-4 text-white outline-none font-black placeholder:text-white/10 uppercase"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="mt-12"
              >
                <button
                  onClick={onSubmit}
                  className="w-full group relative py-6 bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-white font-black text-xs uppercase tracking-[0.4em] rounded-2xl shadow-[0_20px_40px_rgba(0,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                  <span className="relative z-10">AUTHORIZE UPLINK</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
