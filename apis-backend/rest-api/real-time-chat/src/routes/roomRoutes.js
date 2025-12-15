const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.post('/', roomController.createRoom);
router.get('/', roomController.getUserRooms);
router.get('/:roomId', roomController.getRoom);
router.post('/:roomId/join', roomController.joinRoom);
router.post('/:roomId/leave', roomController.leaveRoom);
router.post('/:roomId/invite', roomController.inviteToRoom);
router.get('/:roomId/members', roomController.getRoomMembers);
router.post('/:roomId/read', roomController.markAsRead);

module.exports = router;
