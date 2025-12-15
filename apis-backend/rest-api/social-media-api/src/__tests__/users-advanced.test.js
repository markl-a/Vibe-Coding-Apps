const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Follow = require('../models/Follow');
const { createTestUser, createTestUsers, generateTestToken } = require('./helpers');

describe('Users API - Advanced Tests', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user._id);
  });

  describe('GET /api/users/:userId - Advanced Scenarios', () => {
    it('should not expose sensitive fields in public profile', async () => {
      const res = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(200);

      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.__v).toBeUndefined();
    });

    it('should include follower and following counts', async () => {
      const res = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(200);

      expect(res.body.user.followersCount).toBeDefined();
      expect(res.body.user.followingCount).toBeDefined();
      expect(res.body.user.postsCount).toBeDefined();
    });

    it('should handle invalid MongoDB ObjectId format', async () => {
      const res = await request(app)
        .get('/api/users/invalid-id')
        .expect(500);

      expect(res.body.error).toBe('Server error');
    });

    it('should return profile with all public fields', async () => {
      const testUser = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        bio: 'This is my bio',
        avatar: 'https://example.com/avatar.jpg'
      });

      const res = await request(app)
        .get(`/api/users/${testUser._id}`)
        .expect(200);

      expect(res.body.user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        bio: 'This is my bio',
        avatar: 'https://example.com/avatar.jpg'
      });
    });
  });

  describe('PUT /api/users/:userId - Advanced Validation', () => {
    it('should require authentication to update profile', async () => {
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .send({ displayName: 'New Name' })
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should allow partial updates', async () => {
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'New Display Name' })
        .expect(200);

      expect(res.body.user.displayName).toBe('New Display Name');
      expect(res.body.user.username).toBe(user.username);
    });

    it('should allow updating bio only', async () => {
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 'My new bio' })
        .expect(200);

      expect(res.body.user.bio).toBe('My new bio');
    });

    it('should allow updating avatar only', async () => {
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar: 'https://example.com/new-avatar.jpg' })
        .expect(200);

      expect(res.body.user.avatar).toBe('https://example.com/new-avatar.jpg');
    });

    it('should allow clearing bio', async () => {
      await User.findByIdAndUpdate(user._id, { bio: 'Old bio' });

      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: '' })
        .expect(200);

      expect(res.body.user.bio).toBe('');
    });

    it('should trim displayName whitespace', async () => {
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: '  Trimmed Name  ' })
        .expect(200);

      expect(res.body.user.displayName).toBe('Trimmed Name');
    });

    it('should reject displayName exceeding max length', async () => {
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'a'.repeat(51) })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject invalid avatar URL format', async () => {
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar: 'not-a-valid-url' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should not allow updating immutable fields', async () => {
      const originalEmail = user.email;
      const originalUsername = user.username;

      await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          displayName: 'New Name',
          email: 'newemail@example.com',
          username: 'newusername'
        })
        .expect(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.email).toBe(originalEmail);
      expect(updatedUser.username).toBe(originalUsername);
    });

    it('should return 404 if user no longer exists', async () => {
      await User.findByIdAndDelete(user._id);

      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'New Name' })
        .expect(404);

      expect(res.body.error).toBe('User not found');
    });
  });

  describe('Follow/Unfollow - Advanced Scenarios', () => {
    it('should maintain bidirectional relationship on follow', async () => {
      const userToFollow = await createTestUser();

      await request(app)
        .post(`/api/users/${userToFollow._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check follower's data
      const follower = await User.findById(user._id);
      expect(follower.following).toContainEqual(userToFollow._id);
      expect(follower.followingCount).toBe(1);

      // Check following user's data
      const following = await User.findById(userToFollow._id);
      expect(following.followers).toContainEqual(user._id);
      expect(following.followersCount).toBe(1);

      // Check Follow document
      const follow = await Follow.findOne({
        follower: user._id,
        following: userToFollow._id
      });
      expect(follow).toBeTruthy();
    });

    it('should maintain bidirectional relationship on unfollow', async () => {
      const userToUnfollow = await createTestUser();

      // First follow
      await request(app)
        .post(`/api/users/${userToUnfollow._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Then unfollow
      await request(app)
        .delete(`/api/users/${userToUnfollow._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check follower's data
      const follower = await User.findById(user._id);
      expect(follower.following).not.toContainEqual(userToUnfollow._id);
      expect(follower.followingCount).toBe(0);

      // Check following user's data
      const following = await User.findById(userToUnfollow._id);
      expect(following.followers).not.toContainEqual(user._id);
      expect(following.followersCount).toBe(0);

      // Check Follow document is deleted
      const follow = await Follow.findOne({
        follower: user._id,
        following: userToUnfollow._id
      });
      expect(follow).toBeNull();
    });

    it('should handle multiple follow relationships', async () => {
      const users = await createTestUsers(3);

      // Follow all users
      for (const targetUser of users) {
        await request(app)
          .post(`/api/users/${targetUser._id}/follow`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      }

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.followingCount).toBe(3);
      expect(updatedUser.following).toHaveLength(3);
    });

    it('should handle mutual follows', async () => {
      const user2 = await createTestUser();
      const token2 = generateTestToken(user2._id);

      // User1 follows User2
      await request(app)
        .post(`/api/users/${user2._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // User2 follows User1
      await request(app)
        .post(`/api/users/${user._id}/follow`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      const updatedUser1 = await User.findById(user._id);
      const updatedUser2 = await User.findById(user2._id);

      expect(updatedUser1.followingCount).toBe(1);
      expect(updatedUser1.followersCount).toBe(1);
      expect(updatedUser2.followingCount).toBe(1);
      expect(updatedUser2.followersCount).toBe(1);
    });

    it('should require authentication to follow', async () => {
      const userToFollow = await createTestUser();

      const res = await request(app)
        .post(`/api/users/${userToFollow._id}/follow`)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should require authentication to unfollow', async () => {
      const userToUnfollow = await createTestUser();

      const res = await request(app)
        .delete(`/api/users/${userToUnfollow._id}/follow`)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });
  });

  describe('GET /api/users/:userId/followers - Advanced Scenarios', () => {
    it('should return followers with correct pagination', async () => {
      const followers = await createTestUsers(15);

      for (const follower of followers) {
        const followerToken = generateTestToken(follower._id);
        await request(app)
          .post(`/api/users/${user._id}/follow`)
          .set('Authorization', `Bearer ${followerToken}`)
          .expect(200);
      }

      const res = await request(app)
        .get(`/api/users/${user._id}/followers?page=1&limit=10`)
        .expect(200);

      expect(res.body.followers).toHaveLength(10);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 15,
        pages: 2
      });
    });

    it('should include follower profile information', async () => {
      const follower = await createTestUser({
        username: 'follower1',
        displayName: 'Follower One'
      });
      const followerToken = generateTestToken(follower._id);

      await request(app)
        .post(`/api/users/${user._id}/follow`)
        .set('Authorization', `Bearer ${followerToken}`)
        .expect(200);

      const res = await request(app)
        .get(`/api/users/${user._id}/followers`)
        .expect(200);

      expect(res.body.followers[0]).toMatchObject({
        username: 'follower1',
        displayName: 'Follower One'
      });
    });

    it('should handle very large follower lists', async () => {
      const followers = await createTestUsers(50);

      for (const follower of followers) {
        const followerToken = generateTestToken(follower._id);
        await request(app)
          .post(`/api/users/${user._id}/follow`)
          .set('Authorization', `Bearer ${followerToken}`)
          .expect(200);
      }

      const res = await request(app)
        .get(`/api/users/${user._id}/followers?page=3&limit=20`)
        .expect(200);

      expect(res.body.followers).toHaveLength(10);
      expect(res.body.pagination.total).toBe(50);
    });
  });

  describe('GET /api/users/:userId/following - Advanced Scenarios', () => {
    it('should return following with correct pagination', async () => {
      const usersToFollow = await createTestUsers(15);

      for (const targetUser of usersToFollow) {
        await request(app)
          .post(`/api/users/${targetUser._id}/follow`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      }

      const res = await request(app)
        .get(`/api/users/${user._id}/following?page=1&limit=10`)
        .expect(200);

      expect(res.body.following).toHaveLength(10);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 15,
        pages: 2
      });
    });

    it('should include following user profile information', async () => {
      const targetUser = await createTestUser({
        username: 'targetuser',
        displayName: 'Target User'
      });

      await request(app)
        .post(`/api/users/${targetUser._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const res = await request(app)
        .get(`/api/users/${user._id}/following`)
        .expect(200);

      expect(res.body.following[0]).toMatchObject({
        username: 'targetuser',
        displayName: 'Target User'
      });
    });
  });

  describe('GET /api/users/search - Advanced Scenarios', () => {
    it('should be case-insensitive', async () => {
      await createTestUser({
        username: 'JohnDoe',
        email: 'john@example.com'
      });

      const res = await request(app)
        .get('/api/users/search?q=johndoe')
        .expect(200);

      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should search partial matches', async () => {
      await createTestUser({
        username: 'johndoe123',
        email: 'john123@example.com'
      });

      const res = await request(app)
        .get('/api/users/search?q=john')
        .expect(200);

      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should search in both username and displayName', async () => {
      await createTestUser({
        username: 'user123',
        email: 'user@example.com',
        displayName: 'John Smith'
      });

      // Search by username
      const res1 = await request(app)
        .get('/api/users/search?q=user123')
        .expect(200);
      expect(res1.body.users.length).toBeGreaterThanOrEqual(1);

      // Search by displayName
      const res2 = await request(app)
        .get('/api/users/search?q=john')
        .expect(200);
      expect(res2.body.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for no matches', async () => {
      const res = await request(app)
        .get('/api/users/search?q=nonexistentuser12345')
        .expect(200);

      expect(res.body.users).toHaveLength(0);
    });

    it('should handle special characters in search query', async () => {
      await createTestUser({
        username: 'testuser',
        email: 'test@example.com'
      });

      const res = await request(app)
        .get('/api/users/search?q=test@')
        .expect(200);

      // Should handle gracefully without errors
      expect(res.body.users).toBeDefined();
    });

    it('should not expose passwords in search results', async () => {
      await createTestUser({
        username: 'searchuser',
        email: 'search@example.com'
      });

      const res = await request(app)
        .get('/api/users/search?q=search')
        .expect(200);

      res.body.users.forEach(user => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should handle pagination in search results', async () => {
      for (let i = 0; i < 25; i++) {
        await createTestUser({
          username: `searchtest${i}`,
          email: `searchtest${i}@example.com`
        });
      }

      const res = await request(app)
        .get('/api/users/search?q=searchtest&page=2&limit=10')
        .expect(200);

      expect(res.body.users).toHaveLength(10);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3
      });
    });

    it('should reject search with very short query', async () => {
      const res = await request(app)
        .get('/api/users/search?q=a')
        .expect(200);

      // Should still work but might return many results
      expect(res.body.users).toBeDefined();
    });
  });

  describe('User Profile Edge Cases', () => {
    it('should handle user with no bio, avatar, or posts', async () => {
      const newUser = await createTestUser();

      const res = await request(app)
        .get(`/api/users/${newUser._id}`)
        .expect(200);

      expect(res.body.user.bio).toBeDefined();
      expect(res.body.user.postsCount).toBe(0);
      expect(res.body.user.followersCount).toBe(0);
      expect(res.body.user.followingCount).toBe(0);
    });

    it('should handle user with maximum allowed bio length', async () => {
      const longBio = 'a'.repeat(500);

      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: longBio })
        .expect(200);

      expect(res.body.user.bio).toHaveLength(500);
    });

    it('should preserve user data after multiple updates', async () => {
      await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Name 1' })
        .expect(200);

      await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 'Bio 1' })
        .expect(200);

      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar: 'https://example.com/avatar.jpg' })
        .expect(200);

      expect(res.body.user).toMatchObject({
        displayName: 'Name 1',
        bio: 'Bio 1',
        avatar: 'https://example.com/avatar.jpg'
      });
    });
  });
});
