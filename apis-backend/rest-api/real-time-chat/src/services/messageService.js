const { query } = require('../utils/db');

class MessageService {
  /**
   * Send a message
   */
  async sendMessage(roomId, userId, content, messageType = 'text', fileUrl = null) {
    // Verify user is a member
    const member = await query(
      'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (member.rows.length === 0) {
      throw new Error('You are not a member of this room');
    }

    const result = await query(
      'INSERT INTO messages (room_id, user_id, content, message_type, file_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [roomId, userId, content, messageType, fileUrl]
    );

    return result.rows[0];
  }

  /**
   * Get messages for a room
   */
  async getMessages(roomId, userId, limit = 50, offset = 0) {
    // Verify user is a member
    const member = await query(
      'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (member.rows.length === 0) {
      throw new Error('You are not a member of this room');
    }

    const result = await query(
      `SELECT m.*, u.username, u.display_name, u.avatar_url
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.room_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    );

    return result.rows.reverse();
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId, userId) {
    try {
      await query(
        'INSERT INTO message_reads (message_id, user_id) VALUES ($1, $2)',
        [messageId, userId]
      );
      return true;
    } catch (error) {
      if (error.code === '23505') {
        return true; // Already marked as read
      }
      throw error;
    }
  }

  /**
   * Get unread messages count for a user
   */
  async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(DISTINCT m.id) as count
       FROM messages m
       JOIN room_members rm ON m.room_id = rm.room_id
       WHERE rm.user_id = $1
       AND m.user_id != $1
       AND m.created_at > rm.last_read_at`,
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId) {
    const result = await query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );

    if (result.rows.length === 0) {
      throw new Error('Message not found');
    }

    return result.rows[0];
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId, userId) {
    const message = await this.getMessageById(messageId);

    if (message.user_id !== userId) {
      throw new Error('You can only delete your own messages');
    }

    await query('DELETE FROM messages WHERE id = $1', [messageId]);
    return true;
  }
}

module.exports = new MessageService();
