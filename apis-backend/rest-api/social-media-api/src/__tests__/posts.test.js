const request = require('supertest');
const app = require('../index');
const Post = require('../models/Post');
const User = require('../models/User');
const { createTestUser, createTestPost, generateTestToken, createTestPosts } = require('./helpers');

describe('Posts API', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user._id);
  });

  describe('POST /api/posts', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        content: 'This is my first post!',
        visibility: 'public'
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.message).toBe('Post created successfully');
      expect(res.body.post).toMatchObject({
        content: 'This is my first post!',
        visibility: 'public'
      });
      expect(res.body.post.author).toBeDefined();

      // Verify user's post count increased
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.postsCount).toBe(1);
    });

    it('should create a post with images', async () => {
      const postData = {
        content: 'Check out these photos!',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.post.images).toEqual(postData.images);
    });

    it('should reject post without authentication', async () => {
      const postData = {
        content: 'This should fail'
      };

      const res = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should reject post with empty content', async () => {
      const postData = {
        content: ''
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject post with content exceeding max length', async () => {
      const postData = {
        content: 'a'.repeat(5001)
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/posts', () => {
    it('should get timeline with public posts', async () => {
      const users = await Promise.all([
        createTestUser(),
        createTestUser(),
        createTestUser()
      ]);

      // Create posts from different users
      await createTestPost(users[0]._id, { content: 'Post 1' });
      await createTestPost(users[1]._id, { content: 'Post 2' });
      await createTestPost(users[2]._id, { content: 'Post 3' });

      const res = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(res.body.posts).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3
      });
    });

    it('should support pagination', async () => {
      // Create 25 posts
      for (let i = 0; i < 25; i++) {
        await createTestPost(user._id, { content: `Post ${i}` });
      }

      const res = await request(app)
        .get('/api/posts?page=2&limit=10')
        .expect(200);

      expect(res.body.posts).toHaveLength(10);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3
      });
    });

    it('should return posts sorted by creation date (newest first)', async () => {
      const post1 = await createTestPost(user._id, { content: 'First post' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const post2 = await createTestPost(user._id, { content: 'Second post' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const post3 = await createTestPost(user._id, { content: 'Third post' });

      const res = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(res.body.posts[0].content).toBe('Third post');
      expect(res.body.posts[1].content).toBe('Second post');
      expect(res.body.posts[2].content).toBe('First post');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should get a single post by id', async () => {
      const post = await createTestPost(user._id, {
        content: 'Test post content'
      });

      const res = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);

      expect(res.body.post).toMatchObject({
        content: 'Test post content'
      });
      expect(res.body.post.author).toBeDefined();
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(res.body.error).toBe('Post not found');
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update own post successfully', async () => {
      const post = await createTestPost(user._id, {
        content: 'Original content'
      });

      const updateData = {
        content: 'Updated content',
        visibility: 'followers'
      };

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body.message).toBe('Post updated successfully');
      expect(res.body.post).toMatchObject({
        content: 'Updated content',
        visibility: 'followers',
        isEdited: true
      });
      expect(res.body.post.editedAt).toBeDefined();
    });

    it('should not allow updating another user\'s post', async () => {
      const otherUser = await createTestUser();
      const post = await createTestPost(otherUser._id);

      const updateData = {
        content: 'Trying to hack this post'
      };

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .put(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated' })
        .expect(404);

      expect(res.body.error).toBe('Post not found');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete own post successfully', async () => {
      const post = await createTestPost(user._id);

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Post deleted successfully');

      // Verify post is deleted
      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();

      // Verify user's post count decreased
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.postsCount).toBe(0);
    });

    it('should not allow deleting another user\'s post', async () => {
      const otherUser = await createTestUser();
      const post = await createTestPost(otherUser._id);

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/posts/:id/like', () => {
    it('should like a post successfully', async () => {
      const post = await createTestPost(user._id);
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(res.body.message).toBe('Post liked successfully');
      expect(res.body.likesCount).toBe(1);

      // Verify like was added
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.likes).toContainEqual(otherUser._id);
    });

    it('should not allow liking a post twice', async () => {
      const post = await createTestPost(user._id);
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      // First like
      await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      // Second like (should fail)
      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(400);

      expect(res.body.error).toBe('Post already liked');
    });
  });

  describe('DELETE /api/posts/:id/like', () => {
    it('should unlike a post successfully', async () => {
      const post = await createTestPost(user._id);
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      // First like the post
      await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      // Then unlike it
      const res = await request(app)
        .delete(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(res.body.message).toBe('Post unliked successfully');
      expect(res.body.likesCount).toBe(0);

      // Verify like was removed
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.likes).not.toContainEqual(otherUser._id);
    });

    it('should not allow unliking a post that was not liked', async () => {
      const post = await createTestPost(user._id);
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      const res = await request(app)
        .delete(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(400);

      expect(res.body.error).toBe('Post not liked yet');
    });
  });

  describe('GET /api/users/:userId/posts', () => {
    it('should get all posts by a specific user', async () => {
      const otherUser = await createTestUser();

      // Create posts for both users
      await createTestPosts(user._id, 3);
      await createTestPosts(otherUser._id, 5);

      const res = await request(app)
        .get(`/api/users/${otherUser._id}/posts`)
        .expect(200);

      expect(res.body.posts).toHaveLength(5);
      res.body.posts.forEach(post => {
        expect(post.author._id.toString()).toBe(otherUser._id.toString());
      });
    });
  });
});
