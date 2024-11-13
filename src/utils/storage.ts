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

  constructor(type: StorageType) {
    this.type = type;
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
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle storage errors (e.g., quota exceeded)
      console.warn('Storage operation failed');
    }
  }

  removeItem(key: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      storage.removeItem(key);
    } catch {
      console.warn('Storage operation failed');
    }
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
  }
};
