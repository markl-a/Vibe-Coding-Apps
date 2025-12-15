const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Please provide a device ID']
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical', 'emergency'],
    default: 'info'
  },
  type: {
    type: String,
    enum: ['cpu', 'memory', 'temperature', 'network', 'firmware', 'custom'],
    required: [true, 'Please provide alert type']
  },
  message: {
    type: String,
    required: [true, 'Please provide alert message'],
    trim: true,
    maxlength: [500, 'Alert message cannot exceed 500 characters']
  },
  value: {
    type: mongoose.Schema.Types.Mixed
  },
  threshold: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'ignored'],
    default: 'active'
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 在更新時自動更新 updatedAt
alertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 創建索引以優化查詢
alertSchema.index({ deviceId: 1, status: 1 });
alertSchema.index({ userId: 1, severity: 1 });
alertSchema.index({ userId: 1, status: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
