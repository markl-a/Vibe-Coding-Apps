const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: String,
    enum: ['invoice', 'contract', 'proposal', 'report', 'manual', 'certificate', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['billing', 'technical', 'legal', 'general'],
    default: 'general'
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: Date,
  expiresAt: Date,
  tags: [String],
  metadata: {
    orderId: String,
    ticketId: String,
    referenceNumber: String,
    version: String
  },
  uploadedBy: {
    name: String,
    email: String
  }
}, {
  timestamps: true
});

// Increment download count
documentSchema.methods.recordDownload = async function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  await this.save();
};

// Check if document is accessible
documentSchema.methods.isAccessible = function() {
  if (this.isArchived) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

// Add indexes
documentSchema.index({ customer: 1, createdAt: -1 });
documentSchema.index({ type: 1, category: 1 });
documentSchema.index({ tags: 1 });

module.exports = mongoose.model('Document', documentSchema);
