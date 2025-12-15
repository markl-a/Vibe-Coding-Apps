const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Follow = require('../models/Follow');
const { createTestUser, createTestUsers, generateTestToken } = require('./helpers');

describe('Users API', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user._id);
  });

  describe('GET /api/users/:userId', () => {
    it('should get user profile successfully', async () => {
      const res = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(200);

      expect(res.body.user).toMatchObject({
        username: user.username,
        email: user.email,
        displayName: user.displayName
      });
      expect(res.body.user.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expect(res.body.error).toBe('User not found');
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('should update own profile successfully', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'This is my new bio',
        avatar: 'https://example.com/avatar.jpg'
      };

      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body.message).toBe('Profile updated successfully');
      expect(res.body.user).toMatchObject({
        displayName: 'Updated Name',
        bio: 'This is my new bio',
        avatar: 'https://example.com/avatar.jpg'
      });
    });

    it('should not allow updating another user\'s profile', async () => {
      const otherUser = await createTestUser();

      const updateData = {
        displayName: 'Hacked Name'
      };

      const res = await request(app)
        .put(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('should reject bio exceeding max length', async () => {
      const updateData = {
        bio: 'a'.repeat(501)
      };

      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/users/:userId/follow', () => {
    it('should follow a user successfully', async () => {
      const userToFollow = await createTestUser();

      const res = await request(app)
        .post(`/api/users/${userToFollow._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('User followed successfully');

      // Verify follow relationship exists
      const follow = await Follow.findOne({
        follower: user._id,
        following: userToFollow._id
      });
      expect(follow).toBeTruthy();

      // Verify follower's following count increased
      const updatedFollower = await User.findById(user._id);
      expect(updatedFollower.followingCount).toBe(1);
      expect(updatedFollower.following).toContainEqual(userToFollow._id);

      // Verify following user's follower count increased
      const updatedFollowing = await User.findById(userToFollow._id);
      expect(updatedFollowing.followersCount).toBe(1);
      expect(updatedFollowing.followers).toContainEqual(user._id);
    });

    it('should not allow following the same user twice', async () => {
      const userToFollow = await createTestUser();

      // First follow
      await request(app)
        .post(`/api/users/${userToFollow._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Second follow (should fail)
      const res = await request(app)
        .post(`/api/users/${userToFollow._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.error).toBe('Already following this user');
    });

    it('should not allow following yourself', async () => {
      const res = await request(app)
        .post(`/api/users/${user._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.error).toBe('Cannot follow yourself');
    });

    it('should return 404 when following non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .post(`/api/users/${fakeId}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('User not found');
    });
  });

  describe('DELETE /api/users/:userId/follow', () => {
    it('should unfollow a user successfully', async () => {
      const userToUnfollow = await createTestUser();

      // First follow the user
      await request(app)
        .post(`/api/users/${userToUnfollow._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Then unfollow
      const res = await request(app)
        .delete(`/api/users/${userToUnfollow._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('User unfollowed successfully');

      // Verify follow relationship deleted
      const follow = await Follow.findOne({
        follower: user._id,
        following: userToUnfollow._id
      });
      expect(follow).toBeNull();

      // Verify follower's following count decreased
      const updatedFollower = await User.findById(user._id);
      expect(updatedFollower.followingCount).toBe(0);
      expect(updatedFollower.following).not.toContainEqual(userToUnfollow._id);

      // Verify following user's follower count decreased
      const updatedFollowing = await User.findById(userToUnfollow._id);
      expect(updatedFollowing.followersCount).toBe(0);
      expect(updatedFollowing.followers).not.toContainEqual(user._id);
    });

    it('should not allow unfollowing a user not being followed', async () => {
      const otherUser = await createTestUser();

      const res = await request(app)
        .delete(`/api/users/${otherUser._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.error).toBe('Not following this user');
    });

    it('should not allow unfollowing yourself', async () => {
      const res = await request(app)
        .delete(`/api/users/${user._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.error).toBe('Cannot unfollow yourself');
    });
  });

  describe('GET /api/users/:userId/followers', () => {
    it('should get list of user followers', async () => {
      const followers = await createTestUsers(3);

      // Make all users follow the main user
      for (const follower of followers) {
        const followerToken = generateTestToken(follower._id);
        await request(app)
          .post(`/api/users/${user._id}/follow`)
          .set('Authorization', `Bearer ${followerToken}`)
          .expect(200);
      }

      const res = await request(app)
        .get(`/api/users/${user._id}/followers`)
        .expect(200);

      expect(res.body.followers).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3
      });
    });

    it('should return empty array for user with no followers', async () => {
      const res = await request(app)
        .get(`/api/users/${user._id}/followers`)
        .expect(200);

      expect(res.body.followers).toHaveLength(0);
    });

    it('should support pagination for followers', async () => {
      const followers = await createTestUsers(25);

      // Make all users follow the main user
      for (const follower of followers) {
        const followerToken = generateTestToken(follower._id);
        await request(app)
          .post(`/api/users/${user._id}/follow`)
          .set('Authorization', `Bearer ${followerToken}`)
          .expect(200);
      }

      const res = await request(app)
        .get(`/api/users/${user._id}/followers?page=2&limit=10`)
        .expect(200);

      expect(res.body.followers).toHaveLength(10);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3
      });
    });
  });

  describe('GET /api/users/:userId/following', () => {
    it('should get list of users being followed', async () => {
      const usersToFollow = await createTestUsers(3);

      // Follow all users
      for (const userToFollow of usersToFollow) {
        await request(app)
          .post(`/api/users/${userToFollow._id}/follow`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      }

      const res = await request(app)
        .get(`/api/users/${user._id}/following`)
        .expect(200);

      expect(res.body.following).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3
      });
    });

    it('should return empty array for user not following anyone', async () => {
      const res = await request(app)
        .get(`/api/users/${user._id}/following`)
        .expect(200);

      expect(res.body.following).toHaveLength(0);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users by username', async () => {
      await createTestUser({
        username: 'johndoe',
        email: 'john@example.com'
      });
      await createTestUser({
        username: 'johnsmith',
        email: 'smith@example.com'
      });
      await createTestUser({
        username: 'alice',
        email: 'alice@example.com'
      });

      const res = await request(app)
        .get('/api/users/search?q=john')
        .expect(200);

      expect(res.body.users.length).toBeGreaterThanOrEqual(2);
      res.body.users.forEach(user => {
        expect(user.username.toLowerCase()).toContain('john');
      });
    });

    it('should search users by display name', async () => {
      await createTestUser({
        username: 'user1',
        email: 'user1@example.com',
        displayName: 'John Doe'
      });
      await createTestUser({
        username: 'user2',
        email: 'user2@example.com',
        displayName: 'Jane Smith'
      });

      const res = await request(app)
        .get('/api/users/search?q=jane')
        .expect(200);

      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.users[0].displayName).toContain('Jane');
    });

    it('should return 400 for empty search query', async () => {
      const res = await request(app)
        .get('/api/users/search?q=')
        .expect(400);

      expect(res.body.error).toBe('Search query is required');
    });

    it('should support pagination for search results', async () => {
      // Create 25 users with similar names
      for (let i = 0; i < 25; i++) {
        await createTestUser({
          username: `testuser${i}`,
          email: `testuser${i}@example.com`,
          displayName: `Test User ${i}`
        });
      }

      const res = await request(app)
        .get('/api/users/search?q=test&page=2&limit=10')
        .expect(200);

      expect(res.body.users).toHaveLength(10);
      expect(res.body.pagination.page).toBe(2);
    });
  });
});
