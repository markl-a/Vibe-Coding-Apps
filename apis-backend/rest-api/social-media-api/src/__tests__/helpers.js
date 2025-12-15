const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Create test user
exports.createTestUser = async (overrides = {}) => {
  const defaultUser = {
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    displayName: 'Test User',
    ...overrides
  };

  const user = new User(defaultUser);
  await user.save();
  return user;
};

// Create multiple test users
exports.createTestUsers = async (count = 3) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await exports.createTestUser({
      username: `testuser${Date.now()}_${i}`,
      email: `test${Date.now()}_${i}@example.com`
    });
    users.push(user);
  }
  return users;
};

// Generate JWT token for user
exports.generateTestToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required for tests');
  }
  return jwt.sign(
    { id: userId },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

// Create test post
exports.createTestPost = async (userId, overrides = {}) => {
  const defaultPost = {
    author: userId,
    content: 'This is a test post',
    visibility: 'public',
    ...overrides
  };

  const post = new Post(defaultPost);
  await post.save();
  return post;
};

// Create multiple test posts
exports.createTestPosts = async (userId, count = 3) => {
  const posts = [];
  for (let i = 0; i < count; i++) {
    const post = await exports.createTestPost(userId, {
      content: `Test post ${i + 1}`
    });
    posts.push(post);
  }
  return posts;
};

// Create test comment
exports.createTestComment = async (postId, userId, overrides = {}) => {
  const defaultComment = {
    post: postId,
    author: userId,
    content: 'This is a test comment',
    ...overrides
  };

  const comment = new Comment(defaultComment);
  await comment.save();
  return comment;
};

// Create multiple test comments
exports.createTestComments = async (postId, userId, count = 3) => {
  const comments = [];
  for (let i = 0; i < count; i++) {
    const comment = await exports.createTestComment(postId, userId, {
      content: `Test comment ${i + 1}`
    });
    comments.push(comment);
  }
  return comments;
};
