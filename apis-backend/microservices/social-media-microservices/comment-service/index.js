const express = require('express');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://commentuser:commentpass@localhost:5432/social_comments'
});

// Initialize database
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        likes TEXT[] DEFAULT '{}',
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_user_id ON comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_parent_id ON comments(parent_id);
    `);
    console.log('✅ PostgreSQL database initialized (Comments)');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

initDatabase();

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      service: 'Comment Service',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      service: 'Comment Service',
      database: 'disconnected'
    });
  }
});

// Create comment
app.post('/api/posts/:postId/comments', [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Content is required (max 1000 chars)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId } = req.params;
    const userId = req.headers['x-user-id'];
    const username = req.headers['x-user-email']?.split('@')[0] || 'anonymous';
    const { content, parentId } = req.body;

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, username, content, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [postId, userId, username, content, parentId || null]
    );

    res.status(201).json({
      message: 'Comment created successfully',
      comment: {
        id: result.rows[0].id,
        postId: result.rows[0].post_id,
        userId: result.rows[0].user_id,
        username: result.rows[0].username,
        content: result.rows[0].content,
        parentId: result.rows[0].parent_id,
        likesCount: result.rows[0].likes_count,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for a post
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM comments
       WHERE post_id = $1 AND parent_id IS NULL
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const replies = await pool.query(
          `SELECT * FROM comments
           WHERE parent_id = $1
           ORDER BY created_at ASC`,
          [comment.id]
        );

        return {
          id: comment.id,
          postId: comment.post_id,
          userId: comment.user_id,
          username: comment.username,
          content: comment.content,
          likesCount: comment.likes_count,
          createdAt: comment.created_at,
          replies: replies.rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            username: r.username,
            content: r.content,
            likesCount: r.likes_count,
            createdAt: r.created_at
          }))
        };
      })
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND parent_id IS NULL',
      [postId]
    );

    res.json({
      comments: commentsWithReplies,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single comment
app.get('/api/comments/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ comment: result.rows[0] });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update comment
app.put('/api/comments/:id', [
  body('content').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.headers['x-user-id'];
    const { content } = req.body;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [req.params.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE comments
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [content, req.params.id]
    );

    res.json({
      message: 'Comment updated successfully',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    // Check ownership
    const checkResult = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [req.params.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like comment
app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const result = await pool.query(
      `UPDATE comments
       SET likes = array_append(likes, $1),
           likes_count = likes_count + 1
       WHERE id = $2 AND NOT ($1 = ANY(likes))
       RETURNING likes_count`,
      [userId, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or already liked' });
    }

    res.json({
      message: 'Comment liked',
      likesCount: result.rows[0].likes_count
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unlike comment
app.delete('/api/comments/:id/like', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const result = await pool.query(
      `UPDATE comments
       SET likes = array_remove(likes, $1),
           likes_count = likes_count - 1
       WHERE id = $2
       RETURNING likes_count`,
      [userId, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({
      message: 'Comment unliked',
      likesCount: result.rows[0].likes_count
    });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Comment Service running on port ${PORT}`);
});
