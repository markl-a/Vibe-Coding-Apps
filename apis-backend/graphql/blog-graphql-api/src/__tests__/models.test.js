const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`))
}));

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a user with required fields', () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = new User(userData);

    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.password).toBe(userData.password);
    expect(user.role).toBe('USER'); // default value
  });

  test('should set default role to USER', () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user.role).toBe('USER');
  });

  test('should accept valid role values', () => {
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN'
    });

    expect(adminUser.role).toBe('ADMIN');
  });

  test('should lowercase email', () => {
    const user = new User({
      name: 'Test User',
      email: 'TEST@EXAMPLE.COM',
      password: 'password123'
    });

    expect(user.email).toBe('test@example.com');
  });

  test('should trim whitespace from name and email', () => {
    const user = new User({
      name: '  Test User  ',
      email: '  test@example.com  ',
      password: 'password123'
    });

    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
  });

  test('should validate password method exists', () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(typeof user.comparePassword).toBe('function');
  });
});

describe('Post Model', () => {
  test('should create a post with required fields', () => {
    const postData = {
      title: 'Test Post',
      content: 'This is test content',
      author: new mongoose.Types.ObjectId()
    };

    const post = new Post(postData);

    expect(post.title).toBe(postData.title);
    expect(post.content).toBe(postData.content);
    expect(post.author).toBe(postData.author);
  });

  test('should set default values', () => {
    const post = new Post({
      title: 'Test Post',
      content: 'Content',
      author: new mongoose.Types.ObjectId()
    });

    expect(post.published).toBe(false);
    expect(post.views).toBe(0);
    expect(post.likes).toBe(0);
    expect(post.tags).toEqual([]);
  });

  test('should accept tags array', () => {
    const post = new Post({
      title: 'Test Post',
      content: 'Content',
      author: new mongoose.Types.ObjectId(),
      tags: ['javascript', 'nodejs', 'graphql']
    });

    expect(post.tags).toHaveLength(3);
    expect(post.tags).toContain('javascript');
  });

  test('should trim whitespace from title and tags', () => {
    const post = new Post({
      title: '  Test Post  ',
      content: 'Content',
      author: new mongoose.Types.ObjectId(),
      tags: ['  javascript  ', '  nodejs  ']
    });

    expect(post.title).toBe('Test Post');
  });

  test('should have createdAt and updatedAt fields', () => {
    const post = new Post({
      title: 'Test Post',
      content: 'Content',
      author: new mongoose.Types.ObjectId()
    });

    expect(post.createdAt).toBeDefined();
    expect(post.updatedAt).toBeDefined();
  });
});

describe('Comment Model', () => {
  test('should create a comment with required fields', () => {
    const commentData = {
      content: 'This is a test comment',
      author: new mongoose.Types.ObjectId(),
      post: new mongoose.Types.ObjectId()
    };

    const comment = new Comment(commentData);

    expect(comment.content).toBe(commentData.content);
    expect(comment.author).toBe(commentData.author);
    expect(comment.post).toBe(commentData.post);
  });

  test('should set default values', () => {
    const comment = new Comment({
      content: 'Test comment',
      author: new mongoose.Types.ObjectId(),
      post: new mongoose.Types.ObjectId()
    });

    expect(comment.likes).toBe(0);
    expect(comment.parentComment).toBe(null);
  });

  test('should accept parentComment for nested comments', () => {
    const parentId = new mongoose.Types.ObjectId();
    const comment = new Comment({
      content: 'Reply comment',
      author: new mongoose.Types.ObjectId(),
      post: new mongoose.Types.ObjectId(),
      parentComment: parentId
    });

    expect(comment.parentComment).toBe(parentId);
  });

  test('should have createdAt and updatedAt fields', () => {
    const comment = new Comment({
      content: 'Test comment',
      author: new mongoose.Types.ObjectId(),
      post: new mongoose.Types.ObjectId()
    });

    expect(comment.createdAt).toBeDefined();
    expect(comment.updatedAt).toBeDefined();
  });
});
