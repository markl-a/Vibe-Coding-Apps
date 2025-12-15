const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const { createTestUser, createTestPost } = require('./helpers');

describe('Models', () => {
  describe('User Model', () => {
    it('should create a user with hashed password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20);
    });

    it('should compare password correctly', async () => {
      const user = await createTestUser({
        password: 'mypassword123'
      });

      const isMatch = await user.comparePassword('mypassword123');
      const isNotMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });

    it('should return public JSON without password', async () => {
      const user = await createTestUser();
      const publicData = user.toPublicJSON();

      expect(publicData.password).toBeUndefined();
      expect(publicData.username).toBe(user.username);
      expect(publicData.email).toBe(user.email);
    });

    it('should validate unique username', async () => {
      await createTestUser({ username: 'uniqueuser' });

      const duplicateUser = new User({
        username: 'uniqueuser',
        email: 'different@example.com',
        password: 'password123'
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should validate unique email', async () => {
      await createTestUser({ email: 'unique@example.com' });

      const duplicateUser = new User({
        username: 'differentuser',
        email: 'unique@example.com',
        password: 'password123'
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  describe('Post Model', () => {
    it('should create a post with default values', async () => {
      const user = await createTestUser();

      const post = new Post({
        author: user._id,
        content: 'Test post'
      });
      await post.save();

      expect(post.visibility).toBe('public');
      expect(post.likesCount).toBe(0);
      expect(post.commentsCount).toBe(0);
      expect(post.isEdited).toBe(false);
      expect(post.images).toEqual([]);
    });

    it('should validate content is required', async () => {
      const user = await createTestUser();

      const post = new Post({
        author: user._id
      });

      await expect(post.save()).rejects.toThrow();
    });

    it('should validate author is required', async () => {
      const post = new Post({
        content: 'Test post'
      });

      await expect(post.save()).rejects.toThrow();
    });
  });

  describe('Comment Model', () => {
    it('should create a comment with default values', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user._id);

      const comment = new Comment({
        post: post._id,
        author: user._id,
        content: 'Test comment'
      });
      await comment.save();

      expect(comment.likesCount).toBe(0);
      expect(comment.repliesCount).toBe(0);
      expect(comment.isEdited).toBe(false);
      expect(comment.parentComment).toBeNull();
    });

    it('should allow nested comments (replies)', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user._id);

      const parentComment = new Comment({
        post: post._id,
        author: user._id,
        content: 'Parent comment'
      });
      await parentComment.save();

      const reply = new Comment({
        post: post._id,
        author: user._id,
        content: 'Reply comment',
        parentComment: parentComment._id
      });
      await reply.save();

      expect(reply.parentComment.toString()).toBe(parentComment._id.toString());
    });
  });

  describe('Follow Model', () => {
    it('should create a follow relationship', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      const follow = new Follow({
        follower: user1._id,
        following: user2._id
      });
      await follow.save();

      expect(follow.follower.toString()).toBe(user1._id.toString());
      expect(follow.following.toString()).toBe(user2._id.toString());
    });

    it('should prevent self-following', async () => {
      const user = await createTestUser();

      const follow = new Follow({
        follower: user._id,
        following: user._id
      });

      await expect(follow.save()).rejects.toThrow('Users cannot follow themselves');
    });

    it('should prevent duplicate follow relationships', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      const follow1 = new Follow({
        follower: user1._id,
        following: user2._id
      });
      await follow1.save();

      const follow2 = new Follow({
        follower: user1._id,
        following: user2._id
      });

      await expect(follow2.save()).rejects.toThrow();
    });
  });
});
