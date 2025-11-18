const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    name: String,
    email: String,
    role: {
      type: String,
      enum: ['customer', 'agent', 'system'],
      default: 'customer'
    }
  },
  content: {
    type: String,
    required: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'general', 'complaint', 'feature_request', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'waiting_internal', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    name: String,
    email: String,
    department: String
  },
  channel: {
    type: String,
    enum: ['web', 'email', 'phone', 'chat', 'social'],
    default: 'web'
  },
  tags: [String],
  comments: [commentSchema],
  attachments: [{
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sla: {
    responseTime: Number,  // in minutes
    resolutionTime: Number,  // in minutes
    firstResponseAt: Date,
    resolvedAt: Date
  },
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  },
  relatedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  metadata: {
    orderId: String,
    productId: String,
    userAgent: String,
    ipAddress: String,
    referrer: String
  },
  closedAt: Date,
  closeReason: String
}, {
  timestamps: true
});

// Auto-generate ticket number
ticketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.ticketNumber = `TKT-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Add comment to ticket
ticketSchema.methods.addComment = async function(author, content, isInternal = false, attachments = []) {
  this.comments.push({
    author,
    content,
    isInternal,
    attachments
  });

  // Record first response time if this is the first agent response
  if (author.role === 'agent' && !this.sla.firstResponseAt) {
    this.sla.firstResponseAt = new Date();
  }

  await this.save();
  return this.comments[this.comments.length - 1];
};

// Close ticket
ticketSchema.methods.close = async function(reason) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closeReason = reason;

  if (this.sla.firstResponseAt && !this.sla.resolvedAt) {
    this.sla.resolvedAt = new Date();
  }

  await this.save();
};

// Reopen ticket
ticketSchema.methods.reopen = async function() {
  this.status = 'open';
  this.closedAt = null;
  this.closeReason = null;
  await this.save();
};

// Calculate SLA compliance
ticketSchema.methods.isSLACompliant = function() {
  if (!this.sla.responseTime || !this.sla.firstResponseAt) return null;

  const responseMinutes = (this.sla.firstResponseAt - this.createdAt) / (1000 * 60);
  return responseMinutes <= this.sla.responseTime;
};

// Add indexes
ticketSchema.index({ customer: 1, createdAt: -1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ category: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
