import { SyncSession, SignalingMessage } from '../types/sync';

const SYNC_SESSION_KEY = 'tournament_sync_sessions';
const SESSION_CLEANUP_INTERVAL = 60000; // 1 minute
const SESSION_EXPIRY = 5 * 60 * 1000; // 5 minutes

class SyncStorage {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(this.cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL);
    }
  }

  private cleanupExpiredSessions = () => {
    try {
      const sessions = this.getSessions();
      let hasChanges = false;

      Object.entries(sessions).forEach(([id, session]) => {
        if (Date.now() - new Date(session.lastActive).getTime() > SESSION_EXPIRY) {
          delete sessions[id];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.saveSessions(sessions);
      }
    } catch (error) {
      console.warn('Failed to cleanup expired sessions:', error);
    }
  };

  private getSessions(): Record<string, SyncSession> {
    try {
      const sessionsJson = localStorage.getItem(SYNC_SESSION_KEY);
      return sessionsJson ? JSON.parse(sessionsJson) : {};
    } catch (error) {
      console.error('Failed to get sync sessions:', error);
      return {};
    }
  }

  private saveSessions(sessions: Record<string, SyncSession>): void {
    try {
      localStorage.setItem(SYNC_SESSION_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sync sessions:', error);
    }
  }

  getSession(tournamentId: string): SyncSession | undefined {
    const sessions = this.getSessions();
    return sessions[tournamentId];
  }

  createSession(session: SyncSession): void {
    const sessions = this.getSessions();
    sessions[session.tournamentId] = {
      ...session,
      messages: [],
      connectedPeers: []
    };
    this.saveSessions(sessions);
  }

  updateSession(tournamentId: string, updates: Partial<SyncSession>): void {
    const sessions = this.getSessions();
    if (sessions[tournamentId]) {
      sessions[tournamentId] = {
        ...sessions[tournamentId],
        ...updates,
        lastActive: new Date().toISOString()
      };
      this.saveSessions(sessions);
    }
  }

  addSignalingMessage(tournamentId: string, message: SignalingMessage): void {
    const sessions = this.getSessions();
    const session = sessions[tournamentId];
    
    if (session) {
      // Keep only recent messages (last 30 seconds)
      const recentMessages = session.messages.filter(msg => 
        Date.now() - new Date(msg.timestamp).getTime() < 30000
      );
      
      sessions[tournamentId] = {
        ...session,
        messages: [...recentMessages, message],
        lastActive: new Date().toISOString()
      };
      
      this.saveSessions(sessions);
    }
  }

  getSignalingMessages(tournamentId: string, receiverId: string): SignalingMessage[] {
    const session = this.getSession(tournamentId);
    if (!session) return [];

    // Get messages intended for this receiver
    return session.messages.filter(msg => 
      !msg.receiverId || msg.receiverId === receiverId
    );
  }

  removeSignalingMessage(tournamentId: string, messageTimestamp: string): void {
    const sessions = this.getSessions();
    const session = sessions[tournamentId];
    
    if (session) {
      sessions[tournamentId] = {
        ...session,
        messages: session.messages.filter(msg => msg.timestamp !== messageTimestamp),
        lastActive: new Date().toISOString()
      };
      
      this.saveSessions(sessions);
    }
  }

  deleteSession(tournamentId: string): void {
    const sessions = this.getSessions();
    delete sessions[tournamentId];
    this.saveSessions(sessions);
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const syncStorage = new SyncStorage();
