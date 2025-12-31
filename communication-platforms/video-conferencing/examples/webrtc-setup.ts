/**
 * WebRTC Peer Connection Setup Example
 *
 * Demonstrates how to establish peer-to-peer video/audio connections
 * using WebRTC with proper signaling and ICE candidate handling.
 */

import { EventEmitter } from 'events';

// Configuration for WebRTC
export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  videoConstraints?: MediaStreamConstraints['video'];
  audioConstraints?: MediaStreamConstraints['audio'];
}

// Default STUN/TURN servers
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * WebRTC Peer Connection Manager
 *
 * Handles peer-to-peer connections with automatic reconnection
 * and comprehensive event handling
 */
export class WebRTCPeer extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private peerId: string;
  private isInitiator: boolean = false;
  private iceCandidateQueue: RTCIceCandidateInit[] = [];

  constructor(peerId: string, config: WebRTCConfig = {}) {
    super();
    this.peerId = peerId;
    this.config = {
      iceServers: DEFAULT_ICE_SERVERS,
      videoConstraints: { width: 1280, height: 720 },
      audioConstraints: true,
      ...config,
    };
  }

  /**
   * Initialize local media stream
   */
  async initializeLocalStream(
    video: boolean | MediaTrackConstraints = true,
    audio: boolean | MediaTrackConstraints = true
  ): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video !== false ? this.config.videoConstraints : false,
        audio: audio !== false ? this.config.audioConstraints : false,
      });

      this.emit('local-stream', this.localStream);
      return this.localStream;
    } catch (error) {
      this.emit('error', {
        type: 'media-error',
        message: 'Failed to access media devices',
        error,
      });
      throw error;
    }
  }

  /**
   * Create peer connection
   */
  createPeerConnection(): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('ice-candidate', {
          peerId: this.peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      this.emit('ice-connection-state-change', state);

      if (state === 'failed' || state === 'disconnected') {
        this.handleConnectionFailure();
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      this.emit('connection-state-change', state);

      if (state === 'connected') {
        this.emit('connected', this.peerId);
      }
    };

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        this.emit('remote-stream', this.remoteStream);
      }

      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });

      this.emit('remote-track', event.track);
    };

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    return this.peerConnection;
  }

  /**
   * Create and send offer
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      this.isInitiator = true;
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection!.setLocalDescription(offer);
      this.emit('offer-created', offer);

      return offer;
    } catch (error) {
      this.emit('error', {
        type: 'offer-error',
        message: 'Failed to create offer',
        error,
      });
      throw error;
    }
  }

  /**
   * Handle received offer and create answer
   */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

      // Process queued ICE candidates
      await this.processIceCandidateQueue();

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.emit('answer-created', answer);
      return answer;
    } catch (error) {
      this.emit('error', {
        type: 'answer-error',
        message: 'Failed to handle offer',
        error,
      });
      throw error;
    }
  }

  /**
   * Handle received answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));

      // Process queued ICE candidates
      await this.processIceCandidateQueue();

      this.emit('answer-handled');
    } catch (error) {
      this.emit('error', {
        type: 'answer-error',
        message: 'Failed to handle answer',
        error,
      });
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection?.remoteDescription) {
      // Queue candidates if remote description not yet set
      this.iceCandidateQueue.push(candidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      this.emit('ice-candidate-added', candidate);
    } catch (error) {
      this.emit('error', {
        type: 'ice-candidate-error',
        message: 'Failed to add ICE candidate',
        error,
      });
    }
  }

  /**
   * Process queued ICE candidates
   */
  private async processIceCandidateQueue(): Promise<void> {
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      if (candidate) {
        await this.addIceCandidate(candidate);
      }
    }
  }

  /**
   * Handle connection failure and attempt reconnection
   */
  private handleConnectionFailure(): void {
    this.emit('connection-failed');

    // Attempt ICE restart if initiator
    if (this.isInitiator && this.peerConnection) {
      this.peerConnection.restartIce();
      this.emit('ice-restart');
    }
  }

  /**
   * Toggle video track
   */
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled ?? !videoTrack.enabled;
      this.emit('video-toggled', videoTrack.enabled);
      return videoTrack.enabled;
    }

    return false;
  }

  /**
   * Toggle audio track
   */
  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled ?? !audioTrack.enabled;
      this.emit('audio-toggled', audioTrack.enabled);
      return audioTrack.enabled;
    }

    return false;
  }

  /**
   * Get connection statistics
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null;
    return await this.peerConnection.getStats();
  }

  /**
   * Get current connection state
   */
  getConnectionState(): {
    connectionState: RTCPeerConnectionState | null;
    iceConnectionState: RTCIceConnectionState | null;
    signalingState: RTCSignalingState | null;
  } {
    return {
      connectionState: this.peerConnection?.connectionState ?? null,
      iceConnectionState: this.peerConnection?.iceConnectionState ?? null,
      signalingState: this.peerConnection?.signalingState ?? null,
    };
  }

  /**
   * Close connection and cleanup
   */
  close(): void {
    // Stop local stream tracks
    this.localStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    this.peerConnection?.close();

    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.iceCandidateQueue = [];

    this.emit('closed');
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Example: Setting up a WebRTC connection with signaling
 */
export async function exampleWebRTCSetup() {
  // Create peer instance
  const peer = new WebRTCPeer('user-123', {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:turn.example.com:3478',
        username: 'user',
        credential: 'pass',
      },
    ],
    videoConstraints: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      facingMode: 'user',
    },
  });

  // Set up event listeners
  peer.on('local-stream', (stream: MediaStream) => {
    console.log('Local stream ready:', stream.id);
    // Attach to video element
    const videoElement = document.getElementById('local-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  });

  peer.on('remote-stream', (stream: MediaStream) => {
    console.log('Remote stream received:', stream.id);
    // Attach to video element
    const videoElement = document.getElementById('remote-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  });

  peer.on('ice-candidate', (data: { peerId: string; candidate: RTCIceCandidateInit }) => {
    console.log('ICE candidate generated:', data.candidate);
    // Send to remote peer via signaling server
    // signalingSocket.emit('ice-candidate', data);
  });

  peer.on('connected', (peerId: string) => {
    console.log('Successfully connected to peer:', peerId);
  });

  peer.on('error', (error: any) => {
    console.error('WebRTC error:', error);
  });

  // Initialize local media
  await peer.initializeLocalStream();

  // Create offer (as initiator)
  const offer = await peer.createOffer();
  console.log('Offer created:', offer);

  // Send offer to remote peer via signaling server
  // signalingSocket.emit('offer', { targetPeerId: 'user-456', offer });

  // When receiving an answer from signaling server:
  // signalingSocket.on('answer', async (answer) => {
  //   await peer.handleAnswer(answer);
  // });

  // When receiving ICE candidates from signaling server:
  // signalingSocket.on('ice-candidate', async (candidate) => {
  //   await peer.addIceCandidate(candidate);
  // });

  return peer;
}

/**
 * Example: Receiving peer (non-initiator)
 */
export async function exampleReceivingPeer() {
  const peer = new WebRTCPeer('user-456');

  // Initialize local media
  await peer.initializeLocalStream();

  // When receiving an offer from signaling server:
  // signalingSocket.on('offer', async (offer) => {
  //   const answer = await peer.handleOffer(offer);
  //   // Send answer back via signaling server
  //   signalingSocket.emit('answer', { targetPeerId: 'user-123', answer });
  // });

  return peer;
}

/**
 * Example: Audio-only call
 */
export async function exampleAudioOnlyCall() {
  const peer = new WebRTCPeer('user-789', {
    videoConstraints: false,
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  await peer.initializeLocalStream(false, true);

  return peer;
}

/**
 * Example: Monitor connection quality
 */
export async function exampleMonitorConnectionQuality(peer: WebRTCPeer) {
  setInterval(async () => {
    const stats = await peer.getStats();
    if (!stats) return;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        console.log('Video stats:', {
          packetsLost: report.packetsLost,
          packetsReceived: report.packetsReceived,
          bytesReceived: report.bytesReceived,
          jitter: report.jitter,
        });
      }
    });

    const state = peer.getConnectionState();
    console.log('Connection state:', state);
  }, 5000);
}
