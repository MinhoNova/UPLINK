"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CircleDollarSign, PlusCircle, Coins, Trash2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lobby: any;
  onLobbyChange: (lobby: any) => void;
  currentUserId: string;
  isAdmin: boolean;
  onPasteProof: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onDiscardProof: () => void;
  onConfirmPayout: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  lobby,
  onLobbyChange,
  currentUserId,
  isAdmin,
  onPasteProof,
  onDiscardProof,
  onConfirmPayout,
}: PaymentModalProps) {
  const isOwner = currentUserId === lobby?.ownerId;

  return (
    <AnimatePresence>
      {isOpen && lobby && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-[#05050a] border-2 border-[#ffd700]/30 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(255,215,0,0.1)] relative"
          >
            <motion.button
              onClick={onClose}
              className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
            >
              <X />
            </motion.button>

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-[#ffd700]/10 rounded-2xl text-[#ffd700]">
                <CircleDollarSign className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                Payment Verification
              </h2>
            </div>

            {lobby.paymentProof ? (
              <div className="space-y-6">
                <div className="relative bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden">
                  <div className="max-h-[320px] flex items-center justify-center p-2">
                    <img
                      src={lobby.paymentProof}
                      className="max-w-full max-h-[320px] object-contain rounded-xl"
                    />
                  </div>
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Proof uploaded
                  </div>
                </div>

                {lobby.payoutStatus === "paid" ? (
                  <div className="flex items-center justify-center gap-2 px-6 py-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <p className="text-[11px] font-black text-green-400 uppercase tracking-widest">
                      Payment completed
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {(isOwner || isAdmin) && (
                      <motion.button
                        onClick={onConfirmPayout}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] transition-all flex items-center justify-center gap-2"
                      >
                        <Coins className="w-4 h-4" />
                        CONFIRM PAYOUT
                      </motion.button>
                    )}
                    {(isOwner || isAdmin) && (
                      <motion.button
                        onClick={onDiscardProof}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        DISCARD
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black/40 rounded-[2rem] border-2 border-dashed border-white/10 p-8 flex flex-col items-center justify-center min-h-[300px] hover:border-[#ffd700]/30 transition-all group">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-dashed border-white/20 group-hover:border-[#ffd700]/40 group-hover:bg-[#ffd700]/5 transition-all mb-6">
                  <PlusCircle className="w-10 h-10 text-gray-500 group-hover:text-[#ffd700] transition-all" />
                </div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed text-center mb-6">
                  Paste screenshot or drop image here
                </p>
                {(isOwner || isAdmin) && (
                  <div className="w-full max-w-md space-y-3">
                    <input
                      type="text"
                      placeholder="CTRL+V to Paste Screenshot..."
                      onPaste={onPasteProof}
                      className="w-full bg-black border-2 border-white/10 rounded-2xl px-6 py-5 text-xs text-white outline-none focus:border-[#ffd700] font-black uppercase text-center transition-all shadow-inner"
                    />
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] text-center">
                      Secure channel active
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
