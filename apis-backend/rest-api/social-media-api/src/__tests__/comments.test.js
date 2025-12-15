const request = require('supertest');
const app = require('../index');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { createTestUser, createTestPost, createTestComment, generateTestToken } = require('./helpers');

describe('Comments API', () => {
  let user;
  let token;
  let post;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user._id);
    post = await createTestPost(user._id);
  });

  describe('POST /api/posts/:postId/comments', () => {
    it('should create a comment successfully', async () => {
      const commentData = {
        content: 'This is a great post!'
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(201);

      expect(res.body.message).toBe('Comment created successfully');
      expect(res.body.comment).toMatchObject({
        content: 'This is a great post!',
        post: post._id.toString()
      });

      // Verify post's comment count increased
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.commentsCount).toBe(1);
    });

    it('should create a reply to a comment', async () => {
      const parentComment = await createTestComment(post._id, user._id, {
        content: 'Parent comment'
      });

      const replyData = {
        content: 'This is a reply',
        parentComment: parentComment._id
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(replyData)
        .expect(201);

      expect(res.body.comment).toMatchObject({
        content: 'This is a reply',
        parentComment: parentComment._id.toString()
      });

      // Verify parent comment's reply count increased
      const updatedParent = await Comment.findById(parentComment._id);
      expect(updatedParent.repliesCount).toBe(1);
    });

    it('should reject comment without authentication', async () => {
      const commentData = {
        content: 'This should fail'
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .send(commentData)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should reject comment on non-existent post', async () => {
      const fakePostId = '507f1f77bcf86cd799439011';
      const commentData = {
        content: 'Comment on fake post'
      };

      const res = await request(app)
        .post(`/api/posts/${fakePostId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(404);

      expect(res.body.error).toBe('Post not found');
    });

    it('should reject comment with empty content', async () => {
      const commentData = {
        content: ''
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject comment exceeding max length', async () => {
      const commentData = {
        content: 'a'.repeat(1001)
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/posts/:postId/comments', () => {
    it('should get all comments for a post', async () => {
      // Create multiple comments
      await createTestComment(post._id, user._id, { content: 'Comment 1' });
      await createTestComment(post._id, user._id, { content: 'Comment 2' });
      await createTestComment(post._id, user._id, { content: 'Comment 3' });

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .expect(200);

      expect(res.body.comments).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3
      });
    });

    it('should only return top-level comments (no replies)', async () => {
      const comment1 = await createTestComment(post._id, user._id, { content: 'Top comment' });
      await createTestComment(post._id, user._id, {
        content: 'Reply to comment',
        parentComment: comment1._id
      });

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .expect(200);

      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].content).toBe('Top comment');
    });

    it('should support pagination', async () => {
      // Create 25 comments
      for (let i = 0; i < 25; i++) {
        await createTestComment(post._id, user._id, { content: `Comment ${i}` });
      }

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments?page=2&limit=10`)
        .expect(200);

      expect(res.body.comments).toHaveLength(10);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3
      });
    });
  });

  describe('GET /api/comments/:commentId/replies', () => {
    it('should get all replies to a comment', async () => {
      const parentComment = await createTestComment(post._id, user._id);

      // Create replies
      await createTestComment(post._id, user._id, {
        content: 'Reply 1',
        parentComment: parentComment._id
      });
      await createTestComment(post._id, user._id, {
        content: 'Reply 2',
        parentComment: parentComment._id
      });

      const res = await request(app)
        .get(`/api/comments/${parentComment._id}/replies`)
        .expect(200);

      expect(res.body.replies).toHaveLength(2);
    });

    it('should return empty array for comment with no replies', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .get(`/api/comments/${comment._id}/replies`)
        .expect(200);

      expect(res.body.replies).toHaveLength(0);
    });
  });

  describe('PUT /api/comments/:commentId', () => {
    it('should update own comment successfully', async () => {
      const comment = await createTestComment(post._id, user._id, {
        content: 'Original comment'
      });

      const updateData = {
        content: 'Updated comment'
      };

      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body.message).toBe('Comment updated successfully');
      expect(res.body.comment).toMatchObject({
        content: 'Updated comment',
        isEdited: true
      });
      expect(res.body.comment.editedAt).toBeDefined();
    });

    it('should not allow updating another user\'s comment', async () => {
      const otherUser = await createTestUser();
      const comment = await createTestComment(post._id, otherUser._id);

      const updateData = {
        content: 'Trying to hack this comment'
      };

      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    it('should delete own comment successfully', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Comment deleted successfully');

      // Verify comment is deleted
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();

      // Verify post's comment count decreased
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.commentsCount).toBe(0);
    });

    it('should not allow deleting another user\'s comment', async () => {
      const otherUser = await createTestUser();
      const comment = await createTestComment(post._id, otherUser._id);

      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/comments/:commentId/like', () => {
    it('should like a comment successfully', async () => {
      const comment = await createTestComment(post._id, user._id);
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      const res = await request(app)
        .post(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(res.body.message).toBe('Comment liked successfully');
      expect(res.body.likesCount).toBe(1);

      // Verify like was added
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.likes).toContainEqual(otherUser._id);
    });

    it('should not allow liking a comment twice', async () => {
      const comment = await createTestComment(post._id, user._id);
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      // First like
      await request(app)
        .post(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      // Second like (should fail)
      const res = await request(app)
        .post(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(400);

      expect(res.body.error).toBe('Comment already liked');
    });
  });

  describe('DELETE /api/comments/:commentId/like', () => {
    it('should unlike a comment successfully', async () => {
      const comment = await createTestComment(post._id, user._id);
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      // First like the comment
      await request(app)
        .post(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      // Then unlike it
      const res = await request(app)
        .delete(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(res.body.message).toBe('Comment unliked successfully');
      expect(res.body.likesCount).toBe(0);

      // Verify like was removed
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.likes).not.toContainEqual(otherUser._id);
    });

    it('should not allow unliking a comment that was not liked', async () => {
      const comment = await createTestComment(post._id, user._id);
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      const res = await request(app)
        .delete(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(400);

      expect(res.body.error).toBe('Comment not liked yet');
    });
  });
});
