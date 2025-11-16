const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social_posts';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Posts)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Post Schema
const postSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  content: { type: String, required: true, maxLength: 5000 },
  images: [{ type: String }],
  likes: [{ type: String }],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

postSchema.index({ userId: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Post Service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Create post
app.post('/api/posts', [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Content is required (max 5000 chars)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.headers['x-user-id'];
    const username = req.headers['x-user-email']?.split('@')[0] || 'anonymous';

    const { content, images } = req.body;

    const post = new Post({
      userId,
      username,
      content,
      images: images || []
    });

    await post.save();

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: post._id,
        userId: post.userId,
        username: post.username,
        content: post.content,
        images: post.images,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get timeline (all posts)
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json({
      posts: posts.map(post => ({
        id: post._id,
        userId: post.userId,
        username: post.username,
        content: post.content,
        images: post.images,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      post: {
        id: post._id,
        userId: post.userId,
        username: post.username,
        content: post.content,
        images: post.images,
        likes: post.likes,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update post
app.put('/api/posts/:id', [
  body('content').trim().isLength({ min: 1, max: 5000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.headers['x-user-id'];
    const { content, images } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    post.content = content;
    if (images) post.images = images;
    post.updatedAt = Date.now();

    await post.save();

    res.json({ message: 'Post updated successfully', post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      post.likesCount = post.likes.length;
      await post.save();
    }

    res.json({ message: 'Post liked', likesCount: post.likesCount });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unlike post
app.delete('/api/posts/:id/like', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.likes = post.likes.filter(id => id !== userId);
    post.likesCount = post.likes.length;
    await post.save();

    res.json({ message: 'Post unliked', likesCount: post.likesCount });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user posts
app.get('/api/users/:userId/posts', async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Post Service running on port ${PORT}`);
});
