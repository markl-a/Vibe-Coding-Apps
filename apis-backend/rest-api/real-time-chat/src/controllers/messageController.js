const messageService = require('../services/messageService');

class MessageController {
  async sendMessage(req, res) {
    try {
      const { roomId } = req.params;
      const { content, messageType, fileUrl } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required',
        });
      }

      const message = await messageService.sendMessage(
        roomId,
        req.userId,
        content,
        messageType,
        fileUrl
      );

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await messageService.getMessages(
        roomId,
        req.userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: messages,
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
      const { messageId } = req.params;
      await messageService.markAsRead(messageId, req.userId);

      res.json({
        success: true,
        message: 'Message marked as read',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const count = await messageService.getUnreadCount(req.userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      await messageService.deleteMessage(messageId, req.userId);

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new MessageController();
