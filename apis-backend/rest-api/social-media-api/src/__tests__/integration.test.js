const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');

describe('Integration Tests - End-to-End Workflows', () => {
  describe('Complete User Journey', () => {
    it('should complete full user registration and login flow', async () => {
      // Register new user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'journeyuser',
          email: 'journey@example.com',
          password: 'password123',
          displayName: 'Journey User'
        })
        .expect(201);

      expect(registerRes.body.token).toBeDefined();
      expect(registerRes.body.user.username).toBe('journeyuser');

      // Login with same credentials
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'journey@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginRes.body.token).toBeDefined();
      expect(loginRes.body.user.email).toBe('journey@example.com');

      // Get current user profile
      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .expect(200);

      expect(profileRes.body.user.username).toBe('journeyuser');
    });

    it('should complete user profile update flow', async () => {
      // Register user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'profileuser',
          email: 'profile@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = registerRes.body.token;
      const userId = registerRes.body.user._id;

      // Update profile
      const updateRes = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          displayName: 'Updated Name',
          bio: 'My awesome bio',
          avatar: 'https://example.com/avatar.jpg'
        })
        .expect(200);

      expect(updateRes.body.user).toMatchObject({
        displayName: 'Updated Name',
        bio: 'My awesome bio',
        avatar: 'https://example.com/avatar.jpg'
      });

      // Verify profile was updated
      const getRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(getRes.body.user).toMatchObject({
        displayName: 'Updated Name',
        bio: 'My awesome bio'
      });
    });
  });

  describe('Social Interaction Workflow', () => {
    it('should complete follow and unfollow flow', async () => {
      // Create two users
      const user1Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'follower',
          email: 'follower@example.com',
          password: 'password123'
        })
        .expect(201);

      const user2Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'following',
          email: 'following@example.com',
          password: 'password123'
        })
        .expect(201);

      const user1Token = user1Res.body.token;
      const user2Id = user2Res.body.user._id;

      // User1 follows User2
      await request(app)
        .post(`/api/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify following list
      const followingRes = await request(app)
        .get(`/api/users/${user1Res.body.user._id}/following`)
        .expect(200);

      expect(followingRes.body.following).toHaveLength(1);
      expect(followingRes.body.following[0].username).toBe('following');

      // Verify followers list
      const followersRes = await request(app)
        .get(`/api/users/${user2Id}/followers`)
        .expect(200);

      expect(followersRes.body.followers).toHaveLength(1);
      expect(followersRes.body.followers[0].username).toBe('follower');

      // User1 unfollows User2
      await request(app)
        .delete(`/api/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify lists are empty
      const emptyFollowingRes = await request(app)
        .get(`/api/users/${user1Res.body.user._id}/following`)
        .expect(200);

      expect(emptyFollowingRes.body.following).toHaveLength(0);
    });

    it('should complete mutual follow flow', async () => {
      // Create two users
      const user1Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'mutualuser1',
          email: 'mutual1@example.com',
          password: 'password123'
        })
        .expect(201);

      const user2Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'mutualuser2',
          email: 'mutual2@example.com',
          password: 'password123'
        })
        .expect(201);

      // User1 follows User2
      await request(app)
        .post(`/api/users/${user2Res.body.user._id}/follow`)
        .set('Authorization', `Bearer ${user1Res.body.token}`)
        .expect(200);

      // User2 follows User1
      await request(app)
        .post(`/api/users/${user1Res.body.user._id}/follow`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .expect(200);

      // Verify both users have 1 follower and 1 following
      const user1Profile = await request(app)
        .get(`/api/users/${user1Res.body.user._id}`)
        .expect(200);

      expect(user1Profile.body.user.followersCount).toBe(1);
      expect(user1Profile.body.user.followingCount).toBe(1);

      const user2Profile = await request(app)
        .get(`/api/users/${user2Res.body.user._id}`)
        .expect(200);

      expect(user2Profile.body.user.followersCount).toBe(1);
      expect(user2Profile.body.user.followingCount).toBe(1);
    });
  });

  describe('Post Creation and Interaction Workflow', () => {
    it('should complete full post lifecycle', async () => {
      // Register user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'postuser',
          email: 'post@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = userRes.body.token;

      // Create post
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'My first post!',
          images: ['https://example.com/image.jpg']
        })
        .expect(201);

      const postId = createRes.body.post._id;
      expect(createRes.body.post.content).toBe('My first post!');

      // Get post
      const getRes = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(getRes.body.post.content).toBe('My first post!');

      // Update post
      const updateRes = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Updated post content'
        })
        .expect(200);

      expect(updateRes.body.post.content).toBe('Updated post content');
      expect(updateRes.body.post.isEdited).toBe(true);

      // Delete post
      await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/posts/${postId}`)
        .expect(404);
    });

    it('should complete post like and unlike workflow', async () => {
      // Create two users
      const user1Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'author',
          email: 'author@example.com',
          password: 'password123'
        })
        .expect(201);

      const user2Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'liker',
          email: 'liker@example.com',
          password: 'password123'
        })
        .expect(201);

      // User1 creates post
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Res.body.token}`)
        .send({
          content: 'Post to be liked'
        })
        .expect(201);

      const postId = postRes.body.post._id;

      // User2 likes the post
      const likeRes = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .expect(200);

      expect(likeRes.body.likesCount).toBe(1);

      // Get post and verify like count
      const getRes = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(getRes.body.post.likesCount).toBe(1);

      // User2 unlikes the post
      const unlikeRes = await request(app)
        .delete(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .expect(200);

      expect(unlikeRes.body.likesCount).toBe(0);
    });
  });

  describe('Comment Creation and Interaction Workflow', () => {
    it('should complete full comment lifecycle', async () => {
      // Register user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'commentuser',
          email: 'comment@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = userRes.body.token;

      // Create post
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Post with comments'
        })
        .expect(201);

      const postId = postRes.body.post._id;

      // Create comment
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'First comment'
        })
        .expect(201);

      const commentId = commentRes.body.comment._id;
      expect(commentRes.body.comment.content).toBe('First comment');

      // Get post comments
      const getCommentsRes = await request(app)
        .get(`/api/posts/${postId}/comments`)
        .expect(200);

      expect(getCommentsRes.body.comments).toHaveLength(1);
      expect(getCommentsRes.body.comments[0].content).toBe('First comment');

      // Update comment
      const updateRes = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Updated comment'
        })
        .expect(200);

      expect(updateRes.body.comment.content).toBe('Updated comment');
      expect(updateRes.body.comment.isEdited).toBe(true);

      // Delete comment
      await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify comment was deleted
      const finalCommentsRes = await request(app)
        .get(`/api/posts/${postId}/comments`)
        .expect(200);

      expect(finalCommentsRes.body.comments).toHaveLength(0);
    });

    it('should complete nested comment reply workflow', async () => {
      // Register user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'replyuser',
          email: 'reply@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = userRes.body.token;

      // Create post
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Post with nested comments'
        })
        .expect(201);

      const postId = postRes.body.post._id;

      // Create parent comment
      const parentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Parent comment'
        })
        .expect(201);

      const parentId = parentRes.body.comment._id;

      // Create reply
      const replyRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Reply to parent',
          parentComment: parentId
        })
        .expect(201);

      expect(replyRes.body.comment.parentComment).toBe(parentId);

      // Get replies
      const getRepliesRes = await request(app)
        .get(`/api/comments/${parentId}/replies`)
        .expect(200);

      expect(getRepliesRes.body.replies).toHaveLength(1);
      expect(getRepliesRes.body.replies[0].content).toBe('Reply to parent');

      // Verify top-level comments don't include replies
      const getCommentsRes = await request(app)
        .get(`/api/posts/${postId}/comments`)
        .expect(200);

      expect(getCommentsRes.body.comments).toHaveLength(1);
      expect(getCommentsRes.body.comments[0].content).toBe('Parent comment');
    });

    it('should complete comment like workflow', async () => {
      // Create two users
      const user1Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'commenter',
          email: 'commenter@example.com',
          password: 'password123'
        })
        .expect(201);

      const user2Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'commentliker',
          email: 'commentliker@example.com',
          password: 'password123'
        })
        .expect(201);

      // User1 creates post
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Res.body.token}`)
        .send({
          content: 'Post for comment likes'
        })
        .expect(201);

      // User1 creates comment
      const commentRes = await request(app)
        .post(`/api/posts/${postRes.body.post._id}/comments`)
        .set('Authorization', `Bearer ${user1Res.body.token}`)
        .send({
          content: 'Comment to be liked'
        })
        .expect(201);

      const commentId = commentRes.body.comment._id;

      // User2 likes the comment
      const likeRes = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .expect(200);

      expect(likeRes.body.likesCount).toBe(1);

      // User2 unlikes the comment
      const unlikeRes = await request(app)
        .delete(`/api/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .expect(200);

      expect(unlikeRes.body.likesCount).toBe(0);
    });
  });

  describe('Multi-User Social Network Simulation', () => {
    it('should simulate a complete social network scenario', async () => {
      // Create 3 users
      const user1Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123',
          displayName: 'Alice'
        })
        .expect(201);

      const user2Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bob',
          email: 'bob@example.com',
          password: 'password123',
          displayName: 'Bob'
        })
        .expect(201);

      const user3Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'charlie',
          email: 'charlie@example.com',
          password: 'password123',
          displayName: 'Charlie'
        })
        .expect(201);

      // Alice follows Bob and Charlie
      await request(app)
        .post(`/api/users/${user2Res.body.user._id}/follow`)
        .set('Authorization', `Bearer ${user1Res.body.token}`)
        .expect(200);

      await request(app)
        .post(`/api/users/${user3Res.body.user._id}/follow`)
        .set('Authorization', `Bearer ${user1Res.body.token}`)
        .expect(200);

      // Bob follows Alice
      await request(app)
        .post(`/api/users/${user1Res.body.user._id}/follow`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .expect(200);

      // Alice creates a post
      const alicePostRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Res.body.token}`)
        .send({
          content: 'Hello everyone!'
        })
        .expect(201);

      // Bob likes Alice's post
      await request(app)
        .post(`/api/posts/${alicePostRes.body.post._id}/like`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .expect(200);

      // Charlie comments on Alice's post
      const charlieCommentRes = await request(app)
        .post(`/api/posts/${alicePostRes.body.post._id}/comments`)
        .set('Authorization', `Bearer ${user3Res.body.token}`)
        .send({
          content: 'Nice post, Alice!'
        })
        .expect(201);

      // Bob replies to Charlie's comment
      await request(app)
        .post(`/api/posts/${alicePostRes.body.post._id}/comments`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .send({
          content: 'I agree!',
          parentComment: charlieCommentRes.body.comment._id
        })
        .expect(201);

      // Verify final state
      const aliceProfile = await request(app)
        .get(`/api/users/${user1Res.body.user._id}`)
        .expect(200);

      expect(aliceProfile.body.user.followingCount).toBe(2);
      expect(aliceProfile.body.user.followersCount).toBe(1);
      expect(aliceProfile.body.user.postsCount).toBe(1);

      const postDetails = await request(app)
        .get(`/api/posts/${alicePostRes.body.post._id}`)
        .expect(200);

      expect(postDetails.body.post.likesCount).toBe(1);
      expect(postDetails.body.post.commentsCount).toBe(2);

      const comments = await request(app)
        .get(`/api/posts/${alicePostRes.body.post._id}/comments`)
        .expect(200);

      expect(comments.body.comments).toHaveLength(1); // Only top-level comment

      const replies = await request(app)
        .get(`/api/comments/${charlieCommentRes.body.comment._id}/replies`)
        .expect(200);

      expect(replies.body.replies).toHaveLength(1);
    });
  });

  describe('User Search and Discovery Workflow', () => {
    it('should complete user search and follow workflow', async () => {
      // Create users with searchable names
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'developer1',
          email: 'dev1@example.com',
          password: 'password123',
          displayName: 'Senior Developer'
        })
        .expect(201);

      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'developer2',
          email: 'dev2@example.com',
          password: 'password123',
          displayName: 'Junior Developer'
        })
        .expect(201);

      const searcherRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'searcher',
          email: 'searcher@example.com',
          password: 'password123'
        })
        .expect(201);

      // Search for developers
      const searchRes = await request(app)
        .get('/api/users/search?q=developer')
        .expect(200);

      expect(searchRes.body.users.length).toBeGreaterThanOrEqual(2);

      // Follow first search result
      const userToFollow = searchRes.body.users[0];
      await request(app)
        .post(`/api/users/${userToFollow._id}/follow`)
        .set('Authorization', `Bearer ${searcherRes.body.token}`)
        .expect(200);

      // Verify following
      const followingRes = await request(app)
        .get(`/api/users/${searcherRes.body.user._id}/following`)
        .expect(200);

      expect(followingRes.body.following).toHaveLength(1);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency across operations', async () => {
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'consistencytest',
          email: 'consistency@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = userRes.body.token;
      const userId = userRes.body.user._id;

      // Create multiple posts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `Post ${i}` })
          .expect(201);
      }

      // Verify user post count
      const userProfile = await User.findById(userId);
      expect(userProfile.postsCount).toBe(5);

      // Get user posts
      const postsRes = await request(app)
        .get(`/api/users/${userId}/posts`)
        .expect(200);

      expect(postsRes.body.posts).toHaveLength(5);
      expect(postsRes.body.pagination.total).toBe(5);
    });
  });
});
