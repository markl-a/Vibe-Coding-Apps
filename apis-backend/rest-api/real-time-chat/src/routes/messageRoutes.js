const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.post('/rooms/:roomId/messages', messageController.sendMessage);
router.get('/rooms/:roomId/messages', messageController.getMessages);
router.post('/messages/:messageId/read', messageController.markAsRead);
router.delete('/messages/:messageId', messageController.deleteMessage);
router.get('/unread', messageController.getUnreadCount);

module.exports = router;
