/**
 * Video Conference Room Management Example
 *
 * Demonstrates how to create and manage multi-user video conference rooms
 * with participant tracking, permissions, and room controls.
 */

import { EventEmitter } from 'events';
import { WebRTCPeer } from './webrtc-setup.js';

// Room participant
export interface Participant {
  id: string;
  name: string;
  role: 'host' | 'moderator' | 'participant' | 'guest';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
  metadata?: Record<string, any>;
}

// Room configuration
export interface RoomConfig {
  id: string;
  name: string;
  maxParticipants?: number;
  isLocked?: boolean;
  password?: string;
  requireApproval?: boolean;
  recordingEnabled?: boolean;
  chatEnabled?: boolean;
  screenShareLimit?: number;
}

// Room state
export interface RoomState {
  id: string;
  name: string;
  participants: Map<string, Participant>;
  host: string;
  isLocked: boolean;
  isRecording: boolean;
  startedAt: Date;
  config: RoomConfig;
}

/**
 * Video Conference Room Manager
 *
 * Manages multi-user video conference rooms with WebRTC
 */
export class VideoRoom extends EventEmitter {
  private room: RoomState;
  private peers: Map<string, WebRTCPeer> = new Map();
  private pendingParticipants: Set<string> = new Set();
  private localUserId: string;
  private signalingSocket: any; // Replace with actual Socket.IO type

  constructor(
    roomConfig: RoomConfig,
    localUserId: string,
    signalingSocket: any
  ) {
    super();

    this.localUserId = localUserId;
    this.signalingSocket = signalingSocket;

    this.room = {
      id: roomConfig.id,
      name: roomConfig.name,
      participants: new Map(),
      host: localUserId,
      isLocked: roomConfig.isLocked ?? false,
      isRecording: false,
      startedAt: new Date(),
      config: {
        maxParticipants: 50,
        requireApproval: false,
        recordingEnabled: false,
        chatEnabled: true,
        screenShareLimit: 1,
        ...roomConfig,
      },
    };

    this.setupSignalingListeners();
  }

  /**
   * Setup signaling server listeners
   */
  private setupSignalingListeners(): void {
    // User joined room
    this.signalingSocket.on('user-joined', async (userId: string, participantInfo: Partial<Participant>) => {
      console.log(`User ${userId} joined room ${this.room.id}`);

      // Add participant to room
      const participant: Participant = {
        id: userId,
        name: participantInfo.name ?? `User ${userId}`,
        role: participantInfo.role ?? 'participant',
        isVideoEnabled: true,
        isAudioEnabled: true,
        isScreenSharing: false,
        joinedAt: new Date(),
        metadata: participantInfo.metadata,
      };

      this.room.participants.set(userId, participant);
      this.emit('participant-joined', participant);

      // Create peer connection if not already exists
      if (!this.peers.has(userId)) {
        await this.createPeerConnection(userId);
      }
    });

    // User left room
    this.signalingSocket.on('user-left', (userId: string) => {
      console.log(`User ${userId} left room ${this.room.id}`);
      this.removeParticipant(userId);
    });

    // WebRTC offer received
    this.signalingSocket.on('offer', async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
      const peer = this.peers.get(fromUserId);
      if (!peer) {
        const newPeer = await this.createPeerConnection(fromUserId);
        const answer = await newPeer.handleOffer(offer);
        this.signalingSocket.emit('answer', this.room.id, answer, fromUserId);
      } else {
        const answer = await peer.handleOffer(offer);
        this.signalingSocket.emit('answer', this.room.id, answer, fromUserId);
      }
    });

    // WebRTC answer received
    this.signalingSocket.on('answer', async (answer: RTCSessionDescriptionInit, fromUserId: string) => {
      const peer = this.peers.get(fromUserId);
      if (peer) {
        await peer.handleAnswer(answer);
      }
    });

    // ICE candidate received
    this.signalingSocket.on('ice-candidate', async (candidate: RTCIceCandidateInit, fromUserId: string) => {
      const peer = this.peers.get(fromUserId);
      if (peer) {
        await peer.addIceCandidate(candidate);
      }
    });

