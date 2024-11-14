import { Tournament } from '../types/tournament';
import { testTournament } from './test-data';

type StorageType = 'localStorage' | 'sessionStorage';

interface Settings {
  lowMotion: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

class SafeStorage {
  private storage: Storage | null = null;
  private type: StorageType;
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  constructor(type: StorageType) {
    this.type = type;
    if (typeof window !== 'undefined') {
      // Listen for storage events from other tabs/windows
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (!event.key || event.storageArea !== this.getStorage()) return;

    try {
      const newValue = event.newValue ? JSON.parse(event.newValue) : null;
      // Notify all listeners for this key
      this.listeners.get(event.key)?.forEach(listener => listener(newValue));
    } catch (error) {
      console.warn('Failed to parse storage event value:', error);
    }
  };

  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
      if (this.listeners.get(key)?.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  private getStorage(): Storage | null {
    if (this.storage) return this.storage;

    if (typeof window === 'undefined') return null;

    try {
      this.storage = this.type === 'localStorage' ? window.localStorage : window.sessionStorage;
      return this.storage;
    } catch {
      return null;
    }
  }

  getItem<T>(key: string, defaultValue: T): T {
    const storage = this.getStorage();
    if (!storage) return defaultValue;

    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setItem(key: string, value: any): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      const stringValue = JSON.stringify(value);
      storage.setItem(key, stringValue);

      // Notify listeners of the change
      this.listeners.get(key)?.forEach(listener => listener(value));

      // If this is a theme change, update the DOM immediately
      if (key === 'settings') {
        const settings = value as Settings;
        const systemTheme = typeof window !== 'undefined' && 
          window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const effectiveTheme = settings.theme === 'system' ? systemTheme : settings.theme;
        
        // Update theme class and store current theme
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(effectiveTheme);
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        storage.setItem('current-theme', effectiveTheme);
      }
    } catch (error) {
      console.warn('Storage operation failed:', error);
    }
  }

  removeItem(key: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      storage.removeItem(key);
      // Notify listeners of the removal
      this.listeners.get(key)?.forEach(listener => listener(null));
    } catch (error) {
      console.warn('Storage operation failed:', error);
    }
  }

  cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    this.listeners.clear();
  }
}

const safeLocalStorage = new SafeStorage('localStorage');

// Initialize with test data if no tournaments exist
if (typeof window !== 'undefined') {
  const existingTournaments = safeLocalStorage.getItem<Tournament[]>('tournaments', []);
  if (existingTournaments.length === 0) {
    safeLocalStorage.setItem('tournaments', [testTournament]);
  }
}

export const storage = {
  getTournaments(): Tournament[] {
    return safeLocalStorage.getItem<Tournament[]>('tournaments', []);
  },

  getTournament(id: string): Tournament | undefined {
    const tournaments = this.getTournaments();
    return tournaments.find(t => t.id === id);
  },

  saveTournament(tournament: Tournament): void {
    const tournaments = this.getTournaments();
    const index = tournaments.findIndex(t => t.id === tournament.id);
    
    if (index >= 0) {
      tournaments[index] = tournament;
    } else {
      tournaments.push(tournament);
    }

    safeLocalStorage.setItem('tournaments', tournaments);
  },

  deleteTournament(id: string): void {
    const tournaments = this.getTournaments();
    const filtered = tournaments.filter(t => t.id !== id);
    safeLocalStorage.setItem('tournaments', filtered);
  },

  getSettings(): Settings {
    return safeLocalStorage.getItem<Settings>('settings', {
      lowMotion: false,
      theme: 'system',
      notifications: true
    });
  },

  saveSettings(settings: Settings): void {
    safeLocalStorage.setItem('settings', settings);
  },

  subscribeToSettings(callback: (settings: Settings) => void): () => void {
    return safeLocalStorage.subscribe('settings', callback);
  },

  cleanup(): void {
    safeLocalStorage.cleanup();
  }
};
