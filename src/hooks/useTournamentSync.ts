import { useEffect, useRef, useState, useCallback } from 'react';
import { Tournament } from '../types/tournament';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastContext';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  id: string;
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

interface SyncMessage {
  type: 'tournament-update' | 'ping' | 'pong' | 'peer-list' | 'offer' | 'answer' | 'host-status';
  data: any;
  senderId: string;
  timestamp: string;
  version: number; // Added for message versioning
}

export interface SyncState {
  status: 'disconnected' | 'connecting' | 'connected' | 'host';
  connectedPeers: number;
  lastSync?: string;
  hostId?: string;
  error?: string;
}

const SYNC_VERSION = 1; // Added for compatibility checking
const PING_INTERVAL = 30000;
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 3;
const CONNECTION_TIMEOUT = 10000;

export function useTournamentSync(tournamentId?: string) {
  const { showToast } = useToast();
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'disconnected',
    connectedPeers: 0
  });
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const cleanupInProgressRef = useRef(false);

  // Validate tournament exists
  useEffect(() => {
    if (!tournamentId) return;
    
    const tournament = storage.getTournament(tournamentId);
    if (!tournament) {
      setSyncState(prev => ({
        ...prev,
        status: 'disconnected',
        error: 'Tournament not found'
      }));
      return;
    }
  }, [tournamentId]);

  // Initialize BroadcastChannel for tab sync
  useEffect(() => {
    if (!tournamentId) return;
    
    const channelId = `tournament-${tournamentId}`;
    broadcastChannelRef.current = new BroadcastChannel(channelId);
    
    broadcastChannelRef.current.onmessage = (event) => {
      if (event.data.type === 'tournament-update') {
        storage.saveTournament(event.data.tournament);
      }
    };
    
    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [tournamentId]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    try {
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(connectionTimeoutRef.current);
      
      peerConnectionsRef.current.forEach(peer => {
        peer.connection.close();
        peer.dataChannel.close();
      });
      peerConnectionsRef.current.clear();
      
      if (isHost && tournamentId) {
        storage.deleteSyncSession(tournamentId);
      }
      
      setSyncState({
        status: 'disconnected',
        connectedPeers: 0
      });
      setIsHost(false);
      setIsConnected(false);
      setReconnectAttempts(0);
    } finally {
      cleanupInProgressRef.current = false;
    }
  }, [isHost, tournamentId]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Save sync session state
  const saveSyncSession = useCallback((offer?: RTCSessionDescriptionInit) => {
    if (!tournamentId) return;
    
    try {
      const session: SyncSession = {
        id: tournamentId,
        isHost,
        peers: Array.from(peerConnectionsRef.current.keys()),
        tournamentId,
        lastActive: new Date().toISOString(),
        offer,
        hostId: isHost ? tournamentId : syncState.hostId
      };
      storage.saveSyncSession(session);
    } catch (error) {
      console.error('Failed to save sync session:', error);
    }
  }, [tournamentId, isHost, syncState.hostId]);

  // Setup ping interval
  useEffect(() => {
    if (!isConnected || peerConnectionsRef.current.size === 0) return;
    
    pingIntervalRef.current = setInterval(() => {
      const message: SyncMessage = {
        type: 'ping',
        data: null,
        senderId: tournamentId!,
        timestamp: new Date().toISOString(),
        version: SYNC_VERSION
      };
      
      peerConnectionsRef.current.forEach(peer => {
        if (peer.dataChannel.readyState === 'open') {
          peer.dataChannel.send(JSON.stringify(message));
        }
      });
    }, PING_INTERVAL);
    
    return () => clearInterval(pingIntervalRef.current);
  }, [isConnected, tournamentId]);

  // Handle connection state changes
  const updateConnectionState = useCallback(() => {
    const activeConnections = Array.from(peerConnectionsRef.current.values()).filter(
      peer => peer.dataChannel.readyState === 'open'
    );
    const hasActiveConnections = activeConnections.length > 0;
    
    if (hasActiveConnections) {
      clearTimeout(connectionTimeoutRef.current);
    }
    
    setIsConnected(hasActiveConnections);
    
    setSyncState(prev => ({
      ...prev,
      status: isHost ? 'host' : (hasActiveConnections ? 'connected' : 'disconnected'),
      connectedPeers: activeConnections.length,
      lastSync: new Date().toISOString(),
      error: undefined
    }));
    
    if (hasActiveConnections) {
      setReconnectAttempts(0);
      saveSyncSession();
    }
  }, [saveSyncSession, isHost]);

  // Setup data channel handlers
  const setupDataChannel = useCallback((dataChannel: RTCDataChannel, peerId: string) => {
    dataChannel.onopen = () => {
      const tournament = storage.getTournament(tournamentId!);
      if (tournament) {
        const message: SyncMessage = {
          type: 'tournament-update',
          data: tournament,
          senderId: tournamentId!,
          timestamp: new Date().toISOString(),
          version: SYNC_VERSION
        };
        dataChannel.send(JSON.stringify(message));
      }

      if (isHost) {
        const hostMessage: SyncMessage = {
          type: 'host-status',
          data: { hostId: tournamentId },
          senderId: tournamentId!,
          timestamp: new Date().toISOString(),
          version: SYNC_VERSION
        };
        dataChannel.send(JSON.stringify(hostMessage));
      }

      updateConnectionState();
    };
    
    dataChannel.onclose = updateConnectionState;
    dataChannel.onerror = (error) => {
      console.error('DataChannel error:', error);
      updateConnectionState();
    };
    
    dataChannel.onmessage = async (event) => {
      try {
        const message: SyncMessage = JSON.parse(event.data);
        
        // Version check
        if (message.version !== SYNC_VERSION) {
          console.warn('Incompatible sync version:', message.version);
          return;
        }

        switch (message.type) {
          case 'tournament-update':
            if (typeof message.data === 'object' && message.data !== null) {
              storage.saveTournament(message.data);
              setSyncState(prev => ({
                ...prev,
                lastSync: message.timestamp
              }));
            }
            break;
            
          case 'ping':
            const pongMessage: SyncMessage = {
              type: 'pong',
              data: null,
              senderId: tournamentId!,
              timestamp: new Date().toISOString(),
              version: SYNC_VERSION
            };
            dataChannel.send(JSON.stringify(pongMessage));
            break;
            
          case 'pong':
            saveSyncSession();
            break;
            
          case 'peer-list':
            if (Array.isArray(message.data)) {
              const missingPeers = message.data.filter(
                (id: string) => !peerConnectionsRef.current.has(id)
              );
              if (missingPeers.length > 0) {
                reconnectToPeers(missingPeers);
              }
            }
            break;

          case 'host-status':
            if (message.data?.hostId) {
              setSyncState(prev => ({
                ...prev,
                hostId: message.data.hostId
              }));
              const currentSession = storage.getSyncSession(tournamentId!);
              if (currentSession) {
                storage.saveSyncSession({
                  ...currentSession,
                  hostId: message.data.hostId
                });
              }
            }
            break;

          case 'offer':
          case 'answer':
            handleSignalingMessage(message, peerId, dataChannel);
            break;
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    };
  }, [tournamentId, isHost, updateConnectionState, saveSyncSession]);

  // Handle WebRTC signaling messages
  const handleSignalingMessage = useCallback(async (
    message: SyncMessage,
    peerId: string,
    dataChannel: RTCDataChannel
  ) => {
    try {
      const peer = peerConnectionsRef.current.get(peerId);
      if (!peer) return;

      if (message.type === 'offer' && !isHost) {
        const { sdp } = message.data;
        await peer.connection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        
        const answerMessage: SyncMessage = {
          type: 'answer',
          data: { sdp: answer.sdp },
          senderId: tournamentId!,
          timestamp: new Date().toISOString(),
          version: SYNC_VERSION
        };
        dataChannel.send(JSON.stringify(answerMessage));
      }
      
      if (message.type === 'answer' && isHost) {
        const { sdp } = message.data;
        await peer.connection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
        updateConnectionState();
      }
    } catch (error) {
      console.error('Failed to handle signaling message:', error);
    }
  }, [isHost, tournamentId, updateConnectionState]);

  // Reconnect to peers
  const reconnectToPeers = useCallback(async (peerIds: string[]) => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      showToast('Failed to reconnect after multiple attempts', 'error');
      cleanup();
      return;
    }

    setSyncState(prev => ({
      ...prev,
      status: 'connecting'
    }));

    try {
      for (const peerId of peerIds) {
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        const dataChannel = peerConnection.createDataChannel('tournamentSync');
        setupDataChannel(dataChannel, peerId);
        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        peerConnectionsRef.current.set(peerId, {
          connection: peerConnection,
          dataChannel,
          id: peerId
        });

        saveSyncSession(offer);
      }
      
      setReconnectAttempts(prev => prev + 1);
      updateConnectionState();
    } catch (error) {
      console.error('Failed to reconnect:', error);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectToPeers(peerIds);
      }, RECONNECT_INTERVAL);
    }
  }, [reconnectAttempts, updateConnectionState, showToast, saveSyncSession, setupDataChannel, cleanup]);

  // Create a new sync session
  const createSyncSession = useCallback(async () => {
    if (!tournamentId) return;
    
    try {
      cleanup();

      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      const sessionId = Math.random().toString(36).substring(2, 15);
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      const dataChannel = peerConnection.createDataChannel('tournamentSync');
      setupDataChannel(dataChannel, sessionId);
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      setIsHost(true);
      peerConnectionsRef.current.set(sessionId, {
        connection: peerConnection,
        dataChannel,
        id: sessionId
      });

      const session: SyncSession = {
        id: tournamentId,
        isHost: true,
        peers: [sessionId],
        tournamentId,
        lastActive: new Date().toISOString(),
        offer,
        hostId: tournamentId
      };
      storage.saveSyncSession(session);
      
      setSyncState(prev => ({
        ...prev,
        status: 'host',
        hostId: tournamentId
      }));

      connectionTimeoutRef.current = setTimeout(() => {
        if (syncState.status === 'connecting') {
          showToast('Failed to establish connection', 'error');
          cleanup();
        }
      }, CONNECTION_TIMEOUT);

      updateConnectionState();
      showToast('Creating sync session...', 'info');
    } catch (error) {
      console.error('Failed to create sync session:', error);
      showToast('Failed to create sync session', 'error');
      cleanup();
    }
  }, [tournamentId, cleanup, updateConnectionState, showToast, setupDataChannel, syncState.status]);

  // Join an existing sync session
  const joinSyncSession = useCallback(async () => {
    if (!tournamentId) return;
    
    try {
      cleanup();

      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      const session = storage.getSyncSession(tournamentId);
      
      if (!session?.offer || !session?.hostId || !session.isHost) {
        throw new Error('No active host session found');
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      peerConnection.ondatachannel = (event) => {
        setupDataChannel(event.channel, tournamentId);
      };
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(session.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      peerConnectionsRef.current.set(tournamentId, {
        connection: peerConnection,
        dataChannel: null as any,
        id: tournamentId
      });

      setIsHost(false);
      setSyncState(prev => ({
        ...prev,
        hostId: session.hostId
      }));
      
      const clientSession: SyncSession = {
        id: tournamentId,
        isHost: false,
        peers: [session.hostId],
        tournamentId,
        lastActive: new Date().toISOString(),
        hostId: session.hostId
      };
      storage.saveSyncSession(clientSession);

      connectionTimeoutRef.current = setTimeout(() => {
        if (syncState.status === 'connecting') {
          showToast('Failed to connect to host', 'error');
          cleanup();
        }
      }, CONNECTION_TIMEOUT);

      updateConnectionState();
      showToast('Connecting to sync session...', 'info');
    } catch (error) {
      console.error('Failed to join sync session:', error);
      showToast('Failed to join sync session. Make sure a host has created the session.', 'error');
      cleanup();
    }
  }, [tournamentId, cleanup, updateConnectionState, showToast, setupDataChannel, syncState.status]);

  // Broadcast tournament updates
  const broadcastUpdate = useCallback((tournament: Tournament) => {
    if (!tournamentId || !isConnected) return;

    try {
      // Broadcast to other tabs
      broadcastChannelRef.current?.postMessage({
        type: 'tournament-update',
        tournament
      });
      
      // Broadcast to connected peers
      const message: SyncMessage = {
        type: 'tournament-update',
        data: tournament,
        senderId: tournamentId,
        timestamp: new Date().toISOString(),
        version: SYNC_VERSION
      };
      
      peerConnectionsRef.current.forEach(({ dataChannel }) => {
        if (dataChannel.readyState === 'open') {
          dataChannel.send(JSON.stringify(message));
        }
      });

      setSyncState(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to broadcast update:', error);
    }
  }, [tournamentId, isConnected]);

  return {
    createSyncSession,
    joinSyncSession,
    broadcastUpdate,
    cleanup,
    isHost,
    isConnected,
    syncState
  };
}
