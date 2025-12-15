const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ========== Auth Routes ==========
router.post('/auth/register', [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').optional().trim().isLength({ max: 50 })
], authController.register);

router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

router.get('/auth/me', authenticate, authController.getCurrentUser);

// ========== Post Routes ==========
router.post('/posts', authenticate, [
  body('content').trim().isLength({ min: 1, max: 5000 }),
  body('images').optional().isArray(),
  body('visibility').optional().isIn(['public', 'followers', 'private'])
], postController.createPost);

router.get('/posts', optionalAuth, postController.getTimeline);
router.get('/posts/:id', optionalAuth, postController.getPost);

router.put('/posts/:id', authenticate, [
  body('content').trim().isLength({ min: 1, max: 5000 }),
  body('images').optional().isArray(),
  body('visibility').optional().isIn(['public', 'followers', 'private'])
], postController.updatePost);

router.delete('/posts/:id', authenticate, postController.deletePost);

router.post('/posts/:id/like', authenticate, postController.likePost);
router.delete('/posts/:id/like', authenticate, postController.unlikePost);

// ========== Comment Routes ==========
router.post('/posts/:postId/comments', authenticate, [
  body('content').trim().isLength({ min: 1, max: 1000 }),
  body('parentComment').optional().isMongoId()
], commentController.createComment);

router.get('/posts/:postId/comments', commentController.getPostComments);
router.get('/comments/:commentId/replies', commentController.getCommentReplies);

router.put('/comments/:commentId', authenticate, [
  body('content').trim().isLength({ min: 1, max: 1000 })
], commentController.updateComment);

router.delete('/comments/:commentId', authenticate, commentController.deleteComment);

router.post('/comments/:commentId/like', authenticate, commentController.likeComment);
router.delete('/comments/:commentId/like', authenticate, commentController.unlikeComment);

// ========== User Routes ==========
router.get('/users/search', userController.searchUsers);
router.get('/users/:userId', userController.getUserProfile);
router.get('/users/:userId/posts', postController.getUserPosts);

router.put('/users/:userId', authenticate, [
  body('displayName').optional().trim().isLength({ max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('avatar').optional().isURL()
], userController.updateUserProfile);

router.post('/users/:userId/follow', authenticate, userController.followUser);
router.delete('/users/:userId/follow', authenticate, userController.unfollowUser);

router.get('/users/:userId/followers', userController.getUserFollowers);
router.get('/users/:userId/following', userController.getUserFollowing);

module.exports = router;
