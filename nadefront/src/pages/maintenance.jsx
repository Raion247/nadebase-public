import { motion } from "motion/react";
import { MD } from '../C/MD';

export default function Maintenance() {
  const isMobile = MD();

  const nInitialX = isMobile ? 56.5 : 137;
  const nInitialY = -15;
  const adeInitialX = isMobile ? 56 : 135;
  const bInitialY = 15;
  const baseInitialX = -135;

  return (
    <div className="flex items-center justify-center h-screen bg-[#0e0e1a] text-white font-mono overflow-hidden">
      <div className="relative flex flex-col text-center justify-center">
        <div className="absolute inset-0 blur-[120px] opacity-20 bg-gradient-to-br from-orange-500 via-purple-600 to-blue-500 rounded-full" />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
          className="text-orange-400 text-base font-bold tracking-[0.3em] uppercase mb-3"
        >
          Version 1.1
        </motion.p>

        {/* Logo */}
        <div className="flex flex-row text-6xl sm:text-7xl font-bold text-white justify-center mb-3">
          <div className="flex flex-row">
            <motion.span
              initial={{ x: nInitialX, y: nInitialY }}
              animate={{ x: [nInitialX, nInitialX, 0], y: [nInitialY, -2, -2] }}
              transition={{ delay: 1, times: [0, 0.4, 1], duration: 1, ease: ["anticipate", "linear", "linear"] }}
              className="overflow-visible"
            >
              n
            </motion.span>
            <div className="flex relative overflow-hidden bottom-[2px]">
              <motion.span
                initial={{ x: adeInitialX }}
                animate={{ x: 0 }}
                transition={{ delay: 1.4, duration: 0.6, ease: "linear" }}
              >
                ade
              </motion.span>
            </div>
          </div>
          <div className="flex flex-row">
            <motion.span
              initial={{ y: bInitialY }}
              animate={{ y: [bInitialY, -2, -2] }}
              transition={{ delay: 1, times: [0, 0.4, 1], duration: 1, ease: "anticipate" }}
              className="overflow-visible"
            >
              b
            </motion.span>
            <div className="flex relative overflow-hidden bottom-[2px]">
              <motion.span
                initial={{ x: baseInitialX }}
                animate={{ x: 0 }}
                transition={{ delay: 1.4, duration: 0.6, ease: "linear" }}
              >
                ase
              </motion.span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Under Maintenance
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto mt-4 leading-relaxed">
            New features, New lineups, New design
          </p>
        </motion.div>
      </div>
    </div>
  );
}