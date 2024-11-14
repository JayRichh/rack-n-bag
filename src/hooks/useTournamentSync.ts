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
}

export interface SyncState {
  status: 'disconnected' | 'connecting' | 'connected' | 'host';
  connectedPeers: number;
  lastSync?: string;
  hostId?: string;
}

const SYNC_STORAGE_KEY = 'tournament_sync_sessions';
const PING_INTERVAL = 30000; // 30 seconds
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 3;

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
  
  // Load existing sync session
  useEffect(() => {
    if (!tournamentId) return;
    
    try {
      const session = storage.getSyncSession(tournamentId);
      
      if (session && Date.now() - new Date(session.lastActive).getTime() < 24 * 60 * 60 * 1000) {
        setIsHost(session.isHost);
        setSyncState(prev => ({
          ...prev,
          status: session.isHost ? 'host' : 'connecting',
          hostId: session.hostId
        }));
        if (session.peers.length > 0) {
          reconnectToPeers(session.peers);
        }
      } else if (session) {
        // Clean up expired session
        storage.deleteSyncSession(tournamentId);
      }
    } catch (error) {
      console.error('Failed to load sync session:', error);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      peerConnectionsRef.current.forEach(peer => {
        peer.connection.close();
        peer.dataChannel.close();
      });
      peerConnectionsRef.current.clear();
      setSyncState({
        status: 'disconnected',
        connectedPeers: 0
      });
    };
  }, []);

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

  // Setup ping interval to keep connections alive
  useEffect(() => {
    if (!isConnected || peerConnectionsRef.current.size === 0) return;
    
    pingIntervalRef.current = setInterval(() => {
      const message: SyncMessage = {
        type: 'ping',
        data: null,
        senderId: tournamentId!,
        timestamp: new Date().toISOString()
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
    setIsConnected(hasActiveConnections);
    
    setSyncState(prev => ({
      ...prev,
      status: isHost ? 'host' : (hasActiveConnections ? 'connected' : 'disconnected'),
      connectedPeers: activeConnections.length,
      lastSync: new Date().toISOString()
    }));
    
    if (hasActiveConnections) {
      setReconnectAttempts(0);
      saveSyncSession();
    }
  }, [saveSyncSession, isHost]);

  // Reconnect to peers
  const reconnectToPeers = useCallback(async (peerIds: string[]) => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      showToast('Failed to reconnect after multiple attempts', 'error');
      setSyncState(prev => ({
        ...prev,
        status: 'disconnected',
        connectedPeers: 0
      }));
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

        // Store the offer for reconnection
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
  }, [reconnectAttempts, updateConnectionState, showToast, saveSyncSession]);

  // Setup data channel handlers
  const setupDataChannel = (dataChannel: RTCDataChannel, peerId: string) => {
    dataChannel.onopen = () => {
      // Send current tournament state when connected
      const tournament = storage.getTournament(tournamentId!);
      if (tournament) {
        const message: SyncMessage = {
          type: 'tournament-update',
          data: tournament,
          senderId: tournamentId!,
          timestamp: new Date().toISOString()
        };
        dataChannel.send(JSON.stringify(message));
      }

      // Send host status if we're the host
      if (isHost) {
        const hostMessage: SyncMessage = {
          type: 'host-status',
          data: { hostId: tournamentId },
          senderId: tournamentId!,
          timestamp: new Date().toISOString()
        };
        dataChannel.send(JSON.stringify(hostMessage));
      }

      updateConnectionState();
    };
    
    dataChannel.onclose = () => {
      updateConnectionState();
    };
    
    dataChannel.onerror = (error) => {
      console.error('DataChannel error:', error);
      updateConnectionState();
    };
    
    dataChannel.onmessage = async (event) => {
      try {
        const message: SyncMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'tournament-update':
            storage.saveTournament(message.data);
            setSyncState(prev => ({
              ...prev,
              lastSync: message.timestamp
            }));
            break;
            
          case 'ping':
            // Respond to ping with pong
            const pongMessage: SyncMessage = {
              type: 'pong',
              data: null,
              senderId: tournamentId!,
              timestamp: new Date().toISOString()
            };
            dataChannel.send(JSON.stringify(pongMessage));
            break;
            
          case 'pong':
            // Update last active timestamp
            saveSyncSession();
            break;
            
          case 'peer-list':
            // Update peer list if we're missing any connections
            const missingPeers = message.data.filter(
              (id: string) => !peerConnectionsRef.current.has(id)
            );
            if (missingPeers.length > 0) {
              reconnectToPeers(missingPeers);
            }
            break;

          case 'host-status':
            // Update host ID in state
            setSyncState(prev => ({
              ...prev,
              hostId: message.data.hostId
            }));
            break;

          case 'offer':
            // Handle incoming offer
            if (!isHost) {
              const { sdp } = message.data;
              const peer = peerConnectionsRef.current.get(peerId);
              if (peer) {
                await peer.connection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
                const answer = await peer.connection.createAnswer();
                await peer.connection.setLocalDescription(answer);
                
                // Send answer back
                const answerMessage: SyncMessage = {
                  type: 'answer',
                  data: { sdp: answer.sdp },
                  senderId: tournamentId!,
                  timestamp: new Date().toISOString()
                };
                dataChannel.send(JSON.stringify(answerMessage));
              }
            }
            break;

          case 'answer':
            // Handle incoming answer
            if (isHost) {
              const { sdp } = message.data;
              const peer = peerConnectionsRef.current.get(peerId);
              if (peer) {
                await peer.connection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
                updateConnectionState();
              }
            }
            break;
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    };
  };

  // Create a new sync session
  const createSyncSession = async () => {
    if (!tournamentId) return;
    
    try {
      // First, cleanup any existing session
      storage.deleteSyncSession(tournamentId);
      peerConnectionsRef.current.forEach(peer => {
        peer.connection.close();
        peer.dataChannel.close();
      });
      peerConnectionsRef.current.clear();

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

      // Store the session with the offer
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

      updateConnectionState();
      showToast('Sync session created! Share the tournament ID with others to sync.', 'success');
    } catch (error) {
      console.error('Failed to create sync session:', error);
      showToast('Failed to create sync session.', 'error');
      setSyncState(prev => ({
        ...prev,
        status: 'disconnected'
      }));
    }
  };

  // Join an existing sync session
  const joinSyncSession = async () => {
    if (!tournamentId) return;
    
    try {
      setSyncState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      // Get the host's session info
      const session = storage.getSyncSession(tournamentId);
      
      if (!session?.offer || !session?.hostId || !session.isHost) {
        throw new Error('No active host session found');
      }

      // First, cleanup any existing connections
      peerConnectionsRef.current.forEach(peer => {
        peer.connection.close();
        peer.dataChannel.close();
      });
      peerConnectionsRef.current.clear();

      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      peerConnection.ondatachannel = (event) => {
        setupDataChannel(event.channel, tournamentId);
      };
      
      // Set the host's offer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(session.offer));
      
      // Create and set answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      peerConnectionsRef.current.set(tournamentId, {
        connection: peerConnection,
        dataChannel: null as any, // Will be set in ondatachannel
        id: tournamentId
      });

      setIsHost(false);
      setSyncState(prev => ({
        ...prev,
        hostId: session.hostId
      }));
      
      // Save our session state
      const clientSession: SyncSession = {
        id: tournamentId,
        isHost: false,
        peers: [session.hostId],
        tournamentId,
        lastActive: new Date().toISOString(),
        hostId: session.hostId
      };
      storage.saveSyncSession(clientSession);

      updateConnectionState();
      showToast('Successfully joined sync session!', 'success');
    } catch (error) {
      console.error('Failed to join sync session:', error);
      showToast('Failed to join sync session. Make sure a host has created the session.', 'error');
      setSyncState(prev => ({
        ...prev,
        status: 'disconnected'
      }));
    }
  };

  // Broadcast tournament updates
  const broadcastUpdate = (tournament: Tournament) => {
    // Broadcast to other tabs
    broadcastChannelRef.current?.postMessage({
      type: 'tournament-update',
      tournament
    });
    
    // Broadcast to connected peers
    const message: SyncMessage = {
      type: 'tournament-update',
      data: tournament,
      senderId: tournamentId!,
      timestamp: new Date().toISOString()
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
  };

  return {
    createSyncSession,
    joinSyncSession,
    broadcastUpdate,
    isHost,
    isConnected,
    syncState
  };
}
