import { useTheme } from '../C/TC';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const NotFound = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`flex items-center justify-center min-h-screen font-mono ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <div className="relative text-center px-6">
        <div className="absolute inset-0 -z-10 blur-[120px] opacity-20 bg-gradient-to-br from-red-500 via-purple-600 to-blue-500 rounded-full" />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-red-400 text-base font-bold tracking-[0.3em] uppercase mb-3"
        >
          Page Not Found
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-7xl sm:text-8xl font-bold text-white mb-4"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-gray-400 text-base sm:text-lg max-w-md mx-auto leading-relaxed mb-8"
        >
          This page doesn't exist or was moved.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-lg bg-orange-600/40 hover:bg-orange-500/40 border border-orange-500 text-white text-sm font-bold transition-colors"
        >
          Home
        </motion.button>
      </div>
    </div>
  );
};

export default NotFound;