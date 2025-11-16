import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface MeetingRoom {
  meetingId: string;
  participants: Map<string, ParticipantInfo>;
}

interface ParticipantInfo {
  socketId: string;
  userId: string;
  username: string;
  role: 'HOST' | 'CO_HOST' | 'PARTICIPANT';
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MeetingGateway.name);
  private meetings: Map<string, MeetingRoom> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // 從所有會議中移除用戶
    this.meetings.forEach((room, meetingId) => {
      const participant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );

      if (participant) {
        room.participants.delete(participant.userId);

        // 通知其他參與者
        client.to(meetingId).emit('user-left', {
          userId: participant.userId,
          username: participant.username,
        });

        // 如果會議為空，清理會議室
        if (room.participants.size === 0) {
          this.meetings.delete(meetingId);
        }
      }
    });
  }

  @SubscribeMessage('join-meeting')
  async handleJoinMeeting(
    @MessageBody()
    data: {
      meetingId: string;
      user: { id: string; username: string };
      role?: 'HOST' | 'CO_HOST' | 'PARTICIPANT';
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { meetingId, user, role = 'PARTICIPANT' } = data;

    // 加入房間
    client.join(meetingId);

    // 初始化會議室
    if (!this.meetings.has(meetingId)) {
      this.meetings.set(meetingId, {
        meetingId,
        participants: new Map(),
      });
    }

    const room = this.meetings.get(meetingId);

    // 添加參與者
    const participant: ParticipantInfo = {
      socketId: client.id,
      userId: user.id,
      username: user.username,
      role,
      isVideoOn: false,
      isAudioOn: false,
      isScreenSharing: false,
      isHandRaised: false,
      joinedAt: new Date(),
    };

    room.participants.set(user.id, participant);

    // 發送當前參與者列表給新加入的用戶
    const participantsList = Array.from(room.participants.values()).map(p => ({
      userId: p.userId,
      username: p.username,
      role: p.role,
      isVideoOn: p.isVideoOn,
      isAudioOn: p.isAudioOn,
      isScreenSharing: p.isScreenSharing,
      isHandRaised: p.isHandRaised,
    }));

    client.emit('participants-list', participantsList);

    // 通知其他參與者有新用戶加入
    client.to(meetingId).emit('user-joined', {
      userId: user.id,
      username: user.username,
      role,
    });

    this.logger.log(`User ${user.id} joined meeting ${meetingId}`);

    return { success: true, participants: participantsList };
  }

  @SubscribeMessage('leave-meeting')
  handleLeaveMeeting(
    @MessageBody() data: { meetingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { meetingId } = data;
    const room = this.meetings.get(meetingId);

    if (room) {
      const participant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );

      if (participant) {
        room.participants.delete(participant.userId);
        client.leave(meetingId);

        // 通知其他參與者
        client.to(meetingId).emit('user-left', {
          userId: participant.userId,
          username: participant.username,
        });

        // 如果會議為空，清理會議室
        if (room.participants.size === 0) {
          this.meetings.delete(meetingId);
        }
      }
    }
  }

  @SubscribeMessage('toggle-video')
  handleToggleVideo(
    @MessageBody() data: { meetingId: string; isVideoOn: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { meetingId, isVideoOn } = data;
    const room = this.meetings.get(meetingId);

    if (room) {
      const participant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );

      if (participant) {
        participant.isVideoOn = isVideoOn;

        // 廣播視訊狀態變化
        this.server.to(meetingId).emit('participant-video-changed', {
          userId: participant.userId,
          isVideoOn,
        });
      }
    }
  }

  @SubscribeMessage('toggle-audio')
  handleToggleAudio(
    @MessageBody() data: { meetingId: string; isAudioOn: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { meetingId, isAudioOn } = data;
    const room = this.meetings.get(meetingId);

    if (room) {
      const participant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );

      if (participant) {
        participant.isAudioOn = isAudioOn;

        // 廣播音訊狀態變化
        this.server.to(meetingId).emit('participant-audio-changed', {
          userId: participant.userId,
          isAudioOn,
        });
      }
    }
  }

  @SubscribeMessage('share-screen')
  handleShareScreen(
    @MessageBody() data: { meetingId: string; isSharing: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { meetingId, isSharing } = data;
    const room = this.meetings.get(meetingId);

    if (room) {
      const participant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );

      if (participant) {
        participant.isScreenSharing = isSharing;

        // 廣播屏幕分享狀態
        this.server.to(meetingId).emit(
          isSharing ? 'screen-share-started' : 'screen-share-stopped',
          {
            userId: participant.userId,
            username: participant.username,
          },
        );
      }
    }
  }

  @SubscribeMessage('raise-hand')
  handleRaiseHand(
    @MessageBody() data: { meetingId: string; isRaised: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { meetingId, isRaised } = data;
    const room = this.meetings.get(meetingId);

    if (room) {
      const participant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );

      if (participant) {
        participant.isHandRaised = isRaised;

        // 廣播舉手狀態
        this.server.to(meetingId).emit('hand-raised', {
          userId: participant.userId,
          username: participant.username,
          isRaised,
        });
      }
    }
  }

  // WebRTC 信令
  @SubscribeMessage('webrtc-offer')
  handleOffer(
    @MessageBody() data: { to: string; offer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.findRoomBySocketId(client.id);
    if (room) {
      const fromParticipant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );
      const toParticipant = room.participants.get(data.to);

      if (toParticipant) {
        this.server.to(toParticipant.socketId).emit('webrtc-offer', {
          from: fromParticipant.userId,
          offer: data.offer,
        });
      }
    }
  }

  @SubscribeMessage('webrtc-answer')
  handleAnswer(
    @MessageBody() data: { to: string; answer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.findRoomBySocketId(client.id);
    if (room) {
      const fromParticipant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );
      const toParticipant = room.participants.get(data.to);

      if (toParticipant) {
        this.server.to(toParticipant.socketId).emit('webrtc-answer', {
          from: fromParticipant.userId,
          answer: data.answer,
        });
      }
    }
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { to: string; candidate: RTCIceCandidate },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.findRoomBySocketId(client.id);
    if (room) {
      const fromParticipant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );
      const toParticipant = room.participants.get(data.to);

      if (toParticipant) {
        this.server.to(toParticipant.socketId).emit('webrtc-ice-candidate', {
          from: fromParticipant.userId,
          candidate: data.candidate,
        });
      }
    }
  }

  @SubscribeMessage('send-chat-message')
  handleChatMessage(
    @MessageBody() data: { meetingId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { meetingId, message } = data;
    const room = this.meetings.get(meetingId);

    if (room) {
      const participant = Array.from(room.participants.values()).find(
        p => p.socketId === client.id,
      );

      if (participant) {
        // 廣播聊天訊息
        this.server.to(meetingId).emit('chat-message-received', {
          userId: participant.userId,
          username: participant.username,
          message,
          timestamp: new Date(),
        });
      }
    }
  }

  private findRoomBySocketId(socketId: string): MeetingRoom | undefined {
    for (const room of this.meetings.values()) {
      const participant = Array.from(room.participants.values()).find(
        p => p.socketId === socketId,
      );
      if (participant) {
        return room;
      }
    }
    return undefined;
  }
}
