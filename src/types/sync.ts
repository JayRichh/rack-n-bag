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
  type: 'tournament-update' | 'ping' | 'pong';
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
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceTransportPolicy: 'all',
  bundlePolicy: 'balanced',
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

// Timeouts and intervals
export const CONNECTION_TIMEOUT = 30000;
export const SIGNALING_CHECK_INTERVAL = 1000;
export const PING_INTERVAL = 30000;
export const SESSION_CLEANUP_INTERVAL = 60000;
export const SESSION_EXPIRY = 5 * 60 * 1000;
