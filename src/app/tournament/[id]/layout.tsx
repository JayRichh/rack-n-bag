'use client';

import { motion } from 'framer-motion';
import { layout } from '../../../lib/design-system';
import { useEffect, useState } from 'react';

export default function TournamentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lowMotion, setLowMotion] = useState(false);

  useEffect(() => {
    // Check all tournament settings for lowMotion preference
    const allSettings = Object.keys(localStorage)
      .filter(key => key.startsWith('tournament_settings_'))
      .map(key => {
        try {
          return JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          return {};
        }
      });

    // If any tournament has lowMotion enabled, use it globally
    const hasLowMotion = allSettings.some(settings => settings.lowMotion);
    setLowMotion(hasLowMotion);
  }, []); // Only check on mount

  return (
    <motion.div 
      className={`${layout.maxWidth} ${layout.contentPadding} py-8`}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        transition: {
          duration: lowMotion ? 0.1 : 0.3
        }
      }}
    >
      <motion.div 
        className="max-w-[1400px] mx-auto"
        initial={{ opacity: 0, y: lowMotion ? 0 : 20 }}
        animate={{ 
          opacity: 1,
          y: 0,
          transition: {
            duration: lowMotion ? 0.1 : 0.3
          }
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}