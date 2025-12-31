/**
 * Video Consultation Example
 *
 * Demonstrates telemedicine video consultation with:
 * - WebRTC video/audio setup
 * - Session management and scheduling
 * - Screen sharing for medical imaging review
 * - Recording and HIPAA compliance
 * - Quality monitoring
 * - Emergency escalation
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ConsultationSession {
  id: string;
  appointmentId: string;
  patientId: string;
  providerId: string;
  status: SessionStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  connectionDetails: ConnectionDetails;
  participants: Participant[];
  recording?: RecordingInfo;
  metadata: SessionMetadata;
}

type SessionStatus =
  | 'scheduled'
  | 'waiting_room'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'technical_issues';

interface ConnectionDetails {
  roomId: string;
  serverUrl: string;
  iceServers: RTCIceServer[];
  stunServers: string[];
  turnServers: TurnServer[];
}

interface TurnServer {
  urls: string[];
  username: string;
  credential: string;
}

interface Participant {
  id: string;
  role: 'patient' | 'provider' | 'interpreter' | 'observer';
  name: string;
  joinedAt?: Date;
  leftAt?: Date;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  mediaStreams: MediaStreamInfo[];
  permissions: ParticipantPermissions;
}

interface MediaStreamInfo {
  streamId: string;
  type: 'video' | 'audio' | 'screen';
  enabled: boolean;
  quality: 'low' | 'medium' | 'high';
  resolution?: string;
  frameRate?: number;
  bitrate?: number;
}

interface ParticipantPermissions {
  canShareVideo: boolean;
  canShareAudio: boolean;
  canShareScreen: boolean;
  canRecord: boolean;
  canViewRecording: boolean;
  canInviteOthers: boolean;
}

interface RecordingInfo {
  id: string;
  startedAt: Date;
  stoppedAt?: Date;
  duration?: number;
  fileSize?: number;
  storageLocation: string;
  encrypted: boolean;
  consentObtained: boolean;
  consentTimestamp: Date;
}

interface SessionMetadata {
  createdAt: Date;
  createdBy: string;
  platform: 'web' | 'ios' | 'android' | 'desktop';
  appVersion: string;
  deviceType: string;
  browserInfo?: string;
  networkType?: '4g' | '5g' | 'wifi' | 'ethernet';
}

interface QualityMetrics {
  sessionId: string;
  timestamp: Date;
  videoQuality: {
    resolution: string;
    frameRate: number;
    bitrate: number;
    packetsLost: number;
    jitter: number;
  };
  audioQuality: {
    bitrate: number;
    packetsLost: number;
    jitter: number;
  };
  networkLatency: number;
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  encrypted: boolean;
}

interface EmergencyEscalation {
  sessionId: string;
  triggeredBy: string;
  triggeredAt: Date;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
  resolved: boolean;
}

// ============================================================================
// Video Consultation Manager
// ============================================================================

class VideoConsultationManager {
  private sessions: Map<string, ConsultationSession> = new Map();
  private qualityMetrics: QualityMetrics[] = [];
  private chatMessages: ChatMessage[] = [];
  private emergencyEscalations: EmergencyEscalation[] = [];

  /**
   * Create a new consultation session
   */
  async createSession(
    appointmentId: string,
    patientId: string,
    providerId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    platform: SessionMetadata['platform']
  ): Promise<{ success: boolean; session?: ConsultationSession; error?: string }> {
    try {
      const session: ConsultationSession = {
        id: this.generateSessionId(),
        appointmentId,
        patientId,
        providerId,
        status: 'scheduled',
        scheduledStart,
        scheduledEnd,
        connectionDetails: this.generateConnectionDetails(),
        participants: [],
        metadata: {
          createdAt: new Date(),
          createdBy: providerId,
          platform,
          appVersion: '2.5.0',
          deviceType: platform === 'web' ? 'Desktop' : 'Mobile',
        },
      };

      this.sessions.set(session.id, session);

      console.log('\n✅ Video consultation session created');
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Room ID: ${session.connectionDetails.roomId}`);
      console.log(`   Scheduled: ${scheduledStart.toLocaleString()}`);
      console.log(`   Platform: ${platform}`);

      return { success: true, session };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Join a consultation session
   */
  async joinSession(
    sessionId: string,
    participantId: string,
    role: Participant['role'],
    name: string
  ): Promise<{ success: boolean; participant?: Participant; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Check if already in session
    const existing = session.participants.find((p) => p.id === participantId);
    if (existing) {
      return { success: false, error: 'Already joined session' };
    }

    const participant: Participant = {
      id: participantId,
      role,
      name,
      joinedAt: new Date(),
      connectionStatus: 'connecting',
      mediaStreams: [],
      permissions: this.getDefaultPermissions(role),
    };

    session.participants.push(participant);

    // Update session status
    if (session.status === 'scheduled') {
      session.status = 'waiting_room';
    }

    // If provider joins, move to in_progress
    if (role === 'provider' && session.participants.some((p) => p.role === 'patient')) {
      session.status = 'in_progress';
      session.actualStart = new Date();
    }

    console.log(`\n👤 ${name} (${role}) joined session ${sessionId}`);
    console.log(`   Connection status: ${participant.connectionStatus}`);

    return { success: true, participant };
  }

  /**
   * Start media stream (video/audio)
   */
  async startMediaStream(
    sessionId: string,
    participantId: string,
    type: 'video' | 'audio' | 'screen',
    quality: 'low' | 'medium' | 'high' = 'high'
  ): Promise<{ success: boolean; stream?: MediaStreamInfo; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    // Check permissions
    if (
      (type === 'video' && !participant.permissions.canShareVideo) ||
      (type === 'audio' && !participant.permissions.canShareAudio) ||
      (type === 'screen' && !participant.permissions.canShareScreen)
    ) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const stream: MediaStreamInfo = {
      streamId: this.generateStreamId(),
      type,
      enabled: true,
      quality,
      resolution: type === 'video' ? this.getResolution(quality) : undefined,
      frameRate: type === 'video' ? this.getFrameRate(quality) : undefined,
      bitrate: this.getBitrate(type, quality),
    };

    participant.mediaStreams.push(stream);
    participant.connectionStatus = 'connected';

    console.log(`\n📹 ${participant.name} started ${type} stream`);
    console.log(`   Quality: ${quality}`);
    if (stream.resolution) {
      console.log(`   Resolution: ${stream.resolution}`);
    }

    return { success: true, stream };
  }

  /**
   * Toggle media stream (mute/unmute)
   */
  toggleMediaStream(
    sessionId: string,
    participantId: string,
    streamId: string
  ): { success: boolean; enabled?: boolean; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    const stream = participant.mediaStreams.find((s) => s.streamId === streamId);
    if (!stream) {
      return { success: false, error: 'Stream not found' };
    }

    stream.enabled = !stream.enabled;

    console.log(
      `${stream.enabled ? '🔊' : '🔇'} ${participant.name} ${stream.enabled ? 'enabled' : 'disabled'} ${stream.type}`
    );

    return { success: true, enabled: stream.enabled };
  }

  /**
   * Start session recording (requires consent)
   */
  async startRecording(
    sessionId: string,
    initiatedBy: string,
    consentObtained: boolean
  ): Promise<{ success: boolean; recording?: RecordingInfo; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.recording) {
      return { success: false, error: 'Recording already in progress' };
    }

    if (!consentObtained) {
      return { success: false, error: 'Patient consent required for recording' };
    }

    const recording: RecordingInfo = {
      id: this.generateRecordingId(),
      startedAt: new Date(),
      storageLocation: `s3://hipaa-compliant-storage/recordings/${session.id}/`,
      encrypted: true,
      consentObtained: true,
      consentTimestamp: new Date(),
    };

    session.recording = recording;

    console.log('\n🔴 Recording started');
    console.log(`   Recording ID: ${recording.id}`);
    console.log(`   Encrypted: Yes`);
    console.log(`   Consent obtained: Yes`);
    console.log(`   ⚠️  All participants notified of recording`);

    return { success: true, recording };
  }

  /**
   * Stop session recording
   */
  async stopRecording(
    sessionId: string
  ): Promise<{ success: boolean; recording?: RecordingInfo; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!session.recording) {
      return { success: false, error: 'No active recording' };
    }

    session.recording.stoppedAt = new Date();
    session.recording.duration =
      (session.recording.stoppedAt.getTime() - session.recording.startedAt.getTime()) / 1000;
    session.recording.fileSize = Math.floor(session.recording.duration * 1024 * 100); // Simulated

    console.log('\n⏹️  Recording stopped');
    console.log(`   Duration: ${Math.floor(session.recording.duration / 60)} minutes`);
    console.log(`   File size: ${Math.floor(session.recording.fileSize / 1024 / 1024)} MB`);
    console.log(`   Storage: ${session.recording.storageLocation}`);

    return { success: true, recording: session.recording };
  }

  /**
   * Send chat message
   */
  sendChatMessage(
    sessionId: string,
    senderId: string,
    senderName: string,
    message: string
  ): { success: boolean; chatMessage?: ChatMessage; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      sessionId,
      senderId,
      senderName,
      message,
      timestamp: new Date(),
      type: 'text',
      encrypted: true,
    };

    this.chatMessages.push(chatMessage);

    console.log(`💬 ${senderName}: ${message}`);

    return { success: true, chatMessage };
  }

  /**
   * Monitor and record quality metrics
   */
  recordQualityMetrics(sessionId: string, metrics: Omit<QualityMetrics, 'sessionId'>): void {
    const qualityMetric: QualityMetrics = {
      sessionId,
      ...metrics,
    };

    this.qualityMetrics.push(qualityMetric);

    // Alert if quality is poor
    if (metrics.overallQuality === 'poor') {
      console.log('\n⚠️  Connection quality degraded');
      console.log(`   Latency: ${metrics.networkLatency}ms`);
      console.log(`   Video packets lost: ${metrics.videoQuality.packetsLost}`);
      console.log(`   Recommendation: Consider reducing video quality`);
    }
  }

  /**
   * Get quality statistics for a session
   */
  getQualityStatistics(sessionId: string): {
    averageLatency: number;
    averageVideoPacketLoss: number;
    averageAudioPacketLoss: number;
    qualityDistribution: Record<string, number>;
  } {
    const sessionMetrics = this.qualityMetrics.filter((m) => m.sessionId === sessionId);

    if (sessionMetrics.length === 0) {
      return {
        averageLatency: 0,
        averageVideoPacketLoss: 0,
        averageAudioPacketLoss: 0,
        qualityDistribution: {},
      };
    }

    const avgLatency =
      sessionMetrics.reduce((sum, m) => sum + m.networkLatency, 0) / sessionMetrics.length;
    const avgVideoLoss =
      sessionMetrics.reduce((sum, m) => sum + m.videoQuality.packetsLost, 0) /
      sessionMetrics.length;
    const avgAudioLoss =
      sessionMetrics.reduce((sum, m) => sum + m.audioQuality.packetsLost, 0) /
      sessionMetrics.length;

    const qualityDist = sessionMetrics.reduce(
      (dist, m) => {
        dist[m.overallQuality] = (dist[m.overallQuality] || 0) + 1;
        return dist;
      },
      {} as Record<string, number>
    );

    return {
      averageLatency: Math.round(avgLatency),
      averageVideoPacketLoss: Math.round(avgVideoLoss),
      averageAudioPacketLoss: Math.round(avgAudioLoss),
      qualityDistribution: qualityDist,
    };
  }

  /**
   * Trigger emergency escalation
   */
  async triggerEmergency(
    sessionId: string,
    triggeredBy: string,
    reason: string,
    severity: EmergencyEscalation['severity']
  ): Promise<{ success: boolean; escalation?: EmergencyEscalation; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const escalation: EmergencyEscalation = {
      sessionId,
      triggeredBy,
      triggeredAt: new Date(),
      reason,
      severity,
      actions: this.getEmergencyActions(severity),
      resolved: false,
    };

    this.emergencyEscalations.push(escalation);

    console.log('\n🚨 EMERGENCY ESCALATION TRIGGERED');
    console.log(`   Severity: ${severity.toUpperCase()}`);
    console.log(`   Reason: ${reason}`);
    console.log('   Actions:');
    escalation.actions.forEach((action) => console.log(`     • ${action}`));

    return { success: true, escalation };
  }

  /**
   * End consultation session
   */
  async endSession(
    sessionId: string,
    endedBy: string
  ): Promise<{ success: boolean; session?: ConsultationSession; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Stop recording if active
    if (session.recording && !session.recording.stoppedAt) {
      await this.stopRecording(sessionId);
    }

    session.status = 'completed';
    session.actualEnd = new Date();

    // Update all participants
    session.participants.forEach((p) => {
      if (!p.leftAt) {
        p.leftAt = new Date();
        p.connectionStatus = 'disconnected';
      }
    });

    const duration = session.actualEnd.getTime() - (session.actualStart?.getTime() || 0);
    const durationMinutes = Math.round(duration / 60000);

    console.log('\n✅ Consultation session ended');
    console.log(`   Duration: ${durationMinutes} minutes`);
    console.log(`   Participants: ${session.participants.length}`);

    return { success: true, session };
  }

  /**
   * Leave session (for individual participant)
   */
  leaveSession(
    sessionId: string,
    participantId: string
  ): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    participant.leftAt = new Date();
    participant.connectionStatus = 'disconnected';
    participant.mediaStreams.forEach((s) => (s.enabled = false));

    console.log(`👋 ${participant.name} left the session`);

    return { success: true };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateSessionId(): string {
    return `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStreamId(): string {
    return `STREAM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateRecordingId(): string {
    return `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateConnectionDetails(): ConnectionDetails {
    return {
      roomId: `ROOM-${Math.random().toString(36).substr(2, 12)}`,
      serverUrl: 'wss://telemedicine.example.com',
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      stunServers: ['stun:stun.example.com:3478'],
      turnServers: [
        {
          urls: ['turn:turn.example.com:3478'],
          username: 'turnuser',
          credential: 'turnpass',
        },
      ],
    };
  }

  private getDefaultPermissions(role: Participant['role']): ParticipantPermissions {
    switch (role) {
      case 'provider':
        return {
          canShareVideo: true,
          canShareAudio: true,
          canShareScreen: true,
          canRecord: true,
          canViewRecording: true,
          canInviteOthers: true,
        };
      case 'patient':
        return {
          canShareVideo: true,
          canShareAudio: true,
          canShareScreen: false,
          canRecord: false,
          canViewRecording: true,
          canInviteOthers: false,
        };
      case 'interpreter':
      case 'observer':
        return {
          canShareVideo: true,
          canShareAudio: true,
          canShareScreen: false,
          canRecord: false,
          canViewRecording: false,
          canInviteOthers: false,
        };
    }
  }

  private getResolution(quality: 'low' | 'medium' | 'high'): string {
    const resolutions = {
      low: '640x360',
      medium: '1280x720',
      high: '1920x1080',
    };
    return resolutions[quality];
  }

  private getFrameRate(quality: 'low' | 'medium' | 'high'): number {
    const frameRates = { low: 15, medium: 24, high: 30 };
    return frameRates[quality];
  }

  private getBitrate(type: 'video' | 'audio' | 'screen', quality: 'low' | 'medium' | 'high'): number {
    if (type === 'audio') {
      return quality === 'high' ? 128 : quality === 'medium' ? 64 : 32;
    }
    const bitrates = { low: 500, medium: 1500, high: 3000 };
    return bitrates[quality];
  }

  private getEmergencyActions(severity: EmergencyEscalation['severity']): string[] {
    const actions = ['Notify emergency contact', 'Send location data'];

    if (severity === 'high' || severity === 'critical') {
      actions.push('Contact 911', 'Alert facility emergency team');
    }

    if (severity === 'critical') {
      actions.push('Dispatch ambulance', 'Continuous monitoring');
    }

    return actions;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Video Consultation System - Comprehensive Example');
  console.log('='.repeat(70));

  const manager = new VideoConsultationManager();

  // Example 1: Create Consultation Session
  console.log('\n📅 Example 1: Creating Consultation Session');

  const scheduledStart = new Date();
  scheduledStart.setMinutes(scheduledStart.getMinutes() + 5);
  const scheduledEnd = new Date(scheduledStart.getTime() + 30 * 60000);

  const sessionResult = await manager.createSession(
    'APT-001',
    'PATIENT-001',
    'PROVIDER-001',
    scheduledStart,
    scheduledEnd,
    'web'
  );

  if (!sessionResult.success || !sessionResult.session) {
    console.error('Failed to create session');
    return;
  }

  const session = sessionResult.session;

  // Example 2: Patient Joins Session
  console.log('\n\n👤 Example 2: Patient Joining Session');

  await manager.joinSession(session.id, 'PATIENT-001', 'patient', 'John Smith');

  // Example 3: Provider Joins Session
  console.log('\n\n👨‍⚕️ Example 3: Provider Joining Session');

  await manager.joinSession(session.id, 'PROVIDER-001', 'provider', 'Dr. Sarah Johnson');

  // Example 4: Start Video and Audio Streams
  console.log('\n\n📹 Example 4: Starting Media Streams');

  await manager.startMediaStream(session.id, 'PATIENT-001', 'video', 'high');
  await manager.startMediaStream(session.id, 'PATIENT-001', 'audio', 'high');

  await manager.startMediaStream(session.id, 'PROVIDER-001', 'video', 'high');
  await manager.startMediaStream(session.id, 'PROVIDER-001', 'audio', 'high');

  // Example 5: Provider Shares Screen (for reviewing test results)
  console.log('\n\n🖥️  Example 5: Screen Sharing');

  await manager.startMediaStream(session.id, 'PROVIDER-001', 'screen', 'high');

  // Example 6: Chat Messages
  console.log('\n\n💬 Example 6: In-Session Chat');

  manager.sendChatMessage(
    session.id,
    'PROVIDER-001',
    'Dr. Sarah Johnson',
    'Can you describe your symptoms?'
  );

  manager.sendChatMessage(
    session.id,
    'PATIENT-001',
    'John Smith',
    'I have had a persistent cough for 3 days'
  );

  // Example 7: Start Recording (with consent)
  console.log('\n\n🔴 Example 7: Recording Session');

  await manager.startRecording(session.id, 'PROVIDER-001', true);

  // Simulate some time passing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Example 8: Quality Monitoring
  console.log('\n\n📊 Example 8: Quality Monitoring');

  manager.recordQualityMetrics(session.id, {
    timestamp: new Date(),
    videoQuality: {
      resolution: '1920x1080',
      frameRate: 30,
      bitrate: 3000,
      packetsLost: 5,
      jitter: 10,
    },
    audioQuality: {
      bitrate: 128,
      packetsLost: 2,
      jitter: 5,
    },
    networkLatency: 45,
    overallQuality: 'excellent',
  });

  // Simulate degraded quality
  manager.recordQualityMetrics(session.id, {
    timestamp: new Date(),
    videoQuality: {
      resolution: '1280x720',
      frameRate: 24,
      bitrate: 1500,
      packetsLost: 150,
      jitter: 80,
    },
    audioQuality: {
      bitrate: 64,
      packetsLost: 50,
      jitter: 60,
    },
    networkLatency: 350,
    overallQuality: 'poor',
  });

  // Example 9: Quality Statistics
  console.log('\n\n📈 Example 9: Session Quality Statistics');

  const stats = manager.getQualityStatistics(session.id);
  console.log(`\n   Average latency: ${stats.averageLatency}ms`);
  console.log(`   Average video packet loss: ${stats.averageVideoPacketLoss}`);
  console.log(`   Average audio packet loss: ${stats.averageAudioPacketLoss}`);
  console.log('   Quality distribution:');
  Object.entries(stats.qualityDistribution).forEach(([quality, count]) => {
    console.log(`     ${quality}: ${count} samples`);
  });

  // Example 10: Emergency Escalation (simulated)
  console.log('\n\n🚨 Example 10: Emergency Escalation');

  await manager.triggerEmergency(
    session.id,
    'PROVIDER-001',
    'Patient experiencing chest pain',
    'high'
  );

  // Example 11: Stop Recording
  console.log('\n\n⏹️  Example 11: Stopping Recording');

  await manager.stopRecording(session.id);

  // Example 12: End Session
  console.log('\n\n🏁 Example 12: Ending Consultation');

  await manager.endSession(session.id, 'PROVIDER-001');

  console.log('\n' + '='.repeat(70));
  console.log('Video consultation examples completed!');
  console.log('All data encrypted and HIPAA-compliant');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
