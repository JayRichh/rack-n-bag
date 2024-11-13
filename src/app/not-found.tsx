'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { typography } from '../lib/design-system';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-background to-muted/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-900/[0.04] dark:bg-grid-white/[0.02] bg-[size:60px_60px] opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[500px] h-[500px] bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl opacity-20" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h1 className={`${typography.h1} text-8xl font-black text-accent mb-4`}>
            404
          </h1>
          <h2 className={`${typography.h2} text-black/90 dark:text-white/90 mb-8`}>
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
            Oops! Looks like you&apos;ve wandered into uncharted territory. 
            Let&apos;s get you back on track.
          </p>
          <motion.button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-6 py-3 bg-accent text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Home
          </motion.button>
        </motion.div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-accent/5 dark:bg-accent/10 rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 dark:bg-accent/10 rounded-tl-full" />
    </div>
  );
}
