/**
 * Screen Sharing Example
 *
 * Demonstrates screen sharing capabilities in video conferences
 * including display capture, application sharing, and tab sharing.
 */

import { EventEmitter } from 'events';

// Screen share options
export interface ScreenShareOptions {
  video?: {
    cursor?: 'always' | 'motion' | 'never';
    displaySurface?: 'browser' | 'window' | 'monitor';
    logicalSurface?: boolean;
    frameRate?: number;
    width?: number;
    height?: number;
  };
  audio?: boolean | MediaTrackConstraints;
  preferCurrentTab?: boolean;
  systemAudio?: 'include' | 'exclude';
}

// Screen share metadata
export interface ScreenShareMetadata {
  id: string;
  userId: string;
  userName: string;
  displaySurface: string;
  startedAt: Date;
  isAudioIncluded: boolean;
}

/**
 * Screen Share Manager
 *
 * Manages screen sharing with WebRTC including permissions,
 * quality controls, and multi-user coordination
 */
export class ScreenShareManager extends EventEmitter {
  private localStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private isSharing: boolean = false;
  private shareId: string | null = null;
  private options: ScreenShareOptions;
  private remoteShares: Map<string, { stream: MediaStream; metadata: ScreenShareMetadata }> = new Map();

  constructor(options: ScreenShareOptions = {}) {
    super();
    this.options = {
      video: {
        cursor: 'always',
        displaySurface: 'monitor',
        frameRate: 30,
        width: 1920,
        height: 1080,
        ...options.video,
      },
      audio: false,
      ...options,
    };
  }

  /**
   * Start screen sharing
   */
  async startSharing(): Promise<MediaStream> {
    if (this.isSharing) {
      throw new Error('Already sharing screen');
    }

    try {
      // Get display media
      const constraints: DisplayMediaStreamConstraints = {
        video: this.options.video ?? true,
        audio: this.options.audio ?? false,
      };

      this.localStream = await navigator.mediaDevices.getDisplayMedia(constraints);

      this.shareId = `share_${Date.now()}`;
      this.isSharing = true;

      // Handle stream end (user stops sharing via browser UI)
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopSharing();
        };
      }

      this.emit('sharing-started', {
        shareId: this.shareId,
        stream: this.localStream,
      });

