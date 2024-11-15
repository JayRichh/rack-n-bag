'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '../utils/storage';
import { GlobalSettings, SettingsUpdatePayload, defaultGlobalSettings } from '../types/settings';

export function useGlobalSettings() {
  const [settings, setSettings] = useState<GlobalSettings>(defaultGlobalSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light');
  const themeChangeTimeout = useRef<NodeJS.Timeout>();

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

  // Update theme class comprehensively
  const updateThemeClass = useCallback((themeClass: string) => {
    // Clear any pending theme updates
    if (themeChangeTimeout.current) {
      clearTimeout(themeChangeTimeout.current);
    }

    const applyTheme = () => {
      try {
        // Remove existing theme classes
        document.documentElement.classList.remove('light', 'dark');
        document.body.classList.remove('light', 'dark');

        // Add new theme class to root elements
        document.documentElement.classList.add(themeClass);
        document.body.classList.add(themeClass);

        // Set data-theme attribute for components that might use it
        document.documentElement.setAttribute('data-theme', themeClass);
        
        // Update CSS variables for consistent theming
        if (themeClass === 'dark') {
          document.documentElement.style.setProperty('--background', '#1a1b1e');
          document.documentElement.style.setProperty('--foreground', '#ffffff');
        } else {
          document.documentElement.style.setProperty('--background', '#ffffff');
          document.documentElement.style.setProperty('--foreground', '#000000');
        }

        // Store the current theme in localStorage for persistence across page loads
        localStorage.setItem('current-theme', themeClass);
      } catch (error) {
        console.error('Failed to update theme:', error);
      }
    };

    // Apply theme immediately
    applyTheme();

    // Schedule another update to ensure theme persists after any React hydration
    themeChangeTimeout.current = setTimeout(applyTheme, 0);
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
      }
      if (typeof newSettings.notifications !== 'undefined') {
        updated.notifications = newSettings.notifications;
      }

      // Save to storage
      storage.saveSettings(updated);

      // If theme changed, update it immediately
      if (typeof newSettings.theme !== 'undefined') {
        const effectiveTheme = newSettings.theme === 'system' ? systemTheme : newSettings.theme;
        updateThemeClass(effectiveTheme);
      }

      return updated;
    });
  }, [updateThemeClass, systemTheme]);

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
    
    const effectiveTheme = getThemeClass();
    const storedTheme = localStorage.getItem('current-theme');
    
    // Only update if the theme has actually changed
    if (storedTheme !== effectiveTheme) {
      updateThemeClass(effectiveTheme);
    }
  }, [isLoaded, getThemeClass, updateThemeClass, settings.theme, systemTheme]);

  // Ensure theme persists across page loads
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settings') {
        const newSettings = JSON.parse(e.newValue || '{}');
        setSettings(newSettings);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    settings,
    updateSettings,
    getAnimationConfig,
    getThemeClass,
    isLoaded,
    systemTheme
  };
}
