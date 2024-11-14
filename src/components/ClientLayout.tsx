'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGlobalSettings } from '../hooks/useGlobalSettings';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { ToastProvider } from './ToastContext';

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { settings, getAnimationConfig, isLoaded, getThemeClass } = useGlobalSettings();
  const { pageTransition } = getAnimationConfig();

  // Update theme class on html element only
  useEffect(() => {
    if (!isLoaded) return;

    const themeClass = getThemeClass();
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.classList.remove('light', 'dark');
    // Add new theme class
    html.classList.add(themeClass);
    // Update data-theme attribute for components that might use it
    html.setAttribute('data-theme', themeClass);

    // Store current theme for persistence across page loads
    localStorage.setItem('current-theme', themeClass);
  }, [isLoaded, getThemeClass]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {settings.lowMotion ? (
          <Loader2 className="w-8 h-8 text-accent" />
        ) : (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Loader2 className="w-8 h-8 text-accent" />
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <Tooltip.Provider delayDuration={settings.lowMotion ? 0 : 200}>
      <ToastProvider>
        <div className="min-h-screen relative">
          {settings.lowMotion ? (
            <div className="flex-1 relative">
              {children}
            </div>
          ) : (
            <motion.div
              key={pathname}
              variants={pageTransition}
              initial="hidden"
              animate="show"
              className="flex-1 relative"
            >
              {children}
            </motion.div>
          )}

          {/* Navigation Progress Indicator - only show if animations are enabled */}
          {!settings.lowMotion && (
            <motion.div
              key={`progress-${pathname}`}
              className="fixed top-0 left-0 right-0 h-1 bg-accent z-50"
              initial={{ scaleX: 0, opacity: 1 }}
              animate={{ 
                scaleX: 1, 
                opacity: [1, 1, 0],
                transition: {
                  duration: 0.4,
                  ease: "easeOut"
                }
              }}
              style={{ transformOrigin: "0%" }}
            />
          )}
        </div>
      </ToastProvider>
    </Tooltip.Provider>
  );
}
