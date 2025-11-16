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
import * as Y from 'yjs';
import { applyUpdate, encodeStateAsUpdate, encodeStateVector } from 'yjs';

interface DocumentRoom {
  doc: Y.Doc;
  users: Map<string, { socketId: string; user: any; cursor: any }>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);
  private documents: Map<string, DocumentRoom> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // 從所有文檔房間中移除用戶
    this.documents.forEach((room, documentId) => {
      const userEntry = Array.from(room.users.entries()).find(
        ([_, data]) => data.socketId === client.id,
      );

      if (userEntry) {
        const [userId] = userEntry;
        room.users.delete(userId);

        // 通知其他用戶
        client.to(documentId).emit('user-left', {
          userId,
          documentId,
        });

        // 如果房間為空，清理文檔
        if (room.users.size === 0) {
          this.documents.delete(documentId);
        }
      }
    });
  }

  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @MessageBody() data: { documentId: string; user: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId, user } = data;

    // 加入房間
    client.join(documentId);

    // 初始化或獲取文檔房間
    if (!this.documents.has(documentId)) {
      const ydoc = new Y.Doc();
      this.documents.set(documentId, {
        doc: ydoc,
        users: new Map(),
      });

      // TODO: 從數據庫加載文檔內容
      // const docContent = await this.documentService.getContent(documentId);
      // if (docContent) {
      //   const update = new Uint8Array(docContent);
      //   applyUpdate(ydoc, update);
      // }
    }

    const room = this.documents.get(documentId);

    // 添加用戶到房間
    room.users.set(user.id, {
      socketId: client.id,
      user,
      cursor: null,
    });

    // 發送當前文檔狀態給新加入的用戶
    const stateVector = encodeStateVector(room.doc);
    const update = encodeStateAsUpdate(room.doc, stateVector);

    client.emit('sync-response', {
      update: Array.from(update),
      users: Array.from(room.users.values()).map(u => ({
        id: u.user.id,
        name: u.user.name,
        cursor: u.cursor,
      })),
    });

    // 通知其他用戶有新用戶加入
    client.to(documentId).emit('user-joined', {
      user: {
        id: user.id,
        name: user.name,
      },
      documentId,
    });

    this.logger.log(`User ${user.id} joined document ${documentId}`);
  }

  @SubscribeMessage('leave-document')
  handleLeaveDocument(
    @MessageBody() data: { documentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId } = data;
    const room = this.documents.get(documentId);

    if (room) {
      const userEntry = Array.from(room.users.entries()).find(
        ([_, data]) => data.socketId === client.id,
      );

      if (userEntry) {
        const [userId] = userEntry;
        room.users.delete(userId);

        client.leave(documentId);

        // 通知其他用戶
        client.to(documentId).emit('user-left', {
          userId,
          documentId,
        });

        // 如果房間為空，保存並清理文檔
        if (room.users.size === 0) {
          this.saveDocument(documentId, room.doc);
          this.documents.delete(documentId);
        }
      }
    }
  }

  @SubscribeMessage('sync-update')
  handleSyncUpdate(
    @MessageBody() data: { documentId: string; update: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId, update } = data;
    const room = this.documents.get(documentId);

    if (!room) {
      return;
    }

    try {
      // 應用更新到 Yjs 文檔
      const updateArray = new Uint8Array(update);
      applyUpdate(room.doc, updateArray);

      // 廣播更新給其他用戶
      client.to(documentId).emit('document-update', {
        update,
      });

      // 定期保存到數據庫（debounce）
      this.scheduleDocumentSave(documentId, room.doc);
    } catch (error) {
      this.logger.error(`Error applying update: ${error.message}`);
    }
  }

  @SubscribeMessage('cursor-position')
  handleCursorPosition(
    @MessageBody() data: { documentId: string; cursor: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId, cursor } = data;
    const room = this.documents.get(documentId);

    if (room) {
      const userEntry = Array.from(room.users.entries()).find(
        ([_, data]) => data.socketId === client.id,
      );

      if (userEntry) {
        const [userId] = userEntry;
        room.users.get(userId).cursor = cursor;

        // 廣播游標位置給其他用戶
        client.to(documentId).emit('cursor-update', {
          userId,
          cursor,
        });
      }
    }
  }

  @SubscribeMessage('request-full-sync')
  handleRequestFullSync(
    @MessageBody() data: { documentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId } = data;
    const room = this.documents.get(documentId);

    if (room) {
      const stateVector = encodeStateVector(room.doc);
      const update = encodeStateAsUpdate(room.doc, stateVector);

      client.emit('sync-response', {
        update: Array.from(update),
      });
    }
  }

  private saveTimers: Map<string, NodeJS.Timeout> = new Map();

  private scheduleDocumentSave(documentId: string, doc: Y.Doc) {
    // 清除之前的定時器
    if (this.saveTimers.has(documentId)) {
      clearTimeout(this.saveTimers.get(documentId));
    }

    // 設置新的定時器（5秒後保存）
    const timer = setTimeout(() => {
      this.saveDocument(documentId, doc);
      this.saveTimers.delete(documentId);
    }, 5000);

    this.saveTimers.set(documentId, timer);
  }

  private async saveDocument(documentId: string, doc: Y.Doc) {
    try {
      const update = encodeStateAsUpdate(doc);

      // TODO: 保存到數據庫
      // await this.documentService.saveContent(documentId, Buffer.from(update));

      this.logger.log(`Document ${documentId} saved`);
    } catch (error) {
      this.logger.error(`Error saving document ${documentId}: ${error.message}`);
    }
  }
}
