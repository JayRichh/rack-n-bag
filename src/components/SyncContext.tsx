'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Tournament } from '../types/tournament';
import { SyncState } from '../types/sync';
import { useToast } from './ToastContext';
import { useSyncSession } from '../hooks/useSyncSession';

interface SyncContextType {
  createSyncSession: () => Promise<void>;
  joinSyncSession: () => Promise<void>;
  broadcastUpdate: (tournament: Tournament) => void;
  cleanup: () => Promise<void>;
  isHost: boolean;
  syncState: SyncState;
}

const SyncContext = createContext<SyncContextType | null>(null);

const SYNC_STATE_KEY = 'tournament_sync_state';

export function SyncProvider({ 
  children,
  tournamentId 
}: { 
  children: React.ReactNode;
  tournamentId: string;
}) {
  const { showToast } = useToast();
  const [syncState, setSyncState] = useState<SyncState>(() => {
    // Try to restore previous sync state
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SYNC_STATE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only restore if it's for the same tournament
          if (parsed.tournamentId === tournamentId) {
            return parsed.state;
          }
        }
      } catch (error) {
        console.error('Failed to restore sync state:', error);
      }
    }
    return {
      status: 'disconnected',
      connectedPeers: 0
    };
  });

  // Save sync state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SYNC_STATE_KEY, JSON.stringify({
          tournamentId,
          state: syncState
        }));
      } catch (error) {
        console.error('Failed to save sync state:', error);
      }
    }
  }, [tournamentId, syncState]);

  const handleStateChange = useCallback((newState: SyncState) => {
    setSyncState(newState);
  }, []);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'tournament-update') {
      setSyncState(prev => ({
        ...prev,
        lastSync: message.timestamp
      }));
    }
  }, []);

  const handleError = useCallback((error: string) => {
    showToast(error, 'error');
  }, [showToast]);

  const {
    createSession,
    joinSession,
    sendMessage,
    cleanup,
    isHost,
    isConnected
  } = useSyncSession({
    tournamentId,
    onStateChange: handleStateChange,
    onMessage: handleMessage,
    onError: handleError
  });

  const createSyncSession = useCallback(async () => {
    try {
      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      await createSession();
      showToast('Created sync session', 'success');
    } catch (error) {
      console.error('Failed to create sync session:', error);
      showToast('Failed to create sync session', 'error');
    }
  }, [createSession, showToast]);

  const joinSyncSession = useCallback(async () => {
    try {
      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      await joinSession();
      showToast('Joined sync session', 'success');
    } catch (error) {
      console.error('Failed to join sync session:', error);
      showToast('Failed to join sync session', 'error');
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    }
  }, [joinSession, showToast]);

  const broadcastUpdate = useCallback((tournament: Tournament) => {
    if (!isConnected) return;

    try {
      sendMessage({
        type: 'tournament-update',
        data: tournament,
        senderId: tournamentId,
        timestamp: new Date().toISOString()
      });

      setSyncState(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to broadcast update:', error);
      showToast('Failed to send update', 'error');
    }
  }, [tournamentId, isConnected, sendMessage, showToast]);

  // Auto-reconnect on page visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && syncState.status === 'disconnected') {
        // Try to reconnect using the previous role
        try {
          if (isHost) {
            await createSession();
          } else {
            await joinSession();
          }
        } catch (error) {
          console.error('Auto-reconnect failed:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncState.status, isHost, createSession, joinSession]);

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
