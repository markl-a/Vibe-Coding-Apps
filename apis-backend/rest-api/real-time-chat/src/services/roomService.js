const { query } = require('../utils/db');

class RoomService {
  /**
   * Create a new room
   */
  async createRoom(userId, name, description, type = 'group') {
    const result = await query(
      'INSERT INTO rooms (name, description, type, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, type, userId]
    );

    const room = result.rows[0];

    // Add creator as member
    await query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
      [room.id, userId]
    );

    return room;
  }

  /**
   * Get room by ID
   */
  async getRoomById(roomId, userId) {
    const result = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);

    if (result.rows.length === 0) {
      throw new Error('Room not found');
    }

    // Check if user is a member
    const member = await query(
      'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (member.rows.length === 0) {
      throw new Error('You are not a member of this room');
    }

    return result.rows[0];
  }

  /**
   * Get user's rooms
   */
  async getUserRooms(userId) {
    const result = await query(
      `SELECT DISTINCT r.* FROM rooms r
       JOIN room_members rm ON r.id = rm.room_id
       WHERE rm.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get direct room between two users
   */
  async getDirectRoom(userId1, userId2) {
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
      [userId1, userId2]
    );

    return result.rows[0] || null;
  }

  /**
   * Join a room
   */
  async joinRoom(roomId, userId) {
    try {
      await query(
        'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
        [roomId, userId]
      );
      return true;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Already a member of this room');
      }
      throw error;
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId, userId) {
    await query(
      'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
    return true;
  }

  /**
   * Invite user to room
   */
  async inviteToRoom(roomId, inviterId, inviteeId) {
    // Check if inviter is a member
    const member = await query(
      'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, inviterId]
    );

    if (member.rows.length === 0) {
      throw new Error('You are not a member of this room');
    }

    try {
      await query(
        'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
        [roomId, inviteeId]
      );
      return true;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('User is already a member');
      }
      throw error;
    }
  }

  /**
   * Get room members
   */
  async getRoomMembers(roomId) {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.online_status, rm.joined_at
       FROM users u
       JOIN room_members rm ON u.id = rm.user_id
       WHERE rm.room_id = $1
       ORDER BY u.username`,
      [roomId]
    );
    return result.rows;
  }

  /**
   * Mark room as read
   */
  async markRoomAsRead(roomId, userId) {
    await query(
      'UPDATE room_members SET last_read_at = CURRENT_TIMESTAMP WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
    return true;
  }
}

module.exports = new RoomService();
