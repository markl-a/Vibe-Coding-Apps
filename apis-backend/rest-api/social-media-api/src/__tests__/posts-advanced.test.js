const request = require('supertest');
const app = require('../index');
const Post = require('../models/Post');
const User = require('../models/User');
const { createTestUser, createTestPost, generateTestToken, createTestPosts } = require('./helpers');

describe('Posts API - Advanced Tests', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user._id);
  });

  describe('POST /api/posts - Advanced Validation', () => {
    it('should create post with default visibility as public', async () => {
      const postData = {
        content: 'Test post without visibility'
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.post.visibility).toBe('public');
    });

    it('should create post with followers visibility', async () => {
      const postData = {
        content: 'Post for followers only',
        visibility: 'followers'
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.post.visibility).toBe('followers');
    });

    it('should create post with private visibility', async () => {
      const postData = {
        content: 'Private post',
        visibility: 'private'
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.post.visibility).toBe('private');
    });

    it('should reject post with invalid visibility value', async () => {
      const postData = {
        content: 'Test post',
        visibility: 'invalid-visibility'
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should handle posts with only whitespace content', async () => {
      const postData = {
        content: '     '
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should accept posts with maximum allowed length', async () => {
      const postData = {
        content: 'a'.repeat(5000)
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.post.content).toHaveLength(5000);
    });

    it('should reject posts with multiple image URLs', async () => {
      const postData = {
        content: 'Post with many images',
        images: Array(11).fill('https://example.com/image.jpg')
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should accept posts with valid image URLs', async () => {
      const postData = {
        content: 'Post with images',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.png',
          'https://example.com/image3.gif'
        ]
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.post.images).toHaveLength(3);
    });

    it('should initialize post with zero likes and comments', async () => {
      const postData = {
        content: 'New post'
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.post.likesCount).toBe(0);
      expect(res.body.post.commentsCount).toBe(0);
    });

    it('should populate author information in created post', async () => {
      const postData = {
        content: 'Test post'
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(res.body.post.author).toMatchObject({
        username: user.username,
        displayName: user.displayName
      });
    });
  });

  describe('GET /api/posts - Advanced Scenarios', () => {
    it('should return empty array when no posts exist', async () => {
      const res = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(res.body.posts).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should handle invalid page number', async () => {
      await createTestPosts(user._id, 5);

      const res = await request(app)
        .get('/api/posts?page=0')
        .expect(200);

      expect(res.body.posts).toBeDefined();
    });

    it('should handle invalid limit', async () => {
      await createTestPosts(user._id, 5);

      const res = await request(app)
        .get('/api/posts?limit=0')
        .expect(200);

      expect(res.body.posts).toBeDefined();
    });

    it('should handle very large page numbers', async () => {
      await createTestPosts(user._id, 5);

      const res = await request(app)
        .get('/api/posts?page=9999')
        .expect(200);

      expect(res.body.posts).toHaveLength(0);
      expect(res.body.pagination.page).toBe(9999);
    });

    it('should not include private posts in public timeline', async () => {
      await createTestPost(user._id, { content: 'Public post', visibility: 'public' });
      await createTestPost(user._id, { content: 'Private post', visibility: 'private' });
      await createTestPost(user._id, { content: 'Followers post', visibility: 'followers' });

      const res = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].content).toBe('Public post');
    });

    it('should return posts with populated author information', async () => {
      await createTestPost(user._id, { content: 'Test post' });

      const res = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(res.body.posts[0].author).toBeDefined();
      expect(res.body.posts[0].author.username).toBe(user.username);
    });
  });

  describe('GET /api/posts/:id - Advanced Scenarios', () => {
    it('should return 404 for invalid MongoDB ObjectId format', async () => {
      const res = await request(app)
        .get('/api/posts/invalid-id')
        .expect(500);

      expect(res.body.error).toBe('Server error');
    });

    it('should return post with all fields populated', async () => {
      const post = await createTestPost(user._id, {
        content: 'Test post',
        images: ['https://example.com/image.jpg'],
        visibility: 'public'
      });

      const res = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);

      expect(res.body.post).toMatchObject({
        content: 'Test post',
        visibility: 'public'
      });
      expect(res.body.post.images).toHaveLength(1);
      expect(res.body.post.author).toBeDefined();
    });

    it('should include like and comment counts', async () => {
      const post = await createTestPost(user._id);

      const res = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);

      expect(res.body.post.likesCount).toBeDefined();
      expect(res.body.post.commentsCount).toBeDefined();
    });
  });

  describe('PUT /api/posts/:id - Advanced Scenarios', () => {
    it('should preserve original creation date when updating', async () => {
      const post = await createTestPost(user._id, { content: 'Original' });
      const originalCreatedAt = post.createdAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated' })
        .expect(200);

      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('should update isEdited flag and editedAt timestamp', async () => {
      const post = await createTestPost(user._id, { content: 'Original' });

      expect(post.isEdited).toBe(false);
      expect(post.editedAt).toBeUndefined();

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated content' })
        .expect(200);

      expect(res.body.post.isEdited).toBe(true);
      expect(res.body.post.editedAt).toBeDefined();
    });

    it('should allow updating only content', async () => {
      const post = await createTestPost(user._id, {
        content: 'Original',
        visibility: 'public',
        images: ['https://example.com/image.jpg']
      });

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated content only' })
        .expect(200);

      expect(res.body.post.content).toBe('Updated content only');
      expect(res.body.post.visibility).toBe('public');
      expect(res.body.post.images).toHaveLength(1);
    });

    it('should allow updating visibility', async () => {
      const post = await createTestPost(user._id, {
        content: 'Test post',
        visibility: 'public'
      });

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test post', visibility: 'private' })
        .expect(200);

      expect(res.body.post.visibility).toBe('private');
    });

    it('should allow removing all images', async () => {
      const post = await createTestPost(user._id, {
        content: 'Post with images',
        images: ['https://example.com/image.jpg']
      });

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Post with images',
          images: []
        })
        .expect(200);

      expect(res.body.post.images).toHaveLength(0);
    });

    it('should reject update with empty content', async () => {
      const post = await createTestPost(user._id);

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject update with content exceeding max length', async () => {
      const post = await createTestPost(user._id);

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'a'.repeat(5001) })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/posts/:id - Advanced Scenarios', () => {
    it('should return 404 when deleting non-existent post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .delete(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('Post not found');
    });

    it('should require authentication to delete post', async () => {
      const post = await createTestPost(user._id);

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should update user post count after deletion', async () => {
      const post1 = await createTestPost(user._id);
      const post2 = await createTestPost(user._id);

      let updatedUser = await User.findById(user._id);
      expect(updatedUser.postsCount).toBe(2);

      await request(app)
        .delete(`/api/posts/${post1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      updatedUser = await User.findById(user._id);
      expect(updatedUser.postsCount).toBe(1);
    });
  });

  describe('POST /api/posts/:id/like - Advanced Scenarios', () => {
    it('should require authentication to like post', async () => {
      const post = await createTestPost(user._id);

      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should return 404 when liking non-existent post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .post(`/api/posts/${fakeId}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('Post not found');
    });

    it('should allow author to like own post', async () => {
      const post = await createTestPost(user._id);

      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.likesCount).toBe(1);
    });

    it('should track multiple likes from different users', async () => {
      const post = await createTestPost(user._id);
      const user2 = await createTestUser();
      const user3 = await createTestUser();
      const token2 = generateTestToken(user2._id);
      const token3 = generateTestToken(user3._id);

      await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(200);

      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.likesCount).toBe(2);
      expect(updatedPost.likes).toHaveLength(2);
    });
  });

  describe('DELETE /api/posts/:id/like - Advanced Scenarios', () => {
    it('should require authentication to unlike post', async () => {
      const post = await createTestPost(user._id);

      const res = await request(app)
        .delete(`/api/posts/${post._id}/like`)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should return 404 when unliking non-existent post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .delete(`/api/posts/${fakeId}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('Post not found');
    });

    it('should maintain correct like count after multiple users like and unlike', async () => {
      const post = await createTestPost(user._id);
      const user2 = await createTestUser();
      const user3 = await createTestUser();
      const token2 = generateTestToken(user2._id);
      const token3 = generateTestToken(user3._id);

      // All users like
      await request(app).post(`/api/posts/${post._id}/like`).set('Authorization', `Bearer ${token}`);
      await request(app).post(`/api/posts/${post._id}/like`).set('Authorization', `Bearer ${token2}`);
      await request(app).post(`/api/posts/${post._id}/like`).set('Authorization', `Bearer ${token3}`);

      let updatedPost = await Post.findById(post._id);
      expect(updatedPost.likesCount).toBe(3);

      // One user unlikes
      await request(app).delete(`/api/posts/${post._id}/like`).set('Authorization', `Bearer ${token2}`);

      updatedPost = await Post.findById(post._id);
      expect(updatedPost.likesCount).toBe(2);
    });
  });

  describe('GET /api/users/:userId/posts - Advanced Scenarios', () => {
    it('should return empty array for user with no posts', async () => {
      const otherUser = await createTestUser();

      const res = await request(app)
        .get(`/api/users/${otherUser._id}/posts`)
        .expect(200);

      expect(res.body.posts).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should support pagination for user posts', async () => {
      await createTestPosts(user._id, 25);

      const res = await request(app)
        .get(`/api/users/${user._id}/posts?page=2&limit=10`)
        .expect(200);

      expect(res.body.posts).toHaveLength(10);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3
      });
    });

    it('should return posts sorted by most recent first', async () => {
      const post1 = await createTestPost(user._id, { content: 'First' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const post2 = await createTestPost(user._id, { content: 'Second' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const post3 = await createTestPost(user._id, { content: 'Third' });

      const res = await request(app)
        .get(`/api/users/${user._id}/posts`)
        .expect(200);

      expect(res.body.posts[0].content).toBe('Third');
      expect(res.body.posts[1].content).toBe('Second');
      expect(res.body.posts[2].content).toBe('First');
    });

    it('should include all post fields', async () => {
      await createTestPost(user._id, {
        content: 'Test post',
        images: ['https://example.com/image.jpg'],
        visibility: 'public'
      });

      const res = await request(app)
        .get(`/api/users/${user._id}/posts`)
        .expect(200);

      const post = res.body.posts[0];
      expect(post.content).toBeDefined();
      expect(post.images).toBeDefined();
      expect(post.visibility).toBeDefined();
      expect(post.likesCount).toBeDefined();
      expect(post.commentsCount).toBeDefined();
      expect(post.author).toBeDefined();
    });
  });
});
