/**
 * Video Conference Meeting Management Examples
 *
 * This example demonstrates:
 * - Scheduling and creating meetings
 * - Joining and leaving video calls
 * - Screen sharing and recording
 * - Managing participants and permissions
 * - Meeting chat and reactions
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for meeting operations
interface MeetingCreationData {
  title: string;
  description?: string;
  hostId: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  timezone: string;
  maxParticipants?: number;
  requiresPassword: boolean;
  password?: string;
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
  allowScreenSharing: boolean;
  allowChat: boolean;
}

interface ParticipantData {
  userId: string;
  role: ParticipantRole;
  displayName?: string;
}

interface ScreenShareData {
  participantId: string;
  screenType: 'FULL_SCREEN' | 'WINDOW' | 'TAB';
  resolution?: string;
}

type MeetingStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'ENDED'
  | 'CANCELLED';

type ParticipantRole =
  | 'HOST'
  | 'CO_HOST'
  | 'PARTICIPANT'
  | 'GUEST';

type ParticipantStatus =
  | 'INVITED'
  | 'WAITING'
  | 'JOINED'
  | 'LEFT'
  | 'REMOVED';

/**
 * Schedule a new meeting
 *
 * @param data - Meeting creation details
 * @returns Created meeting object
 */
export async function scheduleMeeting(data: MeetingCreationData) {
  try {
    // Validate dates
    if (data.scheduledEndTime <= data.scheduledStartTime) {
      throw new Error('End time must be after start time');
    }

    const now = new Date();
    if (data.scheduledStartTime < now) {
      throw new Error('Cannot schedule meeting in the past');
    }

    // Generate meeting ID and join link
    const meetingId = generateMeetingId();
    const joinUrl = `https://meet.example.com/${meetingId}`;

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.requiresPassword && data.password) {
      // In production, use proper password hashing (e.g., bcrypt)
      hashedPassword = Buffer.from(data.password).toString('base64');
    }

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        meetingId,
        joinUrl,
        hostId: data.hostId,
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime,
        timezone: data.timezone,
        status: 'SCHEDULED',
        maxParticipants: data.maxParticipants || 100,
        requiresPassword: data.requiresPassword,
        password: hashedPassword,
        recordingEnabled: data.recordingEnabled,
        waitingRoomEnabled: data.waitingRoomEnabled,
        allowScreenSharing: data.allowScreenSharing,
        allowChat: data.allowChat,
        createdAt: new Date()
      },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Add host as first participant
    await prisma.participant.create({
      data: {
        meetingId: meeting.id,
        userId: data.hostId,
        role: 'HOST',
        status: 'INVITED',
        joinedAt: null
      }
    });

    console.log('Meeting scheduled successfully:', {
      id: meeting.id,
      meetingId: meeting.meetingId,
      title: meeting.title,
      host: `${meeting.host.firstName} ${meeting.host.lastName}`,
      scheduledStart: meeting.scheduledStartTime,
      joinUrl: meeting.joinUrl
    });

    return meeting;
  } catch (error) {
    console.error('Error scheduling meeting:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Meeting ID already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Host user not found');
      }
    }

    throw error;
  }
}

/**
 * Generate unique meeting ID
 *
 * @returns Meeting ID
 */
function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let meetingId = '';
  for (let i = 0; i < 10; i++) {
    meetingId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return meetingId;
}

/**
 * Invite participants to a meeting
 *
 * @param meetingId - Meeting ID
 * @param participants - Array of participant data
 * @returns Created participant records
 */
