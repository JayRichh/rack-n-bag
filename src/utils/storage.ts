import { Tournament } from '../types/tournament';
import { testTournaments } from './test-data';

type StorageType = 'localStorage' | 'sessionStorage';

interface Settings {
  lowMotion: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

interface SyncSession {
  id: string;
  isHost: boolean;
  peers: string[];
  tournamentId: string;
  lastActive: string;
  offer?: RTCSessionDescriptionInit;
  hostId?: string;
}

class SafeStorage {
  private storage: Storage | null = null;
  private type: StorageType;
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  constructor(type: StorageType) {
    this.type = type;
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
      setInterval(this.cleanupExpiredSessions, 60000);
    }
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (!event.key || event.storageArea !== this.getStorage()) return;

    try {
      const newValue = event.newValue ? JSON.parse(event.newValue) : null;
      this.listeners.get(event.key)?.forEach(listener => listener(newValue));
    } catch (error) {
      console.warn('Failed to parse storage event value:', error);
    }
  };

  private cleanupExpiredSessions = () => {
    try {
      const sessions = this.getItem<Record<string, SyncSession>>('tournament_sync_sessions', {});
      let hasChanges = false;

      Object.entries(sessions).forEach(([id, session]) => {
        if (Date.now() - new Date(session.lastActive).getTime() > 5 * 60 * 1000) {
          delete sessions[id];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.setItem('tournament_sync_sessions', sessions);
      }
    } catch (error) {
      console.warn('Failed to cleanup expired sessions:', error);
    }
  };

  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

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
      this.listeners.get(key)?.forEach(listener => listener(value));

      if (key === 'settings') {
        const settings = value as Settings;
        const systemTheme = typeof window !== 'undefined' && 
          window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const effectiveTheme = settings.theme === 'system' ? systemTheme : settings.theme;
        
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

if (typeof window !== 'undefined') {
  const existingTournaments = safeLocalStorage.getItem<Tournament[]>('tournaments', []);
  if (existingTournaments.length === 0) {
    const defaultTournaments = Object.values(testTournaments);
    safeLocalStorage.setItem('tournaments', defaultTournaments);
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

    const sessions = this.getSyncSessions();
    if (sessions[id]) {
      delete sessions[id];
      this.saveSyncSessions(sessions);
    }
  },

  resetToDefaults(): void {
    const defaultTournaments = Object.values(testTournaments);
    safeLocalStorage.setItem('tournaments', defaultTournaments);
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

  getSyncSessions(): Record<string, SyncSession> {
    return safeLocalStorage.getItem<Record<string, SyncSession>>('tournament_sync_sessions', {});
  },

  saveSyncSessions(sessions: Record<string, SyncSession>): void {
    safeLocalStorage.setItem('tournament_sync_sessions', sessions);
  },

  getSyncSession(tournamentId: string): SyncSession | undefined {
    const sessions = this.getSyncSessions();
    return sessions[tournamentId];
  },

  saveSyncSession(session: SyncSession): void {
    const sessions = this.getSyncSessions();
    sessions[session.tournamentId] = session;
    this.saveSyncSessions(sessions);
  },

  deleteSyncSession(tournamentId: string): void {
    const sessions = this.getSyncSessions();
    delete sessions[tournamentId];
    this.saveSyncSessions(sessions);
  },

  subscribeToSettings(callback: (settings: Settings) => void): () => void {
    return safeLocalStorage.subscribe('settings', callback);
  },

  subscribeToSyncSessions(callback: (sessions: Record<string, SyncSession>) => void): () => void {
    return safeLocalStorage.subscribe('tournament_sync_sessions', callback);
  },

  cleanup(): void {
    safeLocalStorage.cleanup();
  }
};
