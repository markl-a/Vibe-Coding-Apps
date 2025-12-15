const mongoose = require('mongoose');

const statusReportSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Please provide a device ID']
  },
  cpuUsage: {
    type: Number,
    min: 0,
    max: 100
  },
  memoryUsage: {
    type: Number,
    min: 0,
    max: 100
  },
  temperature: {
    type: Number
  },
  uptime: {
    type: Number, // in seconds
    min: 0
  },
  networkStatus: {
    signalStrength: {
      type: Number,
      min: -100,
      max: 0
    },
    bytesReceived: {
      type: Number,
      min: 0
    },
    bytesSent: {
      type: Number,
      min: 0
    },
    latency: {
      type: Number,
      min: 0
    }
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  firmwareVersion: {
    type: String,
    trim: true
  },
  errorCount: {
    type: Number,
    min: 0,
    default: 0
  },
  warningCount: {
    type: Number,
    min: 0,
    default: 0
  },
  customMetrics: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 創建索引以優化查詢
statusReportSchema.index({ deviceId: 1, timestamp: -1 });
statusReportSchema.index({ userId: 1, timestamp: -1 });
statusReportSchema.index({ timestamp: -1 });

// TTL 索引 - 自動刪除 90 天前的報告
statusReportSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('StatusReport', statusReportSchema);
