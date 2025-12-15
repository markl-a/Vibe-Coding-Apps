const request = require('supertest');
const app = require('../index');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { createTestUser, createTestPost, createTestComment, generateTestToken } = require('./helpers');

describe('Comments API - Advanced Tests', () => {
  let user;
  let token;
  let post;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user._id);
    post = await createTestPost(user._id);
  });

  describe('POST /api/posts/:postId/comments - Advanced Validation', () => {
    it('should require authentication to create comment', async () => {
      const commentData = {
        content: 'Test comment'
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .send(commentData)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should handle comments with minimum valid length', async () => {
      const commentData = {
        content: 'Ok'
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(201);

      expect(res.body.comment.content).toBe('Ok');
    });

    it('should accept comments with maximum allowed length', async () => {
      const commentData = {
        content: 'a'.repeat(1000)
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(201);

      expect(res.body.comment.content).toHaveLength(1000);
    });

    it('should reject comments with only whitespace', async () => {
      const commentData = {
        content: '     '
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should handle nested replies correctly', async () => {
      // Create parent comment
      const parentComment = await createTestComment(post._id, user._id, {
        content: 'Parent comment'
      });

      // Create first level reply
      const replyData = {
        content: 'First level reply',
        parentComment: parentComment._id
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(replyData)
        .expect(201);

      expect(res.body.comment.parentComment).toBe(parentComment._id.toString());

      // Verify parent comment's reply count increased
      const updatedParent = await Comment.findById(parentComment._id);
      expect(updatedParent.repliesCount).toBe(1);
    });

    it('should reject reply to non-existent parent comment', async () => {
      const fakeCommentId = '507f1f77bcf86cd799439011';
      const replyData = {
        content: 'Reply to fake comment',
        parentComment: fakeCommentId
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(replyData)
        .expect(404);

      expect(res.body.error).toBe('Parent comment not found');
    });

    it('should initialize comment with zero likes and replies', async () => {
      const commentData = {
        content: 'New comment'
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(201);

      expect(res.body.comment.likesCount).toBe(0);
      expect(res.body.comment.repliesCount).toBe(0);
    });

    it('should populate author information in created comment', async () => {
      const commentData = {
        content: 'Test comment'
      };

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(201);

      expect(res.body.comment.author).toMatchObject({
        username: user.username,
        displayName: user.displayName
      });
    });

    it('should increment post comment count', async () => {
      const initialPost = await Post.findById(post._id);
      const initialCount = initialPost.commentsCount;

      const commentData = {
        content: 'Test comment'
      };

      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentData)
        .expect(201);

      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.commentsCount).toBe(initialCount + 1);
    });

    it('should handle multiple comments from same user', async () => {
      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'First comment' })
        .expect(201);

      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Second comment' })
        .expect(201);

      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.commentsCount).toBe(2);
    });
  });

  describe('GET /api/posts/:postId/comments - Advanced Scenarios', () => {
    it('should return empty array for post with no comments', async () => {
      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .expect(200);

      expect(res.body.comments).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should handle invalid page numbers gracefully', async () => {
      await createTestComment(post._id, user._id);

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments?page=0`)
        .expect(200);

      expect(res.body.comments).toBeDefined();
    });

    it('should handle very large page numbers', async () => {
      await createTestComment(post._id, user._id);

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments?page=9999`)
        .expect(200);

      expect(res.body.comments).toHaveLength(0);
    });

    it('should return comments sorted by most recent first', async () => {
      const comment1 = await createTestComment(post._id, user._id, { content: 'First' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const comment2 = await createTestComment(post._id, user._id, { content: 'Second' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const comment3 = await createTestComment(post._id, user._id, { content: 'Third' });

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .expect(200);

      expect(res.body.comments[0].content).toBe('Third');
      expect(res.body.comments[1].content).toBe('Second');
      expect(res.body.comments[2].content).toBe('First');
    });

    it('should include author information for each comment', async () => {
      await createTestComment(post._id, user._id, { content: 'Test comment' });

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .expect(200);

      expect(res.body.comments[0].author).toBeDefined();
      expect(res.body.comments[0].author.username).toBe(user.username);
    });

    it('should exclude replies from top-level comments list', async () => {
      const parentComment = await createTestComment(post._id, user._id, { content: 'Parent' });
      await createTestComment(post._id, user._id, {
        content: 'Reply 1',
        parentComment: parentComment._id
      });
      await createTestComment(post._id, user._id, {
        content: 'Reply 2',
        parentComment: parentComment._id
      });

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .expect(200);

      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].content).toBe('Parent');
    });

    it('should handle pagination correctly', async () => {
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

  describe('GET /api/comments/:commentId/replies - Advanced Scenarios', () => {
    it('should return empty array for comment with no replies', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .get(`/api/comments/${comment._id}/replies`)
        .expect(200);

      expect(res.body.replies).toHaveLength(0);
    });

    it('should return replies sorted chronologically (oldest first)', async () => {
      const parentComment = await createTestComment(post._id, user._id);

      const reply1 = await createTestComment(post._id, user._id, {
        content: 'First reply',
        parentComment: parentComment._id
      });
      await new Promise(resolve => setTimeout(resolve, 10));

      const reply2 = await createTestComment(post._id, user._id, {
        content: 'Second reply',
        parentComment: parentComment._id
      });

      const res = await request(app)
        .get(`/api/comments/${parentComment._id}/replies`)
        .expect(200);

      expect(res.body.replies[0].content).toBe('First reply');
      expect(res.body.replies[1].content).toBe('Second reply');
    });

    it('should include author information for replies', async () => {
      const parentComment = await createTestComment(post._id, user._id);
      await createTestComment(post._id, user._id, {
        content: 'Reply',
        parentComment: parentComment._id
      });

      const res = await request(app)
        .get(`/api/comments/${parentComment._id}/replies`)
        .expect(200);

      expect(res.body.replies[0].author).toBeDefined();
      expect(res.body.replies[0].author.username).toBe(user.username);
    });

    it('should handle multiple replies from different users', async () => {
      const parentComment = await createTestComment(post._id, user._id);
      const user2 = await createTestUser();
      const user3 = await createTestUser();

      await createTestComment(post._id, user._id, {
        content: 'Reply from user 1',
        parentComment: parentComment._id
      });
      await createTestComment(post._id, user2._id, {
        content: 'Reply from user 2',
        parentComment: parentComment._id
      });
      await createTestComment(post._id, user3._id, {
        content: 'Reply from user 3',
        parentComment: parentComment._id
      });

      const res = await request(app)
        .get(`/api/comments/${parentComment._id}/replies`)
        .expect(200);

      expect(res.body.replies).toHaveLength(3);
    });
  });

  describe('PUT /api/comments/:commentId - Advanced Scenarios', () => {
    it('should require authentication to update comment', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .send({ content: 'Updated' })
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should return 404 for non-existent comment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .put(`/api/comments/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated' })
        .expect(404);

      expect(res.body.error).toBe('Comment not found');
    });

    it('should preserve original creation date when updating', async () => {
      const comment = await createTestComment(post._id, user._id, { content: 'Original' });
      const originalCreatedAt = comment.createdAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated' })
        .expect(200);

      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('should set isEdited flag and editedAt timestamp', async () => {
      const comment = await createTestComment(post._id, user._id, { content: 'Original' });

      expect(comment.isEdited).toBe(false);

      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated' })
        .expect(200);

      expect(res.body.comment.isEdited).toBe(true);
      expect(res.body.comment.editedAt).toBeDefined();
    });

    it('should reject empty content update', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject content exceeding max length', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'a'.repeat(1001) })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/comments/:commentId - Advanced Scenarios', () => {
    it('should require authentication to delete comment', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should return 404 for non-existent comment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('Comment not found');
    });

    it('should decrement post comment count after deletion', async () => {
      const comment1 = await createTestComment(post._id, user._id);
      const comment2 = await createTestComment(post._id, user._id);

      let updatedPost = await Post.findById(post._id);
      expect(updatedPost.commentsCount).toBe(2);

      await request(app)
        .delete(`/api/comments/${comment1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      updatedPost = await Post.findById(post._id);
      expect(updatedPost.commentsCount).toBe(1);
    });

    it('should decrement parent reply count when deleting a reply', async () => {
      const parentComment = await createTestComment(post._id, user._id);
      const reply = await createTestComment(post._id, user._id, {
        content: 'Reply',
        parentComment: parentComment._id
      });

      let updatedParent = await Comment.findById(parentComment._id);
      expect(updatedParent.repliesCount).toBe(1);

      await request(app)
        .delete(`/api/comments/${reply._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      updatedParent = await Comment.findById(parentComment._id);
      expect(updatedParent.repliesCount).toBe(0);
    });

    it('should completely remove comment from database', async () => {
      const comment = await createTestComment(post._id, user._id);

      await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });
  });

  describe('POST /api/comments/:commentId/like - Advanced Scenarios', () => {
    it('should require authentication to like comment', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .post(`/api/comments/${comment._id}/like`)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should return 404 when liking non-existent comment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .post(`/api/comments/${fakeId}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('Comment not found');
    });

    it('should allow author to like own comment', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .post(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.likesCount).toBe(1);
    });

    it('should track multiple likes from different users', async () => {
      const comment = await createTestComment(post._id, user._id);
      const user2 = await createTestUser();
      const user3 = await createTestUser();
      const token2 = generateTestToken(user2._id);
      const token3 = generateTestToken(user3._id);

      await request(app)
        .post(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      await request(app)
        .post(`/api/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(200);

      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.likesCount).toBe(2);
      expect(updatedComment.likes).toHaveLength(2);
    });
  });

  describe('DELETE /api/comments/:commentId/like - Advanced Scenarios', () => {
    it('should require authentication to unlike comment', async () => {
      const comment = await createTestComment(post._id, user._id);

      const res = await request(app)
        .delete(`/api/comments/${comment._id}/like`)
        .expect(401);

      expect(res.body.error).toBe('No token provided');
    });

    it('should return 404 when unliking non-existent comment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .delete(`/api/comments/${fakeId}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('Comment not found');
    });

    it('should maintain correct like count after multiple likes and unlikes', async () => {
      const comment = await createTestComment(post._id, user._id);
      const user2 = await createTestUser();
      const user3 = await createTestUser();
      const token2 = generateTestToken(user2._id);
      const token3 = generateTestToken(user3._id);

      // All users like
      await request(app).post(`/api/comments/${comment._id}/like`).set('Authorization', `Bearer ${token}`);
      await request(app).post(`/api/comments/${comment._id}/like`).set('Authorization', `Bearer ${token2}`);
      await request(app).post(`/api/comments/${comment._id}/like`).set('Authorization', `Bearer ${token3}`);

      let updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.likesCount).toBe(3);

      // One user unlikes
      await request(app).delete(`/api/comments/${comment._id}/like`).set('Authorization', `Bearer ${token2}`);

      updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.likesCount).toBe(2);

      // Another user unlikes
      await request(app).delete(`/api/comments/${comment._id}/like`).set('Authorization', `Bearer ${token}`);

      updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.likesCount).toBe(1);
    });
  });

  describe('Comment Error Handling', () => {
    it('should handle invalid comment IDs gracefully', async () => {
      const res = await request(app)
        .get('/api/comments/invalid-id/replies')
        .expect(500);

      expect(res.body.error).toBe('Server error');
    });

    it('should handle invalid post IDs when creating comment', async () => {
      const res = await request(app)
        .post('/api/posts/invalid-id/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test comment' })
        .expect(500);

      expect(res.body.error).toBe('Server error');
    });
  });
});
