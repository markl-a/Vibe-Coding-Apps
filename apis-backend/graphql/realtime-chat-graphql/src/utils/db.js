const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'realtime_chat_db',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const initDatabase = async () => {
  try {
    // 用戶表
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        avatar_url VARCHAR(500),
        online_status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 聊天室表
    await query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) DEFAULT 'group',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 聊天室成員表
    await query(`
      CREATE TABLE IF NOT EXISTS room_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, user_id)
      )
    `);

    // 訊息表
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        file_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 訊息已讀狀態表
    await query(`
      CREATE TABLE IF NOT EXISTS message_reads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id)
      )
    `);

    // 創建索引
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_online_status ON users(online_status)`);

    console.log('✅ Database tables initialized successfully');

    await insertSampleData();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

const insertSampleData = async () => {
  try {
    const usersCount = await query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count) > 0) {
      console.log('📝 Sample data already exists');
      return;
    }

    const bcrypt = require('bcryptjs');
    const password = await bcrypt.hash('demo123', 10);

    // 創建示範用戶
    const user1 = await query(
      `INSERT INTO users (username, email, password, display_name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['alice', 'alice@example.com', password, 'Alice Wonder']
    );

    const user2 = await query(
      `INSERT INTO users (username, email, password, display_name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['bob', 'bob@example.com', password, 'Bob Builder']
    );

    // 創建示範聊天室
    const room = await query(
      `INSERT INTO rooms (name, description, type, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['General Chat', 'Welcome to the general chat room!', 'group', user1.rows[0].id]
    );

    // 將用戶加入聊天室
    await query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2), ($1, $3)',
      [room.rows[0].id, user1.rows[0].id, user2.rows[0].id]
    );

    console.log('✅ Sample data inserted (alice & bob, password: demo123)');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

module.exports = { query, pool, initDatabase };
