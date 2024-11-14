import { syncStorage } from './sync-storage';
import { 
  SignalingMessage, 
  SyncMessage, 
  SyncState,
  DEFAULT_RTC_CONFIG,
  DEFAULT_CHANNEL_CONFIG,
  SYNC_VERSION,
  CONNECTION_TIMEOUT,
  SIGNALING_CHECK_INTERVAL,
  ICE_GATHERING_TIMEOUT
} from '../types/sync';

type ConnectionState = SyncState['status'];

export class RTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private tournamentId: string;
  private peerId: string;
  private isHost: boolean;
  private messageCallback: ((message: any) => void) | null = null;
  private stateCallback: ((state: ConnectionState, error?: string, updates?: Partial<SyncState>) => void) | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private signallingCheckInterval: NodeJS.Timeout | null = null;
  private isClosing = false;
  private pendingCandidates: RTCIceCandidate[] = [];
  private hasRemoteDescription = false;
  private isNegotiating = false;
  private makingOffer = false;
  private ignoreOffer = false;
  private iceGatheringTimeout: NodeJS.Timeout | null = null;
  private pendingSignalingPromise: Promise<void> | null = null;
  private polite: boolean;

  constructor(tournamentId: string, peerId: string, isHost: boolean) {
    this.tournamentId = tournamentId;
    this.peerId = peerId;
    this.isHost = isHost;
    // Host is always polite to handle offer collisions gracefully
    this.polite = isHost;
  }

  // Make getConnectionState public
  public getConnectionState(): ConnectionState {
    if (this.dataChannel?.readyState === 'open') {
      return this.isHost ? 'host' : 'connected';
    }
    if (this.peerConnection?.connectionState === 'connecting' || 
        this.peerConnection?.iceGatheringState === 'gathering' ||
        this.isNegotiating) {
      return 'connecting';
    }
    return 'disconnected';
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      ...DEFAULT_RTC_CONFIG,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const message: SignalingMessage = {
          type: 'ice-candidate',
          senderId: this.peerId,
          timestamp: new Date().toISOString(),
          data: event.candidate.toJSON()
        };
        syncStorage.addSignalingMessage(this.tournamentId, message);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
      
      if (this.peerConnection?.iceConnectionState === 'failed') {
        if (this.isHost) {
          this.peerConnection.restartIce();
        }
        this.handleConnectionFailure('ICE connection failed');
      } else if (this.peerConnection?.iceConnectionState === 'connected') {
        this.clearConnectionTimeout();
      }

      this.stateCallback?.(
        this.getConnectionState(),
        undefined,
        { iceConnectionState: this.peerConnection?.iceConnectionState }
      );
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.peerConnection?.iceGatheringState);
      
      if (this.peerConnection?.iceGatheringState === 'gathering') {
        if (this.iceGatheringTimeout) {
          clearTimeout(this.iceGatheringTimeout);
        }
        this.iceGatheringTimeout = setTimeout(() => {
          if (this.peerConnection?.iceGatheringState === 'gathering') {
            if (this.isHost) {
              this.peerConnection.restartIce();
            } else {
              this.handleConnectionFailure('ICE gathering timed out');
            }
          }
        }, ICE_GATHERING_TIMEOUT);
      } else if (this.peerConnection?.iceGatheringState === 'complete') {
        if (this.iceGatheringTimeout) {
          clearTimeout(this.iceGatheringTimeout);
          this.iceGatheringTimeout = null;
        }
      }

      this.stateCallback?.(
        this.getConnectionState(),
        undefined,
        { iceGatheringState: this.peerConnection?.iceGatheringState }
      );
    };

    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection?.signalingState);
      
      if (this.peerConnection?.signalingState === 'stable') {
        this.isNegotiating = false;
        this.makingOffer = false;
        this.processQueuedCandidates();
      }

      this.stateCallback?.(
        this.getConnectionState(),
        undefined,
        { signalingState: this.peerConnection?.signalingState }
      );
    };

    this.peerConnection.onnegotiationneeded = async () => {
      try {
        if (this.isNegotiating || !this.peerConnection) return;
        
        this.isNegotiating = true;
        this.makingOffer = true;
        
        await this.peerConnection.setLocalDescription();
        
        const message: SignalingMessage = {
          type: 'offer',
          senderId: this.peerId,
          timestamp: new Date().toISOString(),
          data: this.peerConnection.localDescription!.toJSON()
        };
        syncStorage.addSignalingMessage(this.tournamentId, message);
      } catch (error) {
        console.error('Negotiation failed:', error);
        this.isNegotiating = false;
        this.makingOffer = false;
        this.handleConnectionFailure('Negotiation failed');
      } finally {
        this.makingOffer = false;
      }
    };

    if (this.isHost) {
      const channel = this.peerConnection.createDataChannel('tournamentSync', {
        ...DEFAULT_CHANNEL_CONFIG,
        ordered: true,
        maxRetransmits: 3
      });
      this.setupDataChannel(channel);
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log('DataChannel opened');
      this.stateCallback?.(this.isHost ? 'host' : 'connected');
      this.clearConnectionTimeout();
      
      if (this.isHost) {
        syncStorage.addConnectedPeer(this.tournamentId, this.peerId);
      }
    };

    channel.onclose = () => {
      console.log('DataChannel closed');
      if (!this.isClosing) {
        this.handleConnectionFailure('Data channel closed unexpectedly');
      }
    };

    channel.onerror = (error) => {
      console.error('DataChannel error:', error);
      this.handleConnectionFailure('Data channel error occurred');
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.messageCallback?.(message);
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    };
  }

  private startConnectionTimeout() {
    this.clearConnectionTimeout();
    this.connectionTimeout = setTimeout(() => {
      if (this.dataChannel?.readyState !== 'open') {
        this.handleConnectionFailure('Connection timeout');
      }
    }, CONNECTION_TIMEOUT);
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private async handleConnectionFailure(reason: string) {
    if (this.isClosing) return;

    console.log(`Connection failed: ${reason}`);
    this.stateCallback?.('disconnected', reason);
    await this.cleanup();
  }

  private async processQueuedCandidates() {
    if (!this.peerConnection || !this.hasRemoteDescription) return;

    const candidates = [...this.pendingCandidates];
    this.pendingCandidates = [];

    for (const candidate of candidates) {
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        if (!this.ignoreOffer) {
          console.error('Failed to add ICE candidate:', error);
          this.pendingCandidates.push(candidate);
        }
      }
    }
  }

  private startSignallingCheck() {
    this.signallingCheckInterval = setInterval(async () => {
      if (this.pendingSignalingPromise) {
        return; // Wait for previous signaling operation to complete
      }

      try {
        this.pendingSignalingPromise = this.processSignalingMessages();
        await this.pendingSignalingPromise;
      } catch (error) {
        console.error('Signaling check failed:', error);
      } finally {
        this.pendingSignalingPromise = null;
      }
    }, SIGNALING_CHECK_INTERVAL);
  }

  private async processSignalingMessages() {
    const messages = syncStorage.getSignalingMessages(this.tournamentId, this.peerId);
    
    for (const message of messages) {
      try {
        await this.handleSignalingMessage(message);
        syncStorage.removeSignalingMessage(this.tournamentId, message.timestamp);
      } catch (error) {
        console.error('Failed to handle signaling message:', error);
      }
    }
  }

  private async handleSignalingMessage(message: SignalingMessage) {
    if (!this.peerConnection) return;

    try {
      switch (message.type) {
        case 'offer': {
          const offerCollision = 
            message.type === 'offer' &&
            (this.makingOffer || this.peerConnection.signalingState !== 'stable');

          this.ignoreOffer = !this.polite && offerCollision;
          if (this.ignoreOffer) {
            console.log('Ignoring colliding offer as impolite peer');
            return;
          }

          if (offerCollision) {
            console.log('Handling offer collision as polite peer');
          }

          this.isNegotiating = true;
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
          this.hasRemoteDescription = true;
          await this.processQueuedCandidates();
          
          await this.peerConnection.setLocalDescription();
          
          const answerMessage: SignalingMessage = {
            type: 'answer',
            senderId: this.peerId,
            receiverId: message.senderId,
            timestamp: new Date().toISOString(),
            data: this.peerConnection.localDescription!.toJSON()
          };
          syncStorage.addSignalingMessage(this.tournamentId, answerMessage);
          break;
        }

        case 'answer':
          if (!this.ignoreOffer && this.peerConnection.signalingState === 'have-local-offer') {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
            this.hasRemoteDescription = true;
            await this.processQueuedCandidates();
          }
          break;

        case 'ice-candidate': {
          if (this.ignoreOffer) return;

          const candidate = new RTCIceCandidate(message.data as RTCIceCandidateInit);
          if (this.hasRemoteDescription) {
            await this.peerConnection.addIceCandidate(candidate);
          } else {
            this.pendingCandidates.push(candidate);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      if (!this.ignoreOffer) {
        this.handleConnectionFailure('Signaling error occurred');
      }
    }
  }

  async connect() {
    try {
      this.isClosing = false;
      this.hasRemoteDescription = false;
      this.isNegotiating = false;
      this.makingOffer = false;
      this.ignoreOffer = false;
      this.pendingCandidates = [];
      this.pendingSignalingPromise = null;
      
      this.setupPeerConnection();
      this.startSignallingCheck();
      this.startConnectionTimeout();
      this.stateCallback?.('connecting');

      if (this.isHost) {
        // Create and store the sync session
        syncStorage.createSession({
          id: this.peerId,
          tournamentId: this.tournamentId,
          hostId: this.peerId,
          lastActive: new Date().toISOString(),
          messages: [],
          connectedPeers: []
        });
      }
    } catch (error) {
      console.error('Connection setup failed:', error);
      this.handleConnectionFailure('Failed to initialize connection');
    }
  }

  async cleanup() {
    this.isClosing = true;

    if (this.signallingCheckInterval) {
      clearInterval(this.signallingCheckInterval);
      this.signallingCheckInterval = null;
    }

    if (this.iceGatheringTimeout) {
      clearTimeout(this.iceGatheringTimeout);
      this.iceGatheringTimeout = null;
    }

    this.clearConnectionTimeout();

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.hasRemoteDescription = false;
    this.isNegotiating = false;
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.pendingCandidates = [];
    this.pendingSignalingPromise = null;

    if (this.isHost) {
      syncStorage.deleteSession(this.tournamentId);
    } else {
      syncStorage.removeConnectedPeer(this.tournamentId, this.peerId);
    }
  }

  sendMessage(message: Omit<SyncMessage, 'version'>) {
    if (this.dataChannel?.readyState === 'open') {
      const fullMessage: SyncMessage = {
        ...message,
        version: SYNC_VERSION
      };
      this.dataChannel.send(JSON.stringify(fullMessage));
    }
  }

  onMessage(callback: (message: any) => void) {
    this.messageCallback = callback;
  }

  onStateChange(callback: (state: ConnectionState, error?: string, updates?: Partial<SyncState>) => void) {
    this.stateCallback = callback;
  }
}
