import { 
  SyncSession, 
  SignalingMessage, 
  SESSION_CLEANUP_INTERVAL, 
  SESSION_EXPIRY, 
  MESSAGE_EXPIRY,
  HOST_TIMEOUT,
  SYNC_STORAGE_KEYS,
  SYNC_VERSION
} from '../types/sync';

class SyncStorage {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastCleanup: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(this.cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL);
    }
  }

  private cleanupExpiredSessions = () => {
    if (Date.now() - this.lastCleanup < SESSION_CLEANUP_INTERVAL) {
      return;
    }

    try {
      this.lastCleanup = Date.now();
      const sessions = this.getSessions();
      let hasChanges = false;

      Object.entries(sessions).forEach(([id, session]) => {
        // Check host status
        const hostLastPing = new Date(session.metadata.lastHostPing).getTime();
        const isHostActive = Date.now() - hostLastPing < HOST_TIMEOUT;
        
        if (session.hostStatus === 'active' && !isHostActive) {
          session.hostStatus = 'inactive';
          hasChanges = true;
        }

        // Clean up messages based on session activity
        const messageExpiry = session.hostStatus === 'active' ? MESSAGE_EXPIRY * 2 : MESSAGE_EXPIRY;
        session.messages = session.messages.filter(msg => {
          const messageAge = Date.now() - new Date(msg.timestamp).getTime();
          return messageAge < messageExpiry;
        });

        // Only remove sessions that are:
        // 1. Inactive for longer than SESSION_EXPIRY
        // 2. Have no connected peers
        // 3. Host is inactive
        // 4. Have no pending messages
        const sessionAge = Date.now() - new Date(session.lastActive).getTime();
        if (sessionAge > SESSION_EXPIRY && 
            session.connectedPeers.length === 0 &&
            session.hostStatus === 'inactive' &&
            session.messages.length === 0) {
          delete sessions[id];
          hasChanges = true;
        } else if (session !== sessions[id]) {
          // Update session if it was modified
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
      const sessionsJson = localStorage.getItem(SYNC_STORAGE_KEYS.SESSIONS);
      return sessionsJson ? JSON.parse(sessionsJson) : {};
    } catch (error) {
      console.error('Failed to get sync sessions:', error);
      return {};
    }
  }

  private saveSessions(sessions: Record<string, SyncSession>): void {
    try {
      localStorage.setItem(SYNC_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sync sessions:', error);
    }
  }

  getSession(tournamentId: string): SyncSession | undefined {
    const sessions = this.getSessions();
    const session = sessions[tournamentId];
    
    // Verify session is valid and host is active
    if (session) {
      const hostLastPing = new Date(session.metadata.lastHostPing).getTime();
      const isHostActive = Date.now() - hostLastPing < HOST_TIMEOUT;
      
      if (!isHostActive) {
        session.hostStatus = 'inactive';
        sessions[tournamentId] = session;
        this.saveSessions(sessions);
      }
    }
    
    return session;
  }

  createSession(session: SyncSession): void {
    const sessions = this.getSessions();
    
    // Preserve existing messages and peers if session exists
    const existingSession = sessions[session.tournamentId];
    
    sessions[session.tournamentId] = {
      ...session,
      messages: existingSession?.messages || [],
      connectedPeers: existingSession?.connectedPeers || [],
      lastActive: new Date().toISOString(),
      hostStatus: 'active',
      metadata: {
        ...session.metadata,
        lastHostPing: new Date().toISOString()
      }
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
      
      // Keep messages based on session activity
      const messageExpiry = session.hostStatus === 'active' ? MESSAGE_EXPIRY * 2 : MESSAGE_EXPIRY;
      const recentMessages = filteredMessages.filter(msg => {
        const messageAge = Date.now() - new Date(msg.timestamp).getTime();
        return messageAge < messageExpiry;
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
    if (!session || session.hostStatus !== 'active') return [];

    // Get messages intended for this receiver or broadcast messages
    // Sort by timestamp to ensure proper message ordering
    // Process offers and answers before ICE candidates
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