export async function inviteParticipants(
  meetingId: string,
  participants: ParticipantData[]
) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Check max participants limit
    const currentCount = await prisma.participant.count({
      where: { meetingId }
    });

    if (currentCount + participants.length > meeting.maxParticipants) {
      throw new Error(
        `Cannot invite ${participants.length} participants. ` +
        `Maximum participants: ${meeting.maxParticipants}`
      );
    }

    // Create participant records
    const participantPromises = participants.map(async participant => {
      // Check if already invited
      const existing = await prisma.participant.findFirst({
        where: {
          meetingId,
          userId: participant.userId
        }
      });

      if (existing) {
        console.log(`User ${participant.userId} already invited`);
        return null;
      }

      const newParticipant = await prisma.participant.create({
        data: {
          meetingId,
          userId: participant.userId,
          role: participant.role,
          displayName: participant.displayName,
          status: 'INVITED',
          invitedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Send invitation notification
      await prisma.notification.create({
        data: {
          userId: participant.userId,
          type: 'MEETING_INVITATION',
          referenceId: meetingId,
          referenceType: 'MEETING',
          content: `You've been invited to "${meeting.title}"`,
          isRead: false,
          createdAt: new Date()
        }
      });

      return newParticipant;
    });

    const invited = (await Promise.all(participantPromises)).filter(p => p !== null);

    console.log('Participants invited:', {
      meetingId,
      meetingTitle: meeting.title,
      invitedCount: invited.length
    });

    return invited;
  } catch (error) {
    console.error('Error inviting participants:', error);
    throw error;
  }
}

/**
 * Join a meeting
 *
 * @param meetingId - Meeting ID
 * @param userId - User ID
 * @param password - Meeting password (if required)
 * @returns Participant object with session info
 */
export async function joinMeeting(
  meetingId: string,
  userId: string,
  password?: string
) {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: {
        OR: [
          { id: meetingId },
          { meetingId: meetingId }
        ]
      },
      include: {
        participants: {
          where: { userId }
        }
      }
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Check if meeting has started
    const now = new Date();
    if (meeting.status === 'SCHEDULED' && now < meeting.scheduledStartTime) {
      // Allow joining up to 15 minutes early
      const earlyJoinWindow = 15 * 60 * 1000; // 15 minutes in milliseconds
      if (now.getTime() < meeting.scheduledStartTime.getTime() - earlyJoinWindow) {
        throw new Error('Meeting has not started yet');
      }
    }

    if (meeting.status === 'ENDED') {
      throw new Error('Meeting has ended');
    }

    if (meeting.status === 'CANCELLED') {
      throw new Error('Meeting has been cancelled');
    }

    // Verify password if required
    if (meeting.requiresPassword) {
      if (!password) {
        throw new Error('Meeting password is required');
      }
      const hashedPassword = Buffer.from(password).toString('base64');
      if (hashedPassword !== meeting.password) {
        throw new Error('Incorrect meeting password');
      }
    }

    // Find or create participant record
    let participant = meeting.participants[0];

    if (!participant) {
      // Guest joining
      participant = await prisma.participant.create({
        data: {
          meetingId: meeting.id,
          userId,
          role: 'GUEST',
          status: meeting.waitingRoomEnabled ? 'WAITING' : 'JOINED',
          joinedAt: meeting.waitingRoomEnabled ? null : new Date()
        }
      });
    } else {
      // Update participant status
      participant = await prisma.participant.update({
        where: { id: participant.id },
        data: {
          status: meeting.waitingRoomEnabled ? 'WAITING' : 'JOINED',
          joinedAt: meeting.waitingRoomEnabled ? null : new Date()
        }
      });
    }

    // Start meeting if not started yet
    if (meeting.status === 'SCHEDULED') {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: 'IN_PROGRESS',
          actualStartTime: new Date()
        }
      });
    }

    // Increment participant count
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        participantCount: { increment: 1 }
      }
    });

    console.log('User joined meeting:', {
      meetingId: meeting.meetingId,
      userId,
      role: participant.role,
      status: participant.status
    });

    return {
      participant,
      meeting,
      requiresApproval: meeting.waitingRoomEnabled
    };
  } catch (error) {
    console.error('Error joining meeting:', error);
    throw error;
  }
}

/**
 * Admit participant from waiting room
 *
 * @param participantId - Participant ID
 * @param admittedBy - ID of user admitting the participant
 * @returns Updated participant
 */
export async function admitParticipant(
  participantId: string,
  admittedBy: string
) {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    if (participant.status !== 'WAITING') {
      throw new Error('Participant is not in waiting room');
    }

    // Update participant status
    const updated = await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'JOINED',
        joinedAt: new Date()
      }
    });

    console.log('Participant admitted:', {
      participant: `${participant.user.firstName} ${participant.user.lastName}`,
      admittedBy
    });

    return updated;
  } catch (error) {
    console.error('Error admitting participant:', error);
    throw error;
  }
}

/**
 * Leave a meeting
 *
 * @param participantId - Participant ID
 * @returns Updated participant
 */