      return this.localStream;
    } catch (error) {
      this.emit('error', {
        type: 'share-start-error',
        message: 'Failed to start screen sharing',
        error,
      });
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  stopSharing(): void {
    if (!this.isSharing || !this.localStream) return;

    // Stop all tracks
    this.localStream.getTracks().forEach((track) => track.stop());

    const shareId = this.shareId;
    this.localStream = null;
    this.shareId = null;
    this.isSharing = false;

    this.emit('sharing-stopped', { shareId });
  }

  /**
   * Share screen via peer connection
   */
  async shareToPeer(peerConnection: RTCPeerConnection): Promise<void> {
    if (!this.localStream) {
      await this.startSharing();
    }

    if (!this.localStream) {
      throw new Error('No screen share stream available');
    }

    this.peerConnection = peerConnection;

    // Add tracks to peer connection
    const senders: RTCRtpSender[] = [];
    this.localStream.getTracks().forEach((track) => {
      const sender = peerConnection.addTrack(track, this.localStream!);
      senders.push(sender);

      // Configure encoding parameters for screen sharing
      if (track.kind === 'video') {
        this.configureVideoEncoding(sender);
      }
    });

    this.emit('peer-share-started', {
      peerConnection,
      senders,
    });
  }

  /**
   * Configure video encoding parameters for optimal screen sharing
   */
  private async configureVideoEncoding(sender: RTCRtpSender): Promise<void> {
    const parameters = sender.getParameters();

    if (!parameters.encodings || parameters.encodings.length === 0) {
      parameters.encodings = [{}];
    }

    // Optimize for screen sharing
    parameters.encodings.forEach((encoding) => {
      // Higher bitrate for screen content
      encoding.maxBitrate = 2500000; // 2.5 Mbps

      // Disable scaling for crisp text
      encoding.scaleResolutionDownBy = 1;

      // Optimize for content
      encoding.priority = 'high';
    });

    try {
      await sender.setParameters(parameters);
      this.emit('encoding-configured', parameters);
    } catch (error) {
      console.error('Failed to configure encoding:', error);
    }
  }

  /**
   * Replace camera stream with screen share
   */
  async replaceVideoTrack(sender: RTCRtpSender): Promise<void> {
    if (!this.localStream) {
      await this.startSharing();
    }

    const screenVideoTrack = this.localStream?.getVideoTracks()[0];
    if (!screenVideoTrack) {
      throw new Error('No screen video track available');
    }

    await sender.replaceTrack(screenVideoTrack);
    await this.configureVideoEncoding(sender);

    this.emit('track-replaced', screenVideoTrack);
  }

  /**
   * Share specific application window
   */
  async shareApplication(): Promise<MediaStream> {
    this.options.video = {
      ...this.options.video,
      displaySurface: 'window',
    };

    return await this.startSharing();
  }

  /**
   * Share browser tab
   */
  async shareTab(): Promise<MediaStream> {
    this.options.video = {
      ...this.options.video,
      displaySurface: 'browser',
    };

    this.options.preferCurrentTab = true;

    return await this.startSharing();
  }

  /**
   * Share with system audio
   */
  async shareWithAudio(): Promise<MediaStream> {
    this.options.audio = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    };

    return await this.startSharing();
  }

  /**
   * Add remote screen share
   */
  addRemoteShare(shareId: string, stream: MediaStream, metadata: ScreenShareMetadata): void {
    this.remoteShares.set(shareId, { stream, metadata });
    this.emit('remote-share-added', { shareId, stream, metadata });
  }

  /**
   * Remove remote screen share
   */
  removeRemoteShare(shareId: string): void {
    const share = this.remoteShares.get(shareId);
    if (!share) return;

    this.remoteShares.delete(shareId);
    this.emit('remote-share-removed', { shareId, metadata: share.metadata });
  }

  /**
   * Get all remote shares
   */
  getRemoteShares(): Array<{ shareId: string; stream: MediaStream; metadata: ScreenShareMetadata }> {
    return Array.from(this.remoteShares.entries()).map(([shareId, data]) => ({
      shareId,
      ...data,
    }));
  }

  /**
   * Check if currently sharing
   */
  getIsSharing(): boolean {
    return this.isSharing;
  }

  /**
   * Get local share stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get share ID
   */
  getShareId(): string | null {
    return this.shareId;
  }

  /**
   * Adjust video quality
   */
  async adjustQuality(quality: 'low' | 'medium' | 'high'): Promise<void> {
    if (!this.peerConnection) return;

    const senders = this.peerConnection.getSenders();
    const videoSender = senders.find((s) => s.track?.kind === 'video');

    if (!videoSender) return;

    const parameters = videoSender.getParameters();
    if (!parameters.encodings || parameters.encodings.length === 0) return;

    const qualitySettings = {
      low: { maxBitrate: 500000, maxFramerate: 15 },
      medium: { maxBitrate: 1500000, maxFramerate: 24 },
      high: { maxBitrate: 2500000, maxFramerate: 30 },
    };

    const settings = qualitySettings[quality];

    parameters.encodings.forEach((encoding) => {
      encoding.maxBitrate = settings.maxBitrate;
      encoding.maxFramerate = settings.maxFramerate;
    });

    await videoSender.setParameters(parameters);
    this.emit('quality-adjusted', quality);
  }

  /**
   * Pause screen sharing (keep stream but don't send)
   */
  pause(): void {
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = false;
    });

    this.emit('sharing-paused');
  }

  /**
   * Resume screen sharing
   */
  resume(): void {
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = true;
    });

    this.emit('sharing-resumed');
  }
}

// ============================================================================
// Room-based Screen Sharing
// ============================================================================

/**
 * Multi-user screen share coordinator
 */
