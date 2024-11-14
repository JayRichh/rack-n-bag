import React, { createContext, useContext, useEffect } from 'react';
import { Tournament } from '../types/tournament';
import { useTournamentSync } from '../hooks/useTournamentSync';

interface SyncContextType {
  createSyncSession: () => Promise<void>;
  joinSyncSession: () => Promise<void>;
  broadcastUpdate: (tournament: Tournament) => void;
  cleanup: () => void;
  isHost: boolean;
  syncState: {
    status: 'disconnected' | 'connecting' | 'connected' | 'host';
    connectedPeers: number;
    lastSync?: string;
    hostId?: string;
    error?: string;
  };
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ 
  children,
  tournamentId 
}: { 
  children: React.ReactNode;
  tournamentId: string;
}) {
  const sync = useTournamentSync(tournamentId);

  useEffect(() => {
    return () => {
      sync.cleanup();
    };
  }, [sync.cleanup]);

  return (
    <SyncContext.Provider value={sync}>
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
