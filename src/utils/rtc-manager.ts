import { syncStorage } from './sync-storage';
import { 
  SignalingMessage, 
  SyncMessage, 
  SyncState,
  DEFAULT_RTC_CONFIG,
  DEFAULT_CHANNEL_CONFIG,
  SYNC_VERSION,
  CONNECTION_TIMEOUT,
  SIGNALING_CHECK_INTERVAL
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

  constructor(tournamentId: string, peerId: string, isHost: boolean) {
    this.tournamentId = tournamentId;
    this.peerId = peerId;
    this.isHost = isHost;
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection(DEFAULT_RTC_CONFIG);

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
        this.handleConnectionFailure();
      }

      this.stateCallback?.(
        this.getConnectionState(),
        undefined,
        { iceConnectionState: this.peerConnection?.iceConnectionState }
      );
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.peerConnection?.iceGatheringState);
      this.stateCallback?.(
        this.getConnectionState(),
        undefined,
        { iceGatheringState: this.peerConnection?.iceGatheringState }
      );
    };

    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection?.signalingState);
      this.stateCallback?.(
        this.getConnectionState(),
        undefined,
        { signalingState: this.peerConnection?.signalingState }
      );
    };

    this.peerConnection.onnegotiationneeded = async () => {
      if (this.isHost) {
        try {
          const offer = await this.peerConnection!.createOffer();
          await this.peerConnection!.setLocalDescription(offer);
          
          const message: SignalingMessage = {
            type: 'renegotiate',
            senderId: this.peerId,
            timestamp: new Date().toISOString(),
            data: offer
          };
          syncStorage.addSignalingMessage(this.tournamentId, message);
        } catch (error) {
          console.error('Renegotiation failed:', error);
        }
      }
    };

    if (this.isHost) {
      this.setupDataChannel(this.peerConnection.createDataChannel('tournamentSync', DEFAULT_CHANNEL_CONFIG));
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
    };

    channel.onclose = () => {
      console.log('DataChannel closed');
      if (!this.isClosing) {
        this.handleConnectionFailure();
      }
    };

    channel.onerror = (error) => {
      console.error('DataChannel error:', error);
      this.handleConnectionFailure();
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

  private getConnectionState(): ConnectionState {
    if (this.dataChannel?.readyState === 'open') {
      return this.isHost ? 'host' : 'connected';
    }
    if (this.peerConnection?.connectionState === 'connecting' || 
        this.peerConnection?.iceGatheringState === 'gathering') {
      return 'connecting';
    }
    return 'disconnected';
  }

  private startConnectionTimeout() {
    this.clearConnectionTimeout();
    this.connectionTimeout = setTimeout(() => {
      if (this.dataChannel?.readyState !== 'open') {
        this.handleConnectionFailure();
      }
    }, CONNECTION_TIMEOUT);
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private async handleConnectionFailure() {
    if (this.isClosing) return;

    console.log('Connection failed, cleaning up...');
    this.stateCallback?.('disconnected', 'Connection failed');
    await this.cleanup();
  }

  private startSignallingCheck() {
    this.signallingCheckInterval = setInterval(() => {
      const messages = syncStorage.getSignalingMessages(this.tournamentId, this.peerId);
      
      messages.forEach(async (message) => {
        try {
          await this.handleSignalingMessage(message);
          syncStorage.removeSignalingMessage(this.tournamentId, message.timestamp);
        } catch (error) {
          console.error('Failed to handle signaling message:', error);
        }
      });
    }, SIGNALING_CHECK_INTERVAL);
  }

  private async handleSignalingMessage(message: SignalingMessage) {
    if (!this.peerConnection) return;

    switch (message.type) {
      case 'offer':
      case 'renegotiate':
        if (!this.isHost) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          
          const answerMessage: SignalingMessage = {
            type: 'answer',
            senderId: this.peerId,
            receiverId: message.senderId,
            timestamp: new Date().toISOString(),
            data: answer
          };
          syncStorage.addSignalingMessage(this.tournamentId, answerMessage);
        }
        break;

      case 'answer':
        if (this.isHost) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
        }
        break;

      case 'ice-candidate':
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.data as RTCIceCandidateInit));
        } catch (error) {
          console.error('Failed to add ICE candidate:', error);
        }
        break;
    }
  }

  async connect() {
    try {
      this.isClosing = false;
      this.setupPeerConnection();
      this.startSignallingCheck();
      this.startConnectionTimeout();
      this.stateCallback?.('connecting');

      if (this.isHost && this.peerConnection) {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        const offerMessage: SignalingMessage = {
          type: 'offer',
          senderId: this.peerId,
          timestamp: new Date().toISOString(),
          data: offer
        };
        syncStorage.addSignalingMessage(this.tournamentId, offerMessage);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      this.handleConnectionFailure();
    }
  }

  async cleanup() {
    this.isClosing = true;

    if (this.signallingCheckInterval) {
      clearInterval(this.signallingCheckInterval);
      this.signallingCheckInterval = null;
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

    if (this.isHost) {
      syncStorage.deleteSession(this.tournamentId);
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
