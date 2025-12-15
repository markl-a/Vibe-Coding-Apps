const { query } = require('../utils/db');

class UserService {
  /**
   * Get all users
   */
  async getUsers() {
    const result = await query(
      'SELECT id, username, email, display_name, avatar_url, online_status, last_seen FROM users ORDER BY username'
    );
    return result.rows;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const result = await query(
      'SELECT id, username, email, display_name, avatar_url, online_status, last_seen FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Get online users
   */
  async getOnlineUsers() {
    const result = await query(
      "SELECT id, username, email, display_name, avatar_url, online_status, last_seen FROM users WHERE online_status = 'online' ORDER BY username"
    );
    return result.rows;
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(userId, status) {
    await query(
      'UPDATE users SET online_status = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2',
      [status, userId]
    );
    return true;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const { display_name, avatar_url } = updates;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
      fields.push(`display_name = $${paramIndex++}`);
      values.push(display_name);
    }

    if (avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING id, username, email, display_name, avatar_url`,
      values
    );

    return result.rows[0];
  }
}

module.exports = new UserService();
