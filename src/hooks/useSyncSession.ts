import { useState, useCallback, useEffect } from 'react';
import { RTCManager } from '../utils/rtc-manager';
import { syncStorage } from '../utils/sync-storage';
import { SyncState, SYNC_VERSION, SYNC_STORAGE_KEYS } from '../types/sync';

const RECONNECT_DELAYS = [2000, 5000, 10000, 30000]; // Increasing backoff delays

interface UseSyncSessionOptions {
  tournamentId: string;
  onStateChange?: (state: SyncState) => void;
  onMessage?: (message: any) => void;
  onError?: (error: string) => void;
}

export function useSyncSession({
  tournamentId,
  onStateChange,
  onMessage,
  onError
}: UseSyncSessionOptions) {
  const [rtcManager, setRtcManager] = useState<RTCManager | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [reconnectTimeout, setReconnectTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get or generate persistent peer ID
  const getPeerId = useCallback(() => {
    if (typeof window === 'undefined') return '';

    let peerId = localStorage.getItem(SYNC_STORAGE_KEYS.PEER_ID);
    if (!peerId) {
      peerId = `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SYNC_STORAGE_KEYS.PEER_ID, peerId);
    }
    return peerId;
  }, []);

  const cleanup = useCallback(async () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      setReconnectTimeout(null);
    }
    if (rtcManager) {
      await rtcManager.cleanup();
      setRtcManager(null);
    }
    setIsHost(false);
    setReconnectAttempt(0);
  }, [rtcManager, reconnectTimeout]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleStateChange = useCallback((
    status: SyncState['status'],
    error?: string,
    updates: Partial<SyncState> = {}
  ) => {
    const newState: SyncState = {
      status,
      connectedPeers: 0,
      ...updates,
      metadata: {
        sessionId: tournamentId,
        peerId: getPeerId(),
        role: isHost ? 'host' : 'peer',
        lastActive: new Date().toISOString()
      }
    };

    if (error) {
      newState.error = error;
      onError?.(error);

      // Attempt reconnection if disconnected
      if (status === 'disconnected' && reconnectAttempt < RECONNECT_DELAYS.length) {
        const delay = RECONNECT_DELAYS[reconnectAttempt];
        const timeout = setTimeout(async () => {
          try {
            if (isHost) {
              await createSession();
            } else {
              await joinSession();
            }
          } catch (err) {
            console.error('Reconnection failed:', err);
          }
        }, delay);
        
        setReconnectTimeout(timeout);
        setReconnectAttempt(prev => prev + 1);
      }
    } else {
      // Reset reconnection attempt on successful connection
      if (status === 'connected' || status === 'host') {
        setReconnectAttempt(0);
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          setReconnectTimeout(null);
        }
      }
    }

    // Update connected peers count from storage
    const session = syncStorage.getSession(tournamentId);
    if (session) {
      newState.connectedPeers = session.connectedPeers.length;
      newState.hostId = session.hostId;
    }

    onStateChange?.(newState);
  }, [tournamentId, reconnectAttempt, isHost, reconnectTimeout, onStateChange, onError, getPeerId]);

  const createSession = useCallback(async () => {
    if (!tournamentId) return;

    try {
      await cleanup();

      // Create RTC manager
      const peerId = getPeerId();
      const manager = new RTCManager(tournamentId, peerId, true);
      setRtcManager(manager);
      setIsHost(true);

      // Setup callbacks
      manager.onStateChange(handleStateChange);
      manager.onMessage(onMessage || (() => {}));

      // Start connection
      await manager.connect();

      return manager;
    } catch (error) {
      console.error('Failed to create sync session:', error);
      throw error;
    }
  }, [tournamentId, cleanup, handleStateChange, onMessage, getPeerId]);

  const joinSession = useCallback(async () => {
    if (!tournamentId) return;

    try {
      await cleanup();

      // Get existing session
      const session = syncStorage.getSession(tournamentId);
      if (!session?.hostId || session.hostStatus !== 'active') {
        throw new Error('No active host session found');
      }

      // Create RTC manager
      const peerId = getPeerId();
      const manager = new RTCManager(tournamentId, peerId, false);
      setRtcManager(manager);
      setIsHost(false);

      // Setup callbacks
      manager.onStateChange(handleStateChange);
      manager.onMessage(onMessage || (() => {}));

      // Start connection
      await manager.connect();

      return manager;
    } catch (error) {
      console.error('Failed to join sync session:', error);
      throw error;
    }
  }, [tournamentId, cleanup, handleStateChange, onMessage, getPeerId]);

  const sendMessage = useCallback((message: any) => {
    if (!rtcManager) return;
    
    try {
      rtcManager.sendMessage({
        ...message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      onError?.('Failed to send message');
    }
  }, [rtcManager, onError]);

  return {
    createSession,
    joinSession,
    sendMessage,
    cleanup,
    isHost,
    isConnected: rtcManager !== null && 
      (rtcManager.getConnectionState() === 'connected' || 
       rtcManager.getConnectionState() === 'host')
  };
}
