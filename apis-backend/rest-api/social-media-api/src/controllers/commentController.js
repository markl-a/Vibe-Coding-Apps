const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { validationResult } = require('express-validator');

// Create comment
exports.createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, parentComment } = req.body;
    const postId = req.params.postId;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If replying to a comment, check if it exists
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }

    const comment = new Comment({
      post: postId,
      author: userId,
      content,
      parentComment: parentComment || null
    });

    await comment.save();

    // Update post's comment count
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // Update parent comment's reply count
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, { $inc: { repliesCount: 1 } });
    }

    await comment.populate('author', 'username displayName avatar');

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get post comments
exports.getPostComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Only get top-level comments (no parent)
    const comments = await Comment.find({ post: postId, parentComment: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar isVerified');

    const total = await Comment.countDocuments({ post: postId, parentComment: null });

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get comment replies
exports.getCommentReplies = async (req, res) => {
  try {
    const commentId = req.params.commentId;

    const replies = await Comment.find({ parentComment: commentId })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatar isVerified');

    res.json({ replies });
  } catch (error) {
    console.error('Get comment replies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = Date.now();

    await comment.save();
    await comment.populate('author', 'username displayName avatar');

    res.json({ message: 'Comment updated successfully', comment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update post's comment count
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    // Update parent comment's reply count if exists
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, { $inc: { repliesCount: -1 } });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Like comment
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const userId = req.user.id;

    if (comment.likes.includes(userId)) {
      return res.status(400).json({ error: 'Comment already liked' });
    }

    comment.likes.push(userId);
    comment.likesCount = comment.likes.length;
    await comment.save();

    res.json({ message: 'Comment liked successfully', likesCount: comment.likesCount });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unlike comment
exports.unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const userId = req.user.id;

    if (!comment.likes.includes(userId)) {
      return res.status(400).json({ error: 'Comment not liked yet' });
    }

    comment.likes = comment.likes.filter(id => id.toString() !== userId);
    comment.likesCount = comment.likes.length;
    await comment.save();

    res.json({ message: 'Comment unliked successfully', likesCount: comment.likesCount });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
