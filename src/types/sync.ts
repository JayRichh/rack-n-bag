export type SignalingMessage = {
  type: 'offer' | 'answer' | 'ice-candidate' | 'renegotiate';
  senderId: string;
  receiverId?: string;
  timestamp: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

export interface SyncSession {
  id: string;
  tournamentId: string;
  hostId: string;
  lastActive: string;
  messages: SignalingMessage[];
  connectedPeers: string[];
}

export interface SyncState {
  status: 'disconnected' | 'connecting' | 'connected' | 'host';
  connectedPeers: number;
  lastSync?: string;
  hostId?: string;
  error?: string;
  iceGatheringState?: RTCIceGatheringState;
  iceConnectionState?: RTCIceConnectionState;
  signalingState?: RTCSignalingState;
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
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // OpenRelay STUN/TURN servers (free tier)
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

// Version of the sync protocol
export const SYNC_VERSION = 1;

// Timeouts and intervals (in milliseconds)
export const CONNECTION_TIMEOUT = 60000;        // 1 minute (increased from 30s)
export const SIGNALING_CHECK_INTERVAL = 1000;   // 1 second
export const PING_INTERVAL = 15000;            // 15 seconds (decreased from 30s for more responsive health checks)
export const HEALTH_CHECK_INTERVAL = 5000;      // 5 seconds
export const SESSION_CLEANUP_INTERVAL = 60000;  // 1 minute
export const SESSION_EXPIRY = 10 * 60 * 1000;  // 10 minutes (increased from 5m)
export const MESSAGE_EXPIRY = 2 * 60 * 1000;   // 2 minutes
export const RECONNECT_DELAY = 2000;           // 2 seconds
export const MAX_RECONNECT_ATTEMPTS = 3;       // Maximum number of reconnection attempts

// WebRTC configuration constants
export const MAX_MESSAGE_SIZE = 16384;         // 16KB max message size
export const ICE_GATHERING_TIMEOUT = 5000;     // 5 seconds timeout for ICE gathering
export const SIGNALING_TIMEOUT = 10000;        // 10 seconds timeout for signaling
export const MAX_BUFFERED_MESSAGES = 100;      // Maximum number of messages to buffer
