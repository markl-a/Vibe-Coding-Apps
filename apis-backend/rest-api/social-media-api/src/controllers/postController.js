const Post = require('../models/Post');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { createLogger } = require('@vibe/shared-utils');
const logger = createLogger('social-media-api:post-controller');

// Create post
exports.createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, images, visibility } = req.body;
    const userId = req.user.id;

    const post = new Post({
      author: userId,
      content,
      images: images || [],
      visibility: visibility || 'public'
    });

    await post.save();

    // Update user's post count
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

    await post.populate('author', 'username displayName avatar');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    logger.error('Create post error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get timeline (all public posts)
exports.getTimeline = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ visibility: 'public' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar isVerified');

    const total = await Post.countDocuments({ visibility: 'public' });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get timeline error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar isVerified');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    logger.error('Get post error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, images, visibility } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    post.content = content;
    if (images !== undefined) post.images = images;
    if (visibility) post.visibility = visibility;
    post.isEdited = true;
    post.editedAt = Date.now();

    await post.save();
    await post.populate('author', 'username displayName avatar');

    res.json({ message: 'Post updated successfully', post });
  } catch (error) {
    logger.error('Update post error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Update user's post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: -1 } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Delete post error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Like post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user.id;

    if (post.likes.includes(userId)) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    post.likes.push(userId);
    post.likesCount = post.likes.length;
    await post.save();

    res.json({ message: 'Post liked successfully', likesCount: post.likesCount });
  } catch (error) {
    logger.error('Like post error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unlike post
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user.id;

    if (!post.likes.includes(userId)) {
      return res.status(400).json({ error: 'Post not liked yet' });
    }

    post.likes = post.likes.filter(id => id.toString() !== userId);
    post.likesCount = post.likes.length;
    await post.save();

    res.json({ message: 'Post unliked successfully', likesCount: post.likesCount });
  } catch (error) {
    logger.error('Unlike post error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar isVerified');

    const total = await Post.countDocuments({ author: userId });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get user posts error', error);
    res.status(500).json({ error: 'Server error' });
  }
};
