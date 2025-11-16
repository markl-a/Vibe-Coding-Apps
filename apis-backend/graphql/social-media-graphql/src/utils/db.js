const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'social_media_db',
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
        bio TEXT,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 關注關係表
    await query(`
      CREATE TABLE IF NOT EXISTS follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id),
        CHECK (follower_id != following_id)
      )
    `);

    // 貼文表
    await query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 按讚表
    await query(`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      )
    `);

    // 評論表
    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 標籤表
    await query(`
      CREATE TABLE IF NOT EXISTS hashtags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tag VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 貼文標籤關聯表
    await query(`
      CREATE TABLE IF NOT EXISTS post_hashtags (
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, hashtag_id)
      )
    `);

    // 通知表
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        reference_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建索引
    await query(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`);

    console.log('✅ Database tables initialized successfully');

    // 插入測試用戶
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
    await query(
      `INSERT INTO users (username, email, password, display_name, bio)
       VALUES ($1, $2, $3, $4, $5)`,
      ['demo_user', 'demo@example.com', password, 'Demo User', 'This is a demo account']
    );

    console.log('✅ Sample data inserted');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

module.exports = { query, pool, initDatabase };
