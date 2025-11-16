const { query } = require('../utils/db');
const { generateToken, hashPassword, comparePassword, requireAuth } = require('../utils/auth');
const { pubsub, EVENTS } = require('../utils/pubsub');
const { GraphQLError } = require('graphql');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.userId) return null;
      const result = await query('SELECT * FROM users WHERE id = $1', [context.userId]);
      return result.rows[0] || null;
    },

    users: async () => {
      const result = await query('SELECT * FROM users ORDER BY username');
      return result.rows;
    },

    user: async (parent, { id }) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return result.rows[0];
    },

    onlineUsers: async () => {
      const result = await query("SELECT * FROM users WHERE online_status = 'online' ORDER BY username");
      return result.rows;
    },

    myRooms: async (parent, args, context) => {
      requireAuth(context.userId);

      const result = await query(
        `SELECT DISTINCT r.* FROM rooms r
         JOIN room_members rm ON r.id = rm.room_id
         WHERE rm.user_id = $1
         ORDER BY r.created_at DESC`,
        [context.userId]
      );
      return result.rows;
    },

    room: async (parent, { id }, context) => {
      requireAuth(context.userId);

      const result = await query('SELECT * FROM rooms WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new GraphQLError('Room not found', { extensions: { code: 'NOT_FOUND' } });
      }

      // 檢查用戶是否是成員
      const member = await query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [id, context.userId]
      );

      if (member.rows.length === 0) {
        throw new GraphQLError('You are not a member of this room', { extensions: { code: 'FORBIDDEN' } });
      }

      return result.rows[0];
    },

    directRoom: async (parent, { userId }, context) => {
      requireAuth(context.userId);

      // 查找兩個用戶之間的私人聊天室
      const result = await query(
        `SELECT r.* FROM rooms r
         WHERE r.type = 'direct'
         AND r.id IN (
           SELECT rm1.room_id FROM room_members rm1
           WHERE rm1.user_id = $1
           INTERSECT
           SELECT rm2.room_id FROM room_members rm2
           WHERE rm2.user_id = $2
         )
         LIMIT 1`,
        [context.userId, userId]
      );

      return result.rows[0] || null;
    },

    messages: async (parent, { roomId, limit = 50, offset = 0 }, context) => {
      requireAuth(context.userId);

      // 驗證用戶是否是房間成員
      const member = await query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, context.userId]
      );

      if (member.rows.length === 0) {
        throw new GraphQLError('You are not a member of this room', { extensions: { code: 'FORBIDDEN' } });
      }

      const result = await query(
        'SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [roomId, limit, offset]
      );

      return result.rows.reverse(); // 反轉以時間順序顯示
    },

    unreadMessagesCount: async (parent, args, context) => {
      requireAuth(context.userId);

      const result = await query(
        `SELECT COUNT(DISTINCT m.id) as count
         FROM messages m
         JOIN room_members rm ON m.room_id = rm.room_id
         WHERE rm.user_id = $1
         AND m.user_id != $1
         AND m.created_at > rm.last_read_at`,
        [context.userId]
      );

      return parseInt(result.rows[0].count);
    }
  },

  Mutation: {
    register: async (parent, { username, email, password }) => {
      const existingUser = await query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        throw new GraphQLError('Email or username already exists', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const hashedPassword = await hashPassword(password);
      const result = await query(
        'INSERT INTO users (username, email, password, display_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, email, hashedPassword, username]
      );

      const user = result.rows[0];
      const token = generateToken(user.id);

      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      const user = result.rows[0];
      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      // 更新在線狀態
      await query(
        "UPDATE users SET online_status = 'online', last_seen = CURRENT_TIMESTAMP WHERE id = $1",
        [user.id]
      );

      const token = generateToken(user.id);

      // 發布用戶狀態變更
      pubsub.publish(EVENTS.USER_STATUS_CHANGED, {
        userStatusChanged: { user, status: 'online', lastSeen: new Date().toISOString() }
      });

      return { token, user };
    },

    createRoom: async (parent, { name, description, type = 'group' }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'INSERT INTO rooms (name, description, type, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, type, context.userId]
      );

      const room = result.rows[0];

      // 將創建者加入房間
      await query(
        'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
        [room.id, context.userId]
      );

      return room;
    },

    joinRoom: async (parent, { roomId }, context) => {
      requireAuth(context.userId);

      try {
        await query(
          'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
          [roomId, context.userId]
        );

        // 發布房間更新事件
        const room = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        pubsub.publish(EVENTS.ROOM_UPDATED, { roomUpdated: room.rows[0] });

        return true;
      } catch (error) {
        if (error.code === '23505') {
          throw new GraphQLError('Already a member of this room', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        throw error;
      }
    },

    leaveRoom: async (parent, { roomId }, context) => {
      requireAuth(context.userId);

      await query(
        'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, context.userId]
      );

      // 發布房間更新事件
      const room = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);
      pubsub.publish(EVENTS.ROOM_UPDATED, { roomUpdated: room.rows[0] });

      return true;
    },

    inviteToRoom: async (parent, { roomId, userId }, context) => {
      requireAuth(context.userId);

      // 檢查邀請者是否是房間成員
      const member = await query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, context.userId]
      );

      if (member.rows.length === 0) {
        throw new GraphQLError('You are not a member of this room', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      try {
        await query(
          'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
          [roomId, userId]
        );

        return true;
      } catch (error) {
        if (error.code === '23505') {
          throw new GraphQLError('User is already a member', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        throw error;
      }
    },

    sendMessage: async (parent, { roomId, content, messageType = 'text', fileUrl }, context) => {
      requireAuth(context.userId);

      // 驗證用戶是房間成員
      const member = await query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, context.userId]
      );

      if (member.rows.length === 0) {
        throw new GraphQLError('You are not a member of this room', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const result = await query(
        'INSERT INTO messages (room_id, user_id, content, message_type, file_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [roomId, context.userId, content, messageType, fileUrl]
      );

      const message = result.rows[0];

      // 發布新訊息事件
      pubsub.publish(`${EVENTS.MESSAGE_RECEIVED}_${roomId}`, { messageReceived: message });

      return message;
    },

    markMessageAsRead: async (parent, { messageId }, context) => {
      requireAuth(context.userId);

      try {
        await query(
          'INSERT INTO message_reads (message_id, user_id) VALUES ($1, $2)',
          [messageId, context.userId]
        );
        return true;
      } catch (error) {
        if (error.code === '23505') {
          return true; // 已經標記為已讀
        }
        throw error;
      }
    },

    markRoomAsRead: async (parent, { roomId }, context) => {
      requireAuth(context.userId);

      await query(
        'UPDATE room_members SET last_read_at = CURRENT_TIMESTAMP WHERE room_id = $1 AND user_id = $2',
        [roomId, context.userId]
      );

      return true;
    },

    setOnlineStatus: async (parent, { status }, context) => {
      requireAuth(context.userId);

      await query(
        'UPDATE users SET online_status = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2',
        [status, context.userId]
      );

      const user = await query('SELECT * FROM users WHERE id = $1', [context.userId]);

      // 發布狀態變更
      pubsub.publish(EVENTS.USER_STATUS_CHANGED, {
        userStatusChanged: { user: user.rows[0], status, lastSeen: new Date().toISOString() }
      });

      return true;
    },

    setTyping: async (parent, { roomId, isTyping }, context) => {
      requireAuth(context.userId);

      const user = await query('SELECT * FROM users WHERE id = $1', [context.userId]);
      const room = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);

      // 發布輸入狀態
      pubsub.publish(`${EVENTS.USER_TYPING}_${roomId}`, {
        userTyping: { user: user.rows[0], room: room.rows[0], isTyping }
      });

      return true;
    }
  },

  Subscription: {
    messageReceived: {
      subscribe: (parent, { roomId }) => {
        return pubsub.asyncIterator([`${EVENTS.MESSAGE_RECEIVED}_${roomId}`]);
      }
    },

    userStatusChanged: {
      subscribe: (parent, { userId }) => {
        if (userId) {
          return pubsub.asyncIterator([`${EVENTS.USER_STATUS_CHANGED}_${userId}`]);
        }
        return pubsub.asyncIterator([EVENTS.USER_STATUS_CHANGED]);
      }
    },

    userTyping: {
      subscribe: (parent, { roomId }) => {
        return pubsub.asyncIterator([`${EVENTS.USER_TYPING}_${roomId}`]);
      }
    },

    roomUpdated: {
      subscribe: (parent, { roomId }) => {
        if (roomId) {
          return pubsub.asyncIterator([`${EVENTS.ROOM_UPDATED}_${roomId}`]);
        }
        return pubsub.asyncIterator([EVENTS.ROOM_UPDATED]);
      }
    }
  },

  User: {
    onlineStatus: (parent) => parent.online_status || 'offline',
    lastSeen: (parent) => parent.last_seen,
    displayName: (parent) => parent.display_name || parent.username,
    avatarUrl: (parent) => parent.avatar_url
  },

  Room: {
    createdBy: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.created_by]);
      return result.rows[0];
    },

    members: async (parent) => {
      const result = await query(
        'SELECT * FROM room_members WHERE room_id = $1',
        [parent.id]
      );
      return result.rows;
    },

    membersCount: async (parent) => {
      const result = await query(
        'SELECT COUNT(*) FROM room_members WHERE room_id = $1',
        [parent.id]
      );
      return parseInt(result.rows[0].count);
    },

    lastMessage: async (parent) => {
      const result = await query(
        'SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1',
        [parent.id]
      );
      return result.rows[0] || null;
    },

    unreadCount: async (parent, args, context) => {
      if (!context.userId) return 0;

      const result = await query(
        `SELECT COUNT(*) FROM messages m
         JOIN room_members rm ON m.room_id = rm.room_id
         WHERE m.room_id = $1
         AND rm.user_id = $2
         AND m.user_id != $2
         AND m.created_at > rm.last_read_at`,
        [parent.id, context.userId]
      );

      return parseInt(result.rows[0].count);
    }
  },

  RoomMember: {
    user: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    },

    room: async (parent) => {
      const result = await query('SELECT * FROM rooms WHERE id = $1', [parent.room_id]);
      return result.rows[0];
    },

    joinedAt: (parent) => parent.joined_at,
    lastReadAt: (parent) => parent.last_read_at
  },

  Message: {
    sender: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    },

    room: async (parent) => {
      const result = await query('SELECT * FROM rooms WHERE id = $1', [parent.room_id]);
      return result.rows[0];
    },

    readBy: async (parent) => {
      const result = await query(
        'SELECT * FROM message_reads WHERE message_id = $1',
        [parent.id]
      );
      return result.rows;
    },

    isReadByMe: async (parent, args, context) => {
      if (!context.userId) return false;

      const result = await query(
        'SELECT id FROM message_reads WHERE message_id = $1 AND user_id = $2',
        [parent.id, context.userId]
      );

      return result.rows.length > 0;
    },

    messageType: (parent) => parent.message_type,
    fileUrl: (parent) => parent.file_url
  },

  MessageRead: {
    user: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    },

    message: async (parent) => {
      const result = await query('SELECT * FROM messages WHERE id = $1', [parent.message_id]);
      return result.rows[0];
    },

    readAt: (parent) => parent.read_at
  }
};

module.exports = resolvers;