export async function leaveMeeting(participantId: string) {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        meeting: true
      }
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    // Update participant status
    const updated = await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'LEFT',
        leftAt: new Date()
      }
    });

    // Decrement participant count
    await prisma.meeting.update({
      where: { id: participant.meetingId },
      data: {
        participantCount: { decrement: 1 }
      }
    });

    // Stop any active screen sharing
    await prisma.screenShare.updateMany({
      where: {
        participantId,
        isActive: true
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    console.log('User left meeting:', {
      participantId,
      meetingId: participant.meeting.meetingId
    });

    return updated;
  } catch (error) {
    console.error('Error leaving meeting:', error);
    throw error;
  }
}

/**
 * Start screen sharing
 *
 * @param data - Screen share details
 * @returns Screen share session
 */
export async function startScreenSharing(data: ScreenShareData) {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: data.participantId },
      include: {
        meeting: true
      }
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    if (!participant.meeting.allowScreenSharing) {
      throw new Error('Screen sharing is disabled for this meeting');
    }

    if (participant.status !== 'JOINED') {
      throw new Error('Participant must be joined to share screen');
    }

    // Check if someone else is already sharing
    const activeShare = await prisma.screenShare.findFirst({
      where: {
        meetingId: participant.meetingId,
        isActive: true
      }
    });

    if (activeShare) {
      throw new Error('Another participant is already sharing screen');
    }

    // Create screen share session
    const screenShare = await prisma.screenShare.create({
      data: {
        meetingId: participant.meetingId,
        participantId: data.participantId,
        screenType: data.screenType,
        resolution: data.resolution,
        isActive: true,
        startedAt: new Date()
      },
      include: {
        participant: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    console.log('Screen sharing started:', {
      meetingId: participant.meeting.meetingId,
      sharedBy: `${screenShare.participant.user.firstName} ${screenShare.participant.user.lastName}`,
      screenType: data.screenType
    });

    return screenShare;
  } catch (error) {
    console.error('Error starting screen share:', error);
    throw error;
  }
}

/**
 * Stop screen sharing
 *
 * @param screenShareId - Screen share ID
 */
export async function stopScreenSharing(screenShareId: string) {
  try {
    const screenShare = await prisma.screenShare.update({
      where: { id: screenShareId },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    console.log('Screen sharing stopped:', { screenShareId });

    return screenShare;
  } catch (error) {
    console.error('Error stopping screen share:', error);
    throw error;
  }
}

/**
 * Start recording a meeting
 *
 * @param meetingId - Meeting ID
 * @param startedBy - ID of user starting the recording
 * @returns Recording session
 */
export async function startRecording(meetingId: string, startedBy: string) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (!meeting.recordingEnabled) {
      throw new Error('Recording is disabled for this meeting');
    }

    // Check if already recording
    const activeRecording = await prisma.recording.findFirst({
      where: {
        meetingId,
        isActive: true
      }
    });

    if (activeRecording) {
      throw new Error('Recording is already in progress');
    }

    // Create recording session
    const recording = await prisma.recording.create({
      data: {
        meetingId,
        startedById: startedBy,
        isActive: true,
        startedAt: new Date(),
        fileSize: 0
      }
    });

    console.log('Recording started:', {
      meetingId: meeting.meetingId,
      recordingId: recording.id,
      startedBy
    });

    // Notify all participants
    const participants = await prisma.participant.findMany({
      where: {
        meetingId,
        status: 'JOINED'
      }
    });

    await Promise.all(
      participants.map(p =>
        prisma.notification.create({
          data: {
            userId: p.userId,
            type: 'RECORDING_STARTED',
            referenceId: meetingId,
            referenceType: 'MEETING',
            content: 'This meeting is now being recorded',
            isRead: false,
            createdAt: new Date()
          }
        })
      )
    );

    return recording;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
}

/**
 * Stop recording a meeting
 *
 * @param recordingId - Recording ID
 * @param fileUrl - URL of the recorded file
 * @param fileSize - Size of the recorded file in bytes
 * @returns Updated recording
 */
export async function stopRecording(
  recordingId: string,
  fileUrl: string,
  fileSize: number
) {
  try {
    const recording = await prisma.recording.update({
      where: { id: recordingId },
      data: {
        isActive: false,
        endedAt: new Date(),
        fileUrl,
        fileSize
      }
    });

    const duration = recording.endedAt && recording.startedAt
      ? Math.floor((recording.endedAt.getTime() - recording.startedAt.getTime()) / 1000)
      : 0;

    console.log('Recording stopped:', {
      recordingId,
      duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      fileSize: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
    });

    return recording;
  } catch (error) {
    console.error('Error stopping recording:', error);
    throw error;
  }
}

/**
 * End a meeting
 *
 * @param meetingId - Meeting ID
 * @param endedBy - ID of user ending the meeting
 * @returns Updated meeting
 */
export async function endMeeting(meetingId: string, endedBy: string) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        host: true
      }
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Only host can end meeting
    if (endedBy !== meeting.hostId) {
      throw new Error('Only the host can end the meeting');
    }

    // Stop any active recordings
    await prisma.recording.updateMany({
      where: {
        meetingId,
        isActive: true
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    // Stop any active screen sharing
    await prisma.screenShare.updateMany({
      where: {
        meetingId,
        isActive: true
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    // Update all joined participants to left
    await prisma.participant.updateMany({
      where: {
        meetingId,
        status: 'JOINED'
      },
      data: {
        status: 'LEFT',
        leftAt: new Date()
      }
    });

    // Update meeting status
    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'ENDED',
        actualEndTime: new Date()
      }
    });

    const duration = updated.actualEndTime && updated.actualStartTime
      ? Math.floor((updated.actualEndTime.getTime() - updated.actualStartTime.getTime()) / 1000)
      : 0;

    console.log('Meeting ended:', {
      meetingId: meeting.meetingId,
      title: meeting.title,
      duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      endedBy: `${meeting.host.firstName} ${meeting.host.lastName}`
    });

    return updated;
  } catch (error) {
    console.error('Error ending meeting:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating meeting management workflow
 */
export async function runMeetingManagementExample() {
  try {
    console.log('=== Video Conference Meeting Management Example ===\n');

    // 1. Schedule a meeting
    console.log('1. Scheduling meeting...');
    const meeting = await scheduleMeeting({
      title: 'Q4 Planning Session',
      description: 'Quarterly planning and review meeting',
      hostId: 'user-host-123', // Replace with actual host ID
      scheduledStartTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      scheduledEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      timezone: 'America/New_York',
      maxParticipants: 50,
      requiresPassword: true,
      password: 'SecurePass123',
      recordingEnabled: true,
      waitingRoomEnabled: true,
      allowScreenSharing: true,
      allowChat: true
    });

    // 2. Invite participants
    console.log('\n2. Inviting participants...');
    await inviteParticipants(meeting.id, [
      { userId: 'user-456', role: 'CO_HOST' },
      { userId: 'user-789', role: 'PARTICIPANT' },
      { userId: 'user-101', role: 'PARTICIPANT' }
    ]);

    // 3. Join meeting (simulate)
    console.log('\n3. Joining meeting...');
    const { participant: hostParticipant } = await joinMeeting(
      meeting.meetingId,
      'user-host-123',
      'SecurePass123'
    );

    const { participant: participant1, requiresApproval } = await joinMeeting(
      meeting.meetingId,
      'user-456',
      'SecurePass123'
    );

    // 4. Admit participant from waiting room
    if (requiresApproval && participant1) {
      console.log('\n4. Admitting participant from waiting room...');
      await admitParticipant(participant1.id, 'user-host-123');
    }

    // 5. Start recording
    console.log('\n5. Starting recording...');
    const recording = await startRecording(meeting.id, 'user-host-123');

    // 6. Start screen sharing
    console.log('\n6. Starting screen sharing...');
    const screenShare = await startScreenSharing({
      participantId: hostParticipant.id,
      screenType: 'FULL_SCREEN',
      resolution: '1920x1080'
    });

    // 7. Stop screen sharing
    console.log('\n7. Stopping screen sharing...');
    await stopScreenSharing(screenShare.id);

    // 8. Stop recording
    console.log('\n8. Stopping recording...');
    await stopRecording(
      recording.id,
      'https://storage.example.com/recordings/recording-123.mp4',
      157286400 // ~150MB
    );

    // 9. Leave meeting (participant)
    if (participant1) {
      console.log('\n9. Participant leaving meeting...');
      await leaveMeeting(participant1.id);
    }

    // 10. End meeting
    console.log('\n10. Ending meeting...');
    await endMeeting(meeting.id, 'user-host-123');

    console.log('\n=== Example completed successfully ===');
    console.log(`Meeting Join URL: ${meeting.joinUrl}`);
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runMeetingManagementExample();