    // Participant media state changed
    this.signalingSocket.on('media-state-changed', (userId: string, state: { video: boolean; audio: boolean }) => {
      const participant = this.room.participants.get(userId);
      if (participant) {
        participant.isVideoEnabled = state.video;
        participant.isAudioEnabled = state.audio;
        this.emit('participant-media-changed', participant);
      }
    });

    // Join request (when approval required)
    this.signalingSocket.on('join-request', (userId: string, userInfo: any) => {
      if (this.room.config.requireApproval && this.isHost()) {
        this.pendingParticipants.add(userId);
        this.emit('join-request', { userId, userInfo });
      }
    });
  }

  /**
   * Create peer connection for a participant
   */
  private async createPeerConnection(userId: string): Promise<WebRTCPeer> {
    const peer = new WebRTCPeer(userId);

    // Initialize local media if not already done
    if (!peer.getLocalStream()) {
      await peer.initializeLocalStream();
    }

    peer.createPeerConnection();

    // Handle ICE candidates
    peer.on('ice-candidate', (data: any) => {
      this.signalingSocket.emit('ice-candidate', this.room.id, data.candidate);
    });

    // Handle remote stream
    peer.on('remote-stream', (stream: MediaStream) => {
      this.emit('participant-stream', { userId, stream });
    });

    // Handle connection state
    peer.on('connection-state-change', (state: RTCPeerConnectionState) => {
      console.log(`Connection to ${userId}:`, state);
      if (state === 'failed' || state === 'disconnected') {
        this.emit('participant-connection-lost', userId);
      }
    });

    this.peers.set(userId, peer);

    // Create and send offer
    const offer = await peer.createOffer();
    this.signalingSocket.emit('offer', this.room.id, offer, userId);

    return peer;
  }

  /**
   * Join the room
   */
  async join(userInfo: Partial<Participant>): Promise<void> {
    // Join room via signaling server
    this.signalingSocket.emit('join-room', this.room.id, this.localUserId, userInfo);

    // Add self to participants
    const participant: Participant = {
      id: this.localUserId,
      name: userInfo.name ?? `User ${this.localUserId}`,
      role: userInfo.role ?? (this.isHost() ? 'host' : 'participant'),
      isVideoEnabled: true,
      isAudioEnabled: true,
      isScreenSharing: false,
      joinedAt: new Date(),
      metadata: userInfo.metadata,
    };

    this.room.participants.set(this.localUserId, participant);
    this.emit('joined', this.room);
  }

  /**
   * Leave the room
   */
  leave(): void {
    // Close all peer connections
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();

    // Leave room via signaling server
    this.signalingSocket.emit('leave-room', this.room.id, this.localUserId);

    this.emit('left', this.room.id);
  }

  /**
   * Remove a participant
   */
  private removeParticipant(userId: string): void {
    const participant = this.room.participants.get(userId);
    if (!participant) return;

    // Close peer connection
    const peer = this.peers.get(userId);
    if (peer) {
      peer.close();
      this.peers.delete(userId);
    }

    // Remove from participants
    this.room.participants.delete(userId);

    this.emit('participant-left', participant);
  }

  /**
   * Kick a participant (host/moderator only)
   */
  kickParticipant(userId: string): boolean {
    if (!this.canModerate()) return false;
    if (userId === this.localUserId) return false;

    this.signalingSocket.emit('kick-participant', this.room.id, userId);
    this.removeParticipant(userId);

    return true;
  }

  /**
   * Approve join request (host/moderator only)
   */
  approveJoinRequest(userId: string): boolean {
    if (!this.canModerate()) return false;

    if (this.pendingParticipants.has(userId)) {
      this.signalingSocket.emit('approve-join', this.room.id, userId);
      this.pendingParticipants.delete(userId);
      return true;
    }

    return false;
  }

  /**
   * Deny join request (host/moderator only)
   */
  denyJoinRequest(userId: string): boolean {
    if (!this.canModerate()) return false;

    if (this.pendingParticipants.has(userId)) {
      this.signalingSocket.emit('deny-join', this.room.id, userId);
      this.pendingParticipants.delete(userId);
      return true;
    }

    return false;
  }

  /**
   * Toggle room lock (host/moderator only)
   */
  toggleLock(): boolean {
    if (!this.canModerate()) return false;

    this.room.isLocked = !this.room.isLocked;
    this.signalingSocket.emit('toggle-lock', this.room.id, this.room.isLocked);
    this.emit('room-locked', this.room.isLocked);

    return this.room.isLocked;
  }

  /**
   * Mute participant (host/moderator only)
   */
  muteParticipant(userId: string): boolean {
    if (!this.canModerate()) return false;

    this.signalingSocket.emit('mute-participant', this.room.id, userId);
    return true;
  }

  /**
   * Mute all participants (host/moderator only)
   */
  muteAll(excludeSelf: boolean = true): boolean {
    if (!this.canModerate()) return false;

    this.room.participants.forEach((participant) => {
      if (excludeSelf && participant.id === this.localUserId) return;
      this.muteParticipant(participant.id);
    });

    return true;
  }

  /**
   * Toggle local video
   */
  toggleVideo(enabled?: boolean): boolean {
    const peer = this.peers.values().next().value as WebRTCPeer | undefined;
    if (!peer) return false;

    const isEnabled = peer.toggleVideo(enabled);

    // Update local participant
    const participant = this.room.participants.get(this.localUserId);
    if (participant) {
      participant.isVideoEnabled = isEnabled;
      this.signalingSocket.emit('media-state-changed', this.room.id, {
        video: isEnabled,
        audio: participant.isAudioEnabled,
      });
    }

    return isEnabled;
  }

  /**
   * Toggle local audio
   */
  toggleAudio(enabled?: boolean): boolean {
    const peer = this.peers.values().next().value as WebRTCPeer | undefined;
    if (!peer) return false;

    const isEnabled = peer.toggleAudio(enabled);

    // Update local participant
    const participant = this.room.participants.get(this.localUserId);
    if (participant) {
      participant.isAudioEnabled = isEnabled;
      this.signalingSocket.emit('media-state-changed', this.room.id, {
        video: participant.isVideoEnabled,
        audio: isEnabled,
      });
    }

    return isEnabled;
  }

  /**
   * Get all participants
   */
  getParticipants(): Participant[] {
    return Array.from(this.room.participants.values());
  }

  /**
   * Get participant by ID
   */
  getParticipant(userId: string): Participant | undefined {
    return this.room.participants.get(userId);
  }

  /**
   * Get participant count
   */
  getParticipantCount(): number {
    return this.room.participants.size;
  }

  /**
   * Check if current user is host
   */
  isHost(): boolean {
    return this.localUserId === this.room.host;
  }

  /**
   * Check if current user can moderate
   */
  canModerate(): boolean {
    const participant = this.room.participants.get(this.localUserId);
    return participant?.role === 'host' || participant?.role === 'moderator';
  }

  /**
   * Get room info
   */
  getRoomInfo(): RoomState {
    return { ...this.room };
  }

  /**
   * Update participant role (host only)
   */
  updateParticipantRole(userId: string, role: Participant['role']): boolean {
    if (!this.isHost()) return false;

    const participant = this.room.participants.get(userId);
    if (!participant) return false;

    participant.role = role;
    this.signalingSocket.emit('role-updated', this.room.id, userId, role);
    this.emit('participant-role-updated', participant);

    return true;
  }

  /**
   * Transfer host privileges (host only)
   */
  transferHost(userId: string): boolean {
    if (!this.isHost()) return false;

    const participant = this.room.participants.get(userId);
    if (!participant) return false;

    // Update old host to moderator
    const oldHost = this.room.participants.get(this.room.host);
    if (oldHost) {
      oldHost.role = 'moderator';
    }

    // Update new host
    participant.role = 'host';
    this.room.host = userId;

    this.signalingSocket.emit('host-transferred', this.room.id, userId);
    this.emit('host-transferred', userId);

    return true;
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Create and join a room as host
 */
export async function exampleCreateRoom(signalingSocket: any) {
  const roomConfig: RoomConfig = {
    id: 'room-123',
    name: 'Team Meeting',
    maxParticipants: 10,
    isLocked: false,
    requireApproval: false,
    chatEnabled: true,
  };

  const room = new VideoRoom(roomConfig, 'user-host-123', signalingSocket);

  // Set up event listeners
  room.on('joined', (roomState: RoomState) => {
    console.log('Successfully joined room:', roomState.name);
    console.log('Participants:', roomState.participants.size);
  });

  room.on('participant-joined', (participant: Participant) => {
    console.log(`${participant.name} joined the room`);
  });

  room.on('participant-left', (participant: Participant) => {
    console.log(`${participant.name} left the room`);
  });

  room.on('participant-stream', ({ userId, stream }: { userId: string; stream: MediaStream }) => {
    console.log(`Received stream from ${userId}`);
    // Attach stream to video element
    const videoElement = document.getElementById(`video-${userId}`) as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  });

  room.on('participant-media-changed', (participant: Participant) => {
    console.log(`${participant.name} media state:`, {
      video: participant.isVideoEnabled,
      audio: participant.isAudioEnabled,
    });
  });

  // Join the room
  await room.join({
    name: 'John Doe',
    role: 'host',
    metadata: { department: 'Engineering' },
  });

  return room;
}

/**
 * Example: Join existing room as participant
 */
export async function exampleJoinRoom(signalingSocket: any) {
  const room = new VideoRoom(
    {
      id: 'room-123',
      name: 'Team Meeting',
    },
    'user-participant-456',
    signalingSocket
  );

  await room.join({
    name: 'Jane Smith',
    role: 'participant',
  });

  return room;
}

/**
 * Example: Room moderation
 */
export async function exampleRoomModeration(room: VideoRoom) {
  // Mute all participants
  room.muteAll(true); // Exclude self

  // Kick a participant
  room.kickParticipant('user-troublemaker');

  // Lock the room
  room.toggleLock();

  // Update participant role
  room.updateParticipantRole('user-456', 'moderator');

  // Transfer host
  room.transferHost('user-789');
}

/**
 * Example: Room with approval required
 */
export async function exampleRoomWithApproval(signalingSocket: any) {
  const room = new VideoRoom(
    {
      id: 'room-secure',
      name: 'Executive Meeting',
      requireApproval: true,
    },
    'user-host',
    signalingSocket
  );

  // Handle join requests
  room.on('join-request', ({ userId, userInfo }: any) => {
    console.log(`Join request from ${userInfo.name}`);

    // Auto-approve based on criteria
    if (userInfo.metadata?.department === 'Executive') {
      room.approveJoinRequest(userId);
    } else {
      room.denyJoinRequest(userId);
    }
  });

  await room.join({ name: 'CEO', role: 'host' });

  return room;
}

/**
 * Example: Monitor room statistics
 */
export function exampleMonitorRoom(room: VideoRoom) {
  setInterval(() => {
    const participants = room.getParticipants();

    console.log('Room Statistics:');
    console.log('- Total participants:', participants.length);
    console.log('- Video enabled:', participants.filter((p) => p.isVideoEnabled).length);
    console.log('- Audio enabled:', participants.filter((p) => p.isAudioEnabled).length);
    console.log('- Screen sharing:', participants.filter((p) => p.isScreenSharing).length);

    // Log each participant
    participants.forEach((p) => {
      console.log(`  - ${p.name} (${p.role}):`, {
        video: p.isVideoEnabled,
        audio: p.isAudioEnabled,
        duration: Math.floor((Date.now() - p.joinedAt.getTime()) / 1000) + 's',
      });
    });
  }, 10000);
}
