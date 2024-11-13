'use client';

import { motion } from 'framer-motion';
import { typography } from '../lib/design-system';
import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
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
          {/* Loading Icon */}
          <div className="flex justify-center">
            <motion.div
              animate={{ 
                rotate: 360
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-16 h-16 rounded-full bg-accent/20 dark:bg-accent/30 flex items-center justify-center"
            >
              <Loader2 className="w-8 h-8 text-accent" />
            </motion.div>
          </div>

          {/* Loading Text */}
          <div className="space-y-4">
            <h2 className={`${typography.h2} text-black/90 dark:text-white/90`}>
              Loading
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Just a moment while we prepare everything...
            </p>
          </div>

          {/* Loading Progress */}
          <div className="max-w-md mx-auto">
            <motion.div
              className="h-1 bg-accent/20 dark:bg-accent/30 rounded-full overflow-hidden"
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
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-accent"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-accent/5 dark:bg-accent/10 rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 dark:bg-accent/10 rounded-tl-full" />
    </div>
  );
}
