'use client';

import { motion } from 'framer-motion';
import { typography } from '../../../lib/design-system';
import { useRouter } from 'next/navigation';
import { AlertOctagon, Home, RefreshCcw } from 'lucide-react';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function TournamentError({ error, reset }: ErrorProps) {
  const router = useRouter();

  const getErrorMessage = (error: Error) => {
    if (error.message.includes('not found')) {
      return 'Tournament not found. It may have been deleted or moved.';
    }
    if (error.message.includes('permission')) {
      return 'You don\'t have permission to access this tournament.';
    }
    return 'Something went wrong while loading the tournament.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-background to-muted/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-900/[0.04] dark:bg-grid-white/[0.02] bg-[size:60px_60px] opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[500px] h-[500px] bg-red-500/10 dark:bg-red-500/20 rounded-full blur-3xl opacity-20" />
        </div>
      </div>

      {/* Error Content */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 200
            }}
            className="flex justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertOctagon className="w-10 h-10 text-red-500" />
            </div>
          </motion.div>

          {/* Error Message */}
          <div className="space-y-4 max-w-md mx-auto">
            <h2 className={`${typography.h2} text-black/90 dark:text-white/90`}>
              Tournament Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {getErrorMessage(error)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <motion.button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-4 h-4" />
              Home
            </motion.button>
            
            <motion.button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </motion.button>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-left max-w-2xl mx-auto"
            >
              <details className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <summary className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-gray-500 dark:text-gray-500 overflow-auto">
                  {error.stack}
                </pre>
              </details>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-tl-full" />
    </div>
  );
}
