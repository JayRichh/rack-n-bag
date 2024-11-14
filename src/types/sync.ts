export type SignalingMessage = {
  type: 'offer' | 'answer' | 'ice-candidate' | 'renegotiate' | 'ready';
  senderId: string;
  receiverId?: string;
  timestamp: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit | { ready: boolean };
};

export interface SyncSession {
  id: string;
  tournamentId: string;
  hostId: string;
  lastActive: string;
  messages: SignalingMessage[];
  connectedPeers: string[];
  hostStatus: 'active' | 'inactive' | 'ready';
  metadata: {
    version: number;
    created: string;
    lastHostPing: string;
    readyForConnections?: boolean;
  };
}

export interface SyncState {
  status: 'disconnected' | 'connecting' | 'connected' | 'host' | 'awaiting_connections';
  connectedPeers: number;
  lastSync?: string;
  hostId?: string;
  error?: string;
  iceGatheringState?: RTCIceGatheringState;
  iceConnectionState?: RTCIceConnectionState;
  signalingState?: RTCSignalingState;
  reconnectAttempts?: number;
  metadata?: {
    sessionId: string;
    peerId: string;
    role: 'host' | 'peer';
    lastActive: string;
  };
}

export interface SyncMessage {
  type: 'tournament-update' | 'ping' | 'pong' | 'health-check';
  data: any;
  senderId: string;
  timestamp: string;
  version: number;
}

export interface RTCConfiguration {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
  iceCandidatePoolSize?: number;
}

export interface DataChannelConfig {
  ordered?: boolean;
  maxPacketLifeTime?: number;
  maxRetransmits?: number;
  protocol?: string;
  negotiated?: boolean;
  id?: number;
  priority?: RTCPriorityType;
}

export const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: [
        'stun:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceCandidatePoolSize: 10
};

export const DEFAULT_CHANNEL_CONFIG: DataChannelConfig = {
  ordered: true,
  maxRetransmits: 3,
  protocol: 'json',
  negotiated: false,
  priority: 'high'
};

export const SYNC_VERSION = 1;

// Increased timeouts and intervals
export const CONNECTION_TIMEOUT = 45000;        // 45 seconds
export const SIGNALING_CHECK_INTERVAL = 1000;   // 1 second
export const PING_INTERVAL = 5000;             // 5 seconds
export const HEALTH_CHECK_INTERVAL = 2000;      // 2 seconds
export const SESSION_CLEANUP_INTERVAL = 60000;  // 1 minute
export const SESSION_EXPIRY = 5 * 60 * 1000;   // 5 minutes
export const MESSAGE_EXPIRY = 45000;           // 45 seconds
export const RECONNECT_DELAY = 2000;           // 2 seconds
export const MAX_RECONNECT_ATTEMPTS = 3;       // Maximum number of reconnection attempts
export const HOST_PING_INTERVAL = 10000;       // 10 seconds
export const HOST_TIMEOUT = 45000;             // 45 seconds without ping = inactive host
export const MAX_MESSAGE_SIZE = 16384;         // 16KB max message size
export const ICE_GATHERING_TIMEOUT = 20000;    // Increased to 20 seconds
export const SIGNALING_TIMEOUT = 30000;        // Increased to 30 seconds
export const MAX_BUFFERED_MESSAGES = 100;      // Maximum number of messages to buffer
export const HOST_READY_TIMEOUT = 10000;       // 10 seconds to wait for host ready state

export const SYNC_STORAGE_KEYS = {
  SESSIONS: 'tournament_sync_sessions',
  STATE: 'tournament_sync_state',
  PEER_ID: 'tournament_sync_peer_id'
} as const;
