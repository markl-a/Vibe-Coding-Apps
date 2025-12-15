const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'User',
    index: true
  },
  preferences: {
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      categories: {
        marketing: { type: Boolean, default: true },
        updates: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        social: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true }
      }
    },
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      categories: {
        marketing: { type: Boolean, default: false },
        updates: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        social: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true }
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly'],
        default: 'immediate'
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      categories: {
        security: { type: Boolean, default: true },
        urgent: { type: Boolean, default: true }
      }
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      }
    }
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      default: '22:00',
      validate: {
        validator: function(v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: 'Invalid time format. Use HH:MM'
      }
    },
    end: {
      type: String,
      default: '08:00',
      validate: {
        validator: function(v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: 'Invalid time format. Use HH:MM'
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  devices: [{
    token: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Method to check if notifications are allowed at current time
notificationPreferenceSchema.methods.isQuietHours = function() {
  if (!this.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const start = this.quietHours.start;
  const end = this.quietHours.end;

  if (start < end) {
    return currentTime >= start && currentTime < end;
  } else {
    return currentTime >= start || currentTime < end;
  }
};

// Method to check if specific notification type is enabled
notificationPreferenceSchema.methods.isNotificationEnabled = function(type, category) {
  if (!this.preferences[type] || !this.preferences[type].enabled) {
    return false;
  }

  if (category && this.preferences[type].categories) {
    return this.preferences[type].categories[category] !== false;
  }

  return true;
};

// Method to add or update device token
notificationPreferenceSchema.methods.addDevice = function(token, platform) {
  const existingDevice = this.devices.find(d => d.token === token);

  if (existingDevice) {
    existingDevice.lastUsedAt = new Date();
    existingDevice.active = true;
  } else {
    this.devices.push({
      token,
      platform,
      active: true,
      registeredAt: new Date(),
      lastUsedAt: new Date()
    });
  }

  return this.save();
};

// Method to remove device token
notificationPreferenceSchema.methods.removeDevice = function(token) {
  this.devices = this.devices.filter(d => d.token !== token);
  return this.save();
};

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