export class ScreenShareCoordinator extends EventEmitter {
  private roomId: string;
  private activeShares: Map<string, ScreenShareMetadata> = new Map();
  private maxConcurrentShares: number;
  private localManager: ScreenShareManager;
  private signalingSocket: any;

  constructor(
    roomId: string,
    signalingSocket: any,
    options: { maxConcurrentShares?: number } = {}
  ) {
    super();
    this.roomId = roomId;
    this.signalingSocket = signalingSocket;
    this.maxConcurrentShares = options.maxConcurrentShares ?? 1;
    this.localManager = new ScreenShareManager();

    this.setupSignaling();
  }

  private setupSignaling(): void {
    // Screen share started notification
    this.signalingSocket.on('screen-share-started', (metadata: ScreenShareMetadata) => {
      this.activeShares.set(metadata.id, metadata);
      this.emit('share-started', metadata);
    });

    // Screen share stopped notification
    this.signalingSocket.on('screen-share-stopped', (shareId: string) => {
      const metadata = this.activeShares.get(shareId);
      this.activeShares.delete(shareId);
      if (metadata) {
        this.emit('share-stopped', metadata);
      }
    });
  }

  /**
   * Request to start screen sharing
   */
  async requestShare(userId: string, userName: string): Promise<boolean> {
    if (this.activeShares.size >= this.maxConcurrentShares) {
      this.emit('error', {
        type: 'share-limit-reached',
        message: `Maximum ${this.maxConcurrentShares} concurrent shares allowed`,
      });
      return false;
    }

    try {
      const stream = await this.localManager.startSharing();

      const metadata: ScreenShareMetadata = {
        id: this.localManager.getShareId()!,
        userId,
        userName,
        displaySurface: 'monitor',
        startedAt: new Date(),
        isAudioIncluded: stream.getAudioTracks().length > 0,
      };

      this.activeShares.set(metadata.id, metadata);

      // Notify other participants
      this.signalingSocket.emit('screen-share-started', this.roomId, metadata);

      this.emit('local-share-started', metadata);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Stop sharing
   */
  stopShare(): void {
    const shareId = this.localManager.getShareId();
    if (!shareId) return;

    this.localManager.stopSharing();
    this.activeShares.delete(shareId);

    this.signalingSocket.emit('screen-share-stopped', this.roomId, shareId);
  }

  /**
   * Get active shares
   */
  getActiveShares(): ScreenShareMetadata[] {
    return Array.from(this.activeShares.values());
  }

  /**
   * Check if can start sharing
   */
  canStartSharing(): boolean {
    return this.activeShares.size < this.maxConcurrentShares;
  }

  /**
   * Get local manager
   */
  getLocalManager(): ScreenShareManager {
    return this.localManager;
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Basic screen sharing
 */
export async function exampleBasicScreenShare() {
  const manager = new ScreenShareManager();

  // Set up event listeners
  manager.on('sharing-started', ({ shareId, stream }) => {
    console.log('Screen sharing started:', shareId);

    // Attach to video element
    const videoElement = document.getElementById('screen-share-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  });

  manager.on('sharing-stopped', ({ shareId }) => {
    console.log('Screen sharing stopped:', shareId);
  });

  manager.on('error', (error) => {
    console.error('Screen share error:', error);
  });

  // Start sharing
  await manager.startSharing();

  return manager;
}

/**
 * Example: Share with peer connection
 */
export async function exampleShareWithPeer(peerConnection: RTCPeerConnection) {
  const manager = new ScreenShareManager({
    video: {
      frameRate: 30,
      width: 1920,
      height: 1080,
      cursor: 'always',
    },
  });

  // Start sharing and add to peer connection
  await manager.shareToPeer(peerConnection);

  return manager;
}

/**
 * Example: Replace camera with screen share
 */
export async function exampleReplaceCamera(videoSender: RTCRtpSender) {
  const manager = new ScreenShareManager();

  await manager.replaceVideoTrack(videoSender);

  // Later, switch back to camera
  const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
  const cameraTrack = cameraStream.getVideoTracks()[0];
  await videoSender.replaceTrack(cameraTrack);

  manager.stopSharing();
}

/**
 * Example: Application window sharing
 */
export async function exampleShareApplication() {
  const manager = new ScreenShareManager();

  try {
    const stream = await manager.shareApplication();
    console.log('Sharing application window');
    return stream;
  } catch (error) {
    console.error('Failed to share application:', error);
    throw error;
  }
}

/**
 * Example: Share with audio
 */
export async function exampleShareWithAudio() {
  const manager = new ScreenShareManager();

  const stream = await manager.shareWithAudio();

  const hasAudio = stream.getAudioTracks().length > 0;
  console.log('Screen share includes audio:', hasAudio);

  return manager;
}

/**
 * Example: Room-based screen sharing coordination
 */
export async function exampleRoomScreenShare(signalingSocket: any) {
  const coordinator = new ScreenShareCoordinator('room-123', signalingSocket, {
    maxConcurrentShares: 2,
  });

  // Set up event listeners
  coordinator.on('share-started', (metadata: ScreenShareMetadata) => {
    console.log(`${metadata.userName} started sharing`);
  });

  coordinator.on('share-stopped', (metadata: ScreenShareMetadata) => {
    console.log(`${metadata.userName} stopped sharing`);
  });

  coordinator.on('local-share-started', (metadata: ScreenShareMetadata) => {
    console.log('You started sharing:', metadata.id);
  });

  // Request to share
  if (coordinator.canStartSharing()) {
    await coordinator.requestShare('user-123', 'John Doe');
  } else {
    console.log('Maximum shares reached, cannot start sharing');
  }

  return coordinator;
}

/**
 * Example: Dynamic quality adjustment
 */
export async function exampleQualityAdjustment(
  manager: ScreenShareManager,
  peerConnection: RTCPeerConnection
) {
  await manager.shareToPeer(peerConnection);

  // Monitor network conditions and adjust quality
  let currentQuality: 'low' | 'medium' | 'high' = 'high';

  setInterval(async () => {
    const stats = await peerConnection.getStats();

    stats.forEach((report) => {
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        const packetLossRate = report.packetsLost / (report.packetsSent || 1);

        if (packetLossRate > 0.1 && currentQuality !== 'low') {
          currentQuality = 'low';
          manager.adjustQuality('low');
          console.log('Reducing quality to low due to packet loss');
        } else if (packetLossRate < 0.02 && currentQuality !== 'high') {
          currentQuality = 'high';
          manager.adjustQuality('high');
          console.log('Increasing quality to high');
        }
      }
    });
  }, 5000);
}

/**
 * Example: Pause/Resume screen sharing
 */
export function examplePauseResume(manager: ScreenShareManager) {
  let isPaused = false;

  // Toggle pause/resume
  const togglePause = () => {
    if (isPaused) {
      manager.resume();
      console.log('Screen sharing resumed');
    } else {
      manager.pause();
      console.log('Screen sharing paused');
    }
    isPaused = !isPaused;
  };

  manager.on('sharing-paused', () => {
    console.log('Sharing is paused');
  });

  manager.on('sharing-resumed', () => {
    console.log('Sharing is resumed');
  });

  return togglePause;
}

/**
 * Example: Handle multiple remote shares
 */
export function exampleMultipleRemoteShares(manager: ScreenShareManager) {
  manager.on('remote-share-added', ({ shareId, stream, metadata }) => {
    console.log(`Remote share from ${metadata.userName}`);

    // Create video element for this share
    const container = document.getElementById('remote-shares');
    if (container) {
      const video = document.createElement('video');
      video.id = `share-${shareId}`;
      video.srcObject = stream;
      video.autoplay = true;

      const label = document.createElement('div');
      label.textContent = metadata.userName;

      const wrapper = document.createElement('div');
      wrapper.appendChild(label);
      wrapper.appendChild(video);

      container.appendChild(wrapper);
    }
  });

  manager.on('remote-share-removed', ({ shareId }) => {
    const video = document.getElementById(`share-${shareId}`);
    video?.parentElement?.remove();
  });
}
