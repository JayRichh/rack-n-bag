'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Tournament } from '../types/tournament';
import { SyncState } from '../types/sync';
import { RTCManager } from '../utils/rtc-manager';
import { syncStorage } from '../utils/sync-storage';
import { useToast } from './ToastContext';

interface SyncContextType {
  createSyncSession: () => Promise<void>;
  joinSyncSession: () => Promise<void>;
  broadcastUpdate: (tournament: Tournament) => void;
  cleanup: () => Promise<void>;
  isHost: boolean;
  syncState: SyncState;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ 
  children,
  tournamentId 
}: { 
  children: React.ReactNode;
  tournamentId: string;
}) {
  const { showToast } = useToast();
  const [rtcManager, setRtcManager] = useState<RTCManager | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'disconnected',
    connectedPeers: 0
  });

  const cleanup = useCallback(async () => {
    if (rtcManager) {
      await rtcManager.cleanup();
      setRtcManager(null);
    }
    setSyncState({
      status: 'disconnected',
      connectedPeers: 0
    });
    setIsHost(false);
  }, [rtcManager]);

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
    setSyncState(prev => {
      const newState = {
        ...prev,
        status,
        error,
        ...updates
      };

      // Update connected peers count from storage
      if (tournamentId) {
        const session = syncStorage.getSession(tournamentId);
        if (session) {
          newState.connectedPeers = session.connectedPeers.length;
        }
      }

      return newState;
    });

    if (error) {
      showToast(error, 'error');
      cleanup();
    }
  }, [tournamentId, cleanup, showToast]);

  const createSyncSession = useCallback(async () => {
    if (!tournamentId) return;

    try {
      await cleanup();

      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      // Create session in storage
      const session = {
        id: tournamentId,
        tournamentId,
        hostId: tournamentId,
        lastActive: new Date().toISOString(),
        messages: [],
        connectedPeers: []
      };
      syncStorage.createSession(session);

      // Create RTC manager
      const manager = new RTCManager(tournamentId, tournamentId, true);
      setRtcManager(manager);

      // Setup callbacks
      manager.onStateChange(handleStateChange);

      manager.onMessage((message: any) => {
        if (message.type === 'tournament-update') {
          setSyncState(prev => ({
            ...prev,
            lastSync: message.timestamp
          }));
        }
      });

      // Start connection
      await manager.connect();
      setIsHost(true);
      syncStorage.addConnectedPeer(tournamentId, tournamentId);
      showToast('Created sync session', 'success');

    } catch (error) {
      console.error('Failed to create sync session:', error);
      showToast('Failed to create sync session', 'error');
      cleanup();
    }
  }, [tournamentId, cleanup, handleStateChange, showToast]);

  const joinSyncSession = useCallback(async () => {
    if (!tournamentId) return;

    try {
      await cleanup();

      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      // Get existing session
      const session = syncStorage.getSession(tournamentId);
      if (!session?.hostId) {
        throw new Error('No active host session found');
      }

      const peerId = `peer-${Date.now()}`;

      // Create RTC manager
      const manager = new RTCManager(tournamentId, peerId, false);
      setRtcManager(manager);

      // Setup callbacks
      manager.onStateChange(handleStateChange);

      manager.onMessage((message: any) => {
        if (message.type === 'tournament-update') {
          setSyncState(prev => ({
            ...prev,
            lastSync: message.timestamp
          }));
        }
      });

      // Start connection
      await manager.connect();
      setIsHost(false);
      syncStorage.addConnectedPeer(tournamentId, peerId);
      showToast('Joined sync session', 'success');

    } catch (error) {
      console.error('Failed to join sync session:', error);
      showToast('Failed to join sync session', 'error');
      cleanup();
    }
  }, [tournamentId, cleanup, handleStateChange, showToast]);

  const broadcastUpdate = useCallback((tournament: Tournament) => {
    if (!tournamentId || !rtcManager) return;

    try {
      const message = {
        type: 'tournament-update' as const,
        data: tournament,
        senderId: tournamentId,
        timestamp: new Date().toISOString()
      };

      rtcManager.sendMessage(message);

      setSyncState(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to broadcast update:', error);
      showToast('Failed to send update', 'error');
    }
  }, [tournamentId, rtcManager, showToast]);

  const value = {
    createSyncSession,
    joinSyncSession,
    broadcastUpdate,
    cleanup,
    isHost,
    syncState
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}
