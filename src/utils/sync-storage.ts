import { SyncSession, SignalingMessage, SESSION_CLEANUP_INTERVAL, SESSION_EXPIRY, MESSAGE_EXPIRY } from '../types/sync';

const SYNC_SESSION_KEY = 'tournament_sync_sessions';

class SyncStorage {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastCleanup: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(this.cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL);
    }
  }

  private cleanupExpiredSessions = () => {
    // Prevent multiple cleanups from running simultaneously
    if (Date.now() - this.lastCleanup < SESSION_CLEANUP_INTERVAL) {
      return;
    }

    try {
      this.lastCleanup = Date.now();
      const sessions = this.getSessions();
      let hasChanges = false;

      Object.entries(sessions).forEach(([id, session]) => {
        // Keep messages for active sessions longer
        const messageExpiry = session.connectedPeers.length > 0 ? 
          MESSAGE_EXPIRY * 2 : // Double expiry time for active sessions
          MESSAGE_EXPIRY;

        // Only clean up messages that are definitely expired
        session.messages = session.messages.filter(msg => {
          const messageAge = Date.now() - new Date(msg.timestamp).getTime();
          return messageAge < messageExpiry;
        });

        // Only remove sessions that are:
        // 1. Inactive for longer than SESSION_EXPIRY
        // 2. Have no connected peers
        // 3. Have no pending messages
        const sessionAge = Date.now() - new Date(session.lastActive).getTime();
        if (sessionAge > SESSION_EXPIRY && 
            session.connectedPeers.length === 0 &&
            session.messages.length === 0) {
          delete sessions[id];
          hasChanges = true;
        } else if (session.messages.length !== sessions[id].messages.length) {
          // Update session if we cleaned up any messages
          sessions[id] = session;
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
    
    // Preserve existing messages and peers if session exists
    const existingSession = sessions[session.tournamentId];
    
    sessions[session.tournamentId] = {
      ...session,
      messages: existingSession?.messages || [],
      connectedPeers: existingSession?.connectedPeers || [],
      lastActive: new Date().toISOString()
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
      let filteredMessages = session.messages;

      // For offers and answers, only keep the most recent one between the same peers
      if (message.type === 'offer' || message.type === 'answer') {
        filteredMessages = session.messages.filter(msg => 
          !(msg.type === message.type && 
            msg.senderId === message.senderId &&
            msg.receiverId === message.receiverId)
        );
      }
      
      // Keep all recent ICE candidates
      const recentMessages = filteredMessages.filter(msg => {
        const messageAge = Date.now() - new Date(msg.timestamp).getTime();
        // Keep messages longer if there are connected peers
        const expiry = session.connectedPeers.length > 0 ? 
          MESSAGE_EXPIRY * 2 : MESSAGE_EXPIRY;
        return messageAge < expiry;
      });
      
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

    // Get messages intended for this receiver or broadcast messages
    // Sort by timestamp to ensure proper message ordering
    // Process offers before ICE candidates
    return session.messages
      .filter(msg => !msg.receiverId || msg.receiverId === receiverId)
      .sort((a, b) => {
        // Prioritize offers and answers over ICE candidates
        if (a.type === 'ice-candidate' && (b.type === 'offer' || b.type === 'answer')) return 1;
        if ((a.type === 'offer' || a.type === 'answer') && b.type === 'ice-candidate') return -1;
        // Then sort by timestamp
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
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

  addConnectedPeer(tournamentId: string, peerId: string): void {
    const sessions = this.getSessions();
    const session = sessions[tournamentId];
    
    if (session && !session.connectedPeers.includes(peerId)) {
      sessions[tournamentId] = {
        ...session,
        connectedPeers: [...session.connectedPeers, peerId],
        lastActive: new Date().toISOString()
      };
      
      this.saveSessions(sessions);
    }
  }

  removeConnectedPeer(tournamentId: string, peerId: string): void {
    const sessions = this.getSessions();
    const session = sessions[tournamentId];
    
    if (session) {
      sessions[tournamentId] = {
        ...session,
        connectedPeers: session.connectedPeers.filter(id => id !== peerId),
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
