const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Please provide a device ID'],
    unique: true,
    trim: true,
    maxlength: [50, 'Device ID cannot exceed 50 characters']
  },
  name: {
    type: String,
    required: [true, 'Please provide a device name'],
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['sensor', 'actuator', 'gateway', 'controller', 'other'],
    default: 'sensor'
  },
  firmwareVersion: {
    type: String,
    required: [true, 'Please provide firmware version'],
    trim: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'error'],
    default: 'offline'
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  ipAddress: {
    type: String,
    trim: true
  },
  macAddress: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true,
    maxlength: [100, 'Manufacturer cannot exceed 100 characters']
  },
  model: {
    type: String,
    trim: true,
    maxlength: [100, 'Model cannot exceed 100 characters']
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
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
deviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 創建索引以優化查詢
deviceSchema.index({ userId: 1, status: 1 });
deviceSchema.index({ userId: 1, type: 1 });
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ lastSeen: 1 });

module.exports = mongoose.model('Device', deviceSchema);
