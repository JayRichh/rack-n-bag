'use client';

import { motion } from 'framer-motion';
import { typography } from '../../../lib/design-system';
import { PlusCircle } from 'lucide-react';

export default function NewTournamentLoading() {
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
                scale: [1, 1.1, 1],
                rotate: [0, 0, 180, 180, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 rounded-full bg-accent/20 dark:bg-accent/30 flex items-center justify-center"
            >
              <PlusCircle className="w-8 h-8 text-accent" />
            </motion.div>
          </div>

          {/* Loading Text */}
          <div className="space-y-4">
            <h2 className={`${typography.h2} text-black/90 dark:text-white/90`}>
              Creating New Tournament
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Preparing tournament creation form...
            </p>
          </div>

          {/* Loading Form Skeleton */}
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Tournament Name Field */}
            <div className="space-y-2">
              <div className="h-4 w-32 bg-accent/20 dark:bg-accent/30 rounded animate-pulse" />
              <div className="h-12 bg-accent/10 dark:bg-accent/20 rounded-lg animate-pulse" />
            </div>

            {/* Tournament Format */}
            <div className="space-y-2">
              <div className="h-4 w-36 bg-accent/20 dark:bg-accent/30 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-accent/10 dark:bg-accent/20 rounded-lg animate-pulse" />
                <div className="h-12 bg-accent/10 dark:bg-accent/20 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Teams Section */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-accent/20 dark:bg-accent/30 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="flex gap-4">
                  <div className="flex-grow h-12 bg-accent/10 dark:bg-accent/20 rounded-lg animate-pulse" />
                  <div className="w-32 h-12 bg-accent/10 dark:bg-accent/20 rounded-lg animate-pulse" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="h-12 bg-accent/10 dark:bg-accent/20 rounded-lg animate-pulse"
                    style={{ 
                      animationDelay: `${i * 0.1}s`,
                      opacity: 1 - (i * 0.2)
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <div className="w-24 h-10 bg-accent/20 dark:bg-accent/30 rounded-lg animate-pulse" />
              <div className="w-32 h-10 bg-accent/10 dark:bg-accent/20 rounded-lg animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-accent/5 dark:bg-accent/10 rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 dark:bg-accent/10 rounded-tl-full" />
    </div>
  );
}
