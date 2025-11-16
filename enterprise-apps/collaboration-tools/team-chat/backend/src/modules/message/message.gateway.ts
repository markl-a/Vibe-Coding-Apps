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
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { Message } from './message.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Set<string>> = new Map(); // channelId -> Set of socketIds

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 從所有頻道中移除該客戶端
    this.connectedUsers.forEach((sockets, channelId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(channelId);
      }
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-channel')
  handleJoinChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { channelId } = data;

    client.join(channelId);

    if (!this.connectedUsers.has(channelId)) {
      this.connectedUsers.set(channelId, new Set());
    }
    this.connectedUsers.get(channelId).add(client.id);

    // 通知其他用戶有人加入
    client.to(channelId).emit('user-joined', {
      userId: client.data.user?.id,
      channelId,
    });

    return { success: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-channel')
  handleLeaveChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { channelId } = data;

    client.leave(channelId);

    const channelUsers = this.connectedUsers.get(channelId);
    if (channelUsers) {
      channelUsers.delete(client.id);
      if (channelUsers.size === 0) {
        this.connectedUsers.delete(channelId);
      }
    }

    // 通知其他用戶有人離開
    client.to(channelId).emit('user-left', {
      userId: client.data.user?.id,
      channelId,
    });

    return { success: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing-start')
  handleTypingStart(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { channelId } = data;

    client.to(channelId).emit('user-typing', {
      userId: client.data.user?.id,
      username: client.data.user?.username,
      channelId,
      isTyping: true,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { channelId } = data;

    client.to(channelId).emit('user-typing', {
      userId: client.data.user?.id,
      username: client.data.user?.username,
      channelId,
      isTyping: false,
    });
  }

  // 服務器端廣播方法
  broadcastMessage(channelId: string, message: Message) {
    this.server.to(channelId).emit('message-received', message);
  }

  broadcastMessageUpdate(channelId: string, message: Message) {
    this.server.to(channelId).emit('message-updated', message);
  }

  broadcastMessageDelete(channelId: string, messageId: string) {
    this.server.to(channelId).emit('message-deleted', { messageId });
  }

  broadcastReactionAdded(
    channelId: string,
    messageId: string,
    reaction: { emoji: string; userId: string },
  ) {
    this.server.to(channelId).emit('reaction-added', {
      messageId,
      ...reaction,
    });
  }

  broadcastReactionRemoved(
    channelId: string,
    messageId: string,
    reaction: { emoji: string; userId: string },
  ) {
    this.server.to(channelId).emit('reaction-removed', {
      messageId,
      ...reaction,
    });
  }

  broadcastUserStatusChange(userId: string, status: string) {
    this.server.emit('user-status-changed', { userId, status });
  }
}
