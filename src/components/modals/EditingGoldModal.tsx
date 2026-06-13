"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface EditingGoldProps {
  data: any;
  setData: (data: any) => void;
  theme: string;
  onSave: (data: any) => void;
}

export default function EditingGoldModal({ data, setData, theme, onSave }: EditingGoldProps) {
  if (!data) return null;
  const isLight = theme === "light";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className={`w-full max-w-xl ${isLight ? "bg-white text-black" : "bg-[#0a0a16] text-white"} border-2 border-[#ffd700]/50 rounded-[2rem] p-8 shadow-2xl relative`}
        >
          <motion.button onClick={() => setData(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full">
            <X />
          </motion.button>
          <h2 className="text-2xl font-black uppercase mb-6 text-[#ffd700]">Adjust Market Listing</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Amount (M)</label>
                <input
                  type="number"
                  value={data.amountM}
                  onChange={(e) => setData({ ...data, amountM: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Price (EGP)</label>
                <input
                  type="number"
                  value={data.totalPrice}
                  onChange={(e) => setData({ ...data, totalPrice: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Delivery Notes</label>
              <input
                type="text"
                value={data.notes}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold outline-none"
              />
            </div>
          </div>
          <motion.button
            onClick={() => onSave(data)}
            className="w-full py-4 bg-[#ffd700] text-black font-black uppercase rounded-xl mt-8 shadow-lg hover:brightness-110 transition-all text-sm tracking-widest text-center"
          >
            Update Listing
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
