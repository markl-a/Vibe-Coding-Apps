const roomService = require('../services/roomService');

class RoomController {
  async createRoom(req, res) {
    try {
      const { name, description, type } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Room name is required',
        });
      }

      const room = await roomService.createRoom(req.userId, name, description, type);

      res.status(201).json({
        success: true,
        data: room,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getRoom(req, res) {
    try {
      const { roomId } = req.params;
      const room = await roomService.getRoomById(roomId, req.userId);

      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getUserRooms(req, res) {
    try {
      const rooms = await roomService.getUserRooms(req.userId);

      res.json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      await roomService.joinRoom(roomId, req.userId);

      res.json({
        success: true,
        message: 'Joined room successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      await roomService.leaveRoom(roomId, req.userId);

      res.json({
        success: true,
        message: 'Left room successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async inviteToRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      await roomService.inviteToRoom(roomId, req.userId, userId);

      res.json({
        success: true,
        message: 'User invited successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getRoomMembers(req, res) {
    try {
      const { roomId } = req.params;
      const members = await roomService.getRoomMembers(roomId);

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { roomId } = req.params;
      await roomService.markRoomAsRead(roomId, req.userId);

      res.json({
        success: true,
        message: 'Room marked as read',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new RoomController();
