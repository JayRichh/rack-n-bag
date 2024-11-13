'use client';

import { motion } from 'framer-motion';
import { typography } from '../../../lib/design-system';

export default function TournamentLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-background to-muted/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-900/[0.04] dark:bg-grid-white/[0.02] bg-[size:60px_60px] opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[500px] h-[500px] bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl opacity-20" />
        </div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Loading Logo */}
          <div className="flex justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 rounded-full bg-accent/20 dark:bg-accent/30 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-accent animate-pulse" />
            </motion.div>
          </div>

          {/* Loading Text */}
          <div className="space-y-4">
            <h2 className={`${typography.h2} text-black/90 dark:text-white/90`}>
              Loading Tournament
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Preparing your tournament data...
            </p>
          </div>

          {/* Loading Bars */}
          <div className="space-y-3 max-w-md mx-auto">
            <motion.div
              className="h-2 bg-accent/20 dark:bg-accent/30 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="h-full bg-accent"
                animate={{ 
                  x: ['-100%', '100%'],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            <motion.div
              className="h-2 bg-accent/20 dark:bg-accent/30 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="h-full bg-accent"
                animate={{ 
                  x: ['-100%', '100%'],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}