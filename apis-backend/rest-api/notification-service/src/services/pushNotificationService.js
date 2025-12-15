const admin = require('firebase-admin');

class PushNotificationService {
  constructor() {
    this.initialized = false;
  }

  initialize(serviceAccount) {
    if (this.initialized) {
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }

  async sendToDevice(token, notification, data = {}) {
    if (!this.initialized) {
      throw new Error('Push notification service not initialized');
    }

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: this._convertDataToStrings(data),
      android: {
        priority: this._mapPriority(notification.priority),
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    try {
      const response = await admin.messaging().send(message);
      return {
        success: true,
        messageId: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async sendToMultipleDevices(tokens, notification, data = {}) {
    if (!this.initialized) {
      throw new Error('Push notification service not initialized');
    }

    if (!tokens || tokens.length === 0) {
      return {
        success: false,
        error: 'No tokens provided'
      };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: this._convertDataToStrings(data),
      tokens
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendToTopic(topic, notification, data = {}) {
    if (!this.initialized) {
      throw new Error('Push notification service not initialized');
    }

    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: this._convertDataToStrings(data)
    };

    try {
      const response = await admin.messaging().send(message);
      return {
        success: true,
        messageId: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async subscribeToTopic(tokens, topic) {
    if (!this.initialized) {
      throw new Error('Push notification service not initialized');
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async unsubscribeFromTopic(tokens, topic) {
    if (!this.initialized) {
      throw new Error('Push notification service not initialized');
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  _convertDataToStrings(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }

  _mapPriority(priority) {
    const priorityMap = {
      'low': 'normal',
      'normal': 'normal',
      'high': 'high',
      'urgent': 'high'
    };
    return priorityMap[priority] || 'normal';
  }
}

module.exports = new PushNotificationService();
