const Notification = require('../models/notification');
const NotificationPreference = require('../models/notificationPreference');
const pushNotificationService = require('./pushNotificationService');
const emailNotificationService = require('./emailNotificationService');

class NotificationService {
  async createNotification(userId, type, channel, title, body, data = {}, options = {}) {
    const notification = new Notification({
      userId,
      type,
      channel,
      title,
      body,
      data,
      priority: options.priority || 'normal',
      scheduledAt: options.scheduledAt || null,
      metadata: options.metadata || {}
    });

    await notification.save();
    return notification;
  }

  async sendNotification(notificationId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Check user preferences
    const preference = await NotificationPreference.findOne({ userId: notification.userId });

    if (preference) {
      // Check quiet hours
      if (preference.isQuietHours() && notification.priority !== 'urgent') {
        return {
          success: false,
          reason: 'quiet_hours',
          message: 'Notification blocked by quiet hours'
        };
      }

      // Check if notification type is enabled
      const category = notification.data.category;
      if (!preference.isNotificationEnabled(notification.type, category)) {
        return {
          success: false,
          reason: 'disabled',
          message: 'Notification type disabled by user'
        };
      }
    }

    let result;
    try {
      switch (notification.type) {
        case 'push':
          result = await this._sendPushNotification(notification, preference);
          break;
        case 'email':
          result = await this._sendEmailNotification(notification);
          break;
        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      if (result.success) {
        await notification.markAsSent();
        if (notification.type === 'push') {
          await notification.markAsDelivered();
        }
      } else {
        await notification.markAsFailed(result.error || 'Unknown error');
      }

      return result;
    } catch (error) {
      await notification.markAsFailed(error.message);
      throw error;
    }
  }

  async _sendPushNotification(notification, preference) {
    if (!preference || !preference.devices || preference.devices.length === 0) {
      return {
        success: false,
        error: 'No devices registered'
      };
    }

    const activeTokens = preference.devices
      .filter(d => d.active)
      .map(d => d.token);

    if (activeTokens.length === 0) {
      return {
        success: false,
        error: 'No active devices'
      };
    }

    if (activeTokens.length === 1) {
      return await pushNotificationService.sendToDevice(
        activeTokens[0],
        notification,
        notification.data
      );
    } else {
      return await pushNotificationService.sendToMultipleDevices(
        activeTokens,
        notification,
        notification.data
      );
    }
  }

  async _sendEmailNotification(notification) {
    // In a real app, you'd get the user's email from the database
    const userEmail = notification.data.email;
    if (!userEmail) {
      return {
        success: false,
        error: 'User email not provided'
      };
    }

    const html = emailNotificationService.createNotificationEmail(
      notification.title,
      notification.body,
      notification.data.actionUrl,
      notification.data.actionText
    );

    return await emailNotificationService.sendEmail(
      userEmail,
      notification.title,
      html
    );
  }

  async getNotifications(userId, options = {}) {
    const {
      status,
      type,
      limit = 50,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = { userId };
    if (status) query.status = status;
    if (type) query.type = type;

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const notifications = await Notification.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.markAsRead();
    return notification;
  }

  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, status: { $in: ['sent', 'delivered'] } },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );

    return {
      modifiedCount: result.modifiedCount
    };
  }

  async deleteNotification(notificationId, userId) {
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    if (result.deletedCount === 0) {
      throw new Error('Notification not found');
    }
    return { success: true };
  }

  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      userId,
      status: { $in: ['sent', 'delivered'] }
    });

    return { count };
  }

  async processScheduledNotifications() {
    const now = new Date();
    const notifications = await Notification.find({
      status: 'pending',
      scheduledAt: { $lte: now, $ne: null }
    });

    const results = [];
    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification._id);
        results.push({ notificationId: notification._id, ...result });
      } catch (error) {
        results.push({
          notificationId: notification._id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async retryFailedNotifications(maxRetries = 3) {
    const notifications = await Notification.find({
      status: 'failed',
      retryCount: { $lt: maxRetries }
    });

    const results = [];
    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification._id);
        results.push({ notificationId: notification._id, ...result });
      } catch (error) {
        results.push({
          notificationId: notification._id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new NotificationService();
