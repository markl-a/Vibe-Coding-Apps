const { query } = require('../utils/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

class AuthService {
  /**
   * Register a new user
   */
  async register(username, email, password) {
    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await query(
      'INSERT INTO users (username, email, password, display_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, display_name, created_at',
      [username, email, hashedPassword, username]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    return { token, user };
  }

  /**
   * Login user
   */
  async login(email, password) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update online status
    await query(
      "UPDATE users SET online_status = 'online', last_seen = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    const token = generateToken(user.id);

    // Remove password from response
    delete user.password;

    return { token, user };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const result = await query(
      'SELECT id, username, email, display_name, avatar_url, online_status, last_seen, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}

module.exports = new AuthService();
