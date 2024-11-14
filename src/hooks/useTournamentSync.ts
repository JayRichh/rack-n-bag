import { useEffect, useRef, useState, useCallback } from 'react';
import { Tournament } from '../types/tournament';
import { SyncState, SyncMessage, SyncSession, SYNC_VERSION } from '../types/sync';
import { syncStorage } from '../utils/sync-storage';
import { RTCManager } from '../utils/rtc-manager';
import { useToast } from '../components/ToastContext';

export function useTournamentSync(tournamentId?: string) {
  const { showToast } = useToast();
  const [isHost, setIsHost] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'disconnected',
    connectedPeers: 0
  });

  const rtcManagerRef = useRef<RTCManager | null>(null);
  const isCleaningUpRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    try {
      if (rtcManagerRef.current) {
        rtcManagerRef.current.cleanup();
        rtcManagerRef.current = null;
      }

      setSyncState({
        status: 'disconnected',
        connectedPeers: 0
      });
      setIsHost(false);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Create a new sync session
  const createSyncSession = useCallback(async () => {
    if (!tournamentId) return;

    try {
      cleanup();

      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      // Create session in storage
      const session: SyncSession = {
        id: tournamentId,
        tournamentId,
        hostId: tournamentId,
        lastActive: new Date().toISOString(),
        messages: [],
        connectedPeers: []
      };
      syncStorage.createSession(session);

      // Create RTC manager
      const rtcManager = new RTCManager(tournamentId, tournamentId, true);
      rtcManagerRef.current = rtcManager;

      // Setup callbacks
      rtcManager.onStateChange((status, error, updates = {}) => {
        setSyncState(prev => ({
          ...prev,
          status,
          error,
          ...updates,
          connectedPeers: status === 'connected' || status === 'host' ? 1 : 0
        }));

        if (error) {
          showToast(error, 'error');
          cleanup();
        }
      });

      rtcManager.onMessage((message: SyncMessage) => {
        if (message.version !== SYNC_VERSION) {
          console.warn('Incompatible sync version:', message.version);
          return;
        }

        if (message.type === 'tournament-update') {
          setSyncState(prev => ({
            ...prev,
            lastSync: message.timestamp
          }));
        }
      });

      // Start connection
      await rtcManager.connect();
      setIsHost(true);
      showToast('Created sync session', 'success');

    } catch (error) {
      console.error('Failed to create sync session:', error);
      showToast('Failed to create sync session', 'error');
      cleanup();
    }
  }, [tournamentId, cleanup, showToast]);

  // Join an existing sync session
  const joinSyncSession = useCallback(async () => {
    if (!tournamentId) return;

    try {
      cleanup();

      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      // Get existing session
      const session = syncStorage.getSession(tournamentId);
      if (!session?.hostId) {
        throw new Error('No active host session found');
      }

      // Create RTC manager
      const rtcManager = new RTCManager(tournamentId, `peer-${Date.now()}`, false);
      rtcManagerRef.current = rtcManager;

      // Setup callbacks
      rtcManager.onStateChange((status, error, updates = {}) => {
        setSyncState(prev => ({
          ...prev,
          status,
          error,
          ...updates,
          connectedPeers: status === 'connected' || status === 'host' ? 1 : 0
        }));

        if (error) {
          showToast(error, 'error');
          cleanup();
        }
      });

      rtcManager.onMessage((message: SyncMessage) => {
        if (message.version !== SYNC_VERSION) {
          console.warn('Incompatible sync version:', message.version);
          return;
        }

        if (message.type === 'tournament-update') {
          setSyncState(prev => ({
            ...prev,
            lastSync: message.timestamp
          }));
        }
      });

      // Start connection
      await rtcManager.connect();
      setIsHost(false);
      showToast('Joined sync session', 'success');

    } catch (error) {
      console.error('Failed to join sync session:', error);
      showToast('Failed to join sync session', 'error');
      cleanup();
    }
  }, [tournamentId, cleanup, showToast]);

  // Broadcast tournament updates
  const broadcastUpdate = useCallback((tournament: Tournament) => {
    if (!tournamentId || !rtcManagerRef.current) return;

    try {
      const message = {
        type: 'tournament-update' as const,
        data: tournament,
        senderId: tournamentId,
        timestamp: new Date().toISOString()
      };

      rtcManagerRef.current.sendMessage(message);

      setSyncState(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to broadcast update:', error);
    }
  }, [tournamentId]);

  return {
    createSyncSession,
    joinSyncSession,
    broadcastUpdate,
    cleanup,
    isHost,
    syncState
  };
}
