import React from 'react';
import { motion } from 'framer-motion';

const FlowEffect = () => {
  return (
    <div className="relative w-64 h-20 flex items-center justify-between px-2">
      {/* المسار */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800/50 -translate-y-1/2 rounded-full overflow-hidden">
        {/* التيار الأزرق (من الشمال لليمين) */}
        <motion.div
          className="absolute top-0 left-0 h-full w-full bg-cyan-500"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 4, ease: "linear", repeat: Infinity }}
        />
        {/* التيار البينك (من اليمين للشمال) */}
        <motion.div
          className="absolute top-0 left-0 h-full w-full bg-[#ff007f]"
          initial={{ x: '100%' }}
          animate={{ x: '-100%' }}
          transition={{ duration: 4, ease: "linear", repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* الدوائر */}
      <motion.div
        className="w-8 h-8 rounded-full z-10 border-2"
        animate={{
          backgroundColor: ['#00ffff', '#ff007f', '#00ffff'],
          borderColor: ['#00ffff', '#ff007f', '#00ffff'],
        }}
        transition={{ duration: 8, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        className="w-8 h-8 rounded-full z-10 border-2"
        animate={{
          backgroundColor: ['#ff007f', '#00ffff', '#ff007f'],
          borderColor: ['#ff007f', '#00ffff', '#ff007f'],
        }}
        transition={{ duration: 8, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
};

export default FlowEffect;
