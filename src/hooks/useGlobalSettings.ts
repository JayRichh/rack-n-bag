'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '../utils/storage';
import { GlobalSettings, SettingsUpdatePayload, defaultGlobalSettings } from '../types/settings';

export function useGlobalSettings() {
  const [settings, setSettings] = useState<GlobalSettings>(defaultGlobalSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light');
  const themeChangeTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize system theme and watch for changes
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(darkModeMediaQuery.matches ? 'dark' : 'light');

    const handleThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    darkModeMediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Load settings from storage
  useEffect(() => {
    const storedSettings = storage.getSettings();
    setSettings(storedSettings);
    setIsLoaded(true);
  }, []);

  // Update theme class immediately
  const updateThemeClass = useCallback((themeClass: string) => {
    const elements = [document.documentElement, document.body];
    elements.forEach(el => {
      el.classList.remove('light', 'dark');
      el.classList.add(themeClass);
    });

    // Force a repaint
    if (themeChangeTimeoutRef.current) {
      clearTimeout(themeChangeTimeoutRef.current);
    }
    themeChangeTimeoutRef.current = setTimeout(() => {
      document.body.style.backgroundColor = document.body.style.backgroundColor;
    }, 0);
  }, []);

  // Save settings and update theme
  const updateSettings = useCallback((newSettings: SettingsUpdatePayload) => {
    setSettings(prev => {
      const updated = { ...prev };
      
      if (typeof newSettings.lowMotion !== 'undefined') {
        updated.lowMotion = newSettings.lowMotion;
      }
      if (typeof newSettings.theme !== 'undefined') {
        updated.theme = newSettings.theme;
        // Update theme class immediately
        updateThemeClass(newSettings.theme);
      }
      if (typeof newSettings.notifications !== 'undefined') {
        updated.notifications = newSettings.notifications;
      }

      // Save to storage
      storage.saveSettings(updated);

      return updated;
    });
  }, [updateThemeClass]);

  const getAnimationConfig = useCallback(() => {
    if (settings.lowMotion) {
      return {
        pageTransition: {
          hidden: { opacity: 1, y: 0 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0
            }
          }
        },
        item: {
          hidden: { opacity: 1, y: 0 },
          show: { opacity: 1, y: 0 }
        }
      };
    }

    return {
      pageTransition: {
        hidden: { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            duration: 0.3
          }
        }
      },
      item: {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
      }
    };
  }, [settings.lowMotion]);

  const getThemeClass = useCallback(() => {
    if (settings.theme === 'system') return systemTheme;
    return settings.theme;
  }, [settings.theme, systemTheme]);

  // Update theme class whenever theme or system theme changes
  useEffect(() => {
    if (!isLoaded) return;
    updateThemeClass(getThemeClass());
  }, [isLoaded, getThemeClass, updateThemeClass]);

  return {
    settings,
    updateSettings,
    getAnimationConfig,
    getThemeClass,
    isLoaded,
    systemTheme
  };
}
