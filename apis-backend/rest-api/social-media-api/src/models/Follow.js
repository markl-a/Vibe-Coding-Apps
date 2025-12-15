const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Compound index to ensure unique follow relationships
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Prevent self-following
followSchema.pre('save', function(next) {
  if (this.follower.equals(this.following)) {
    const error = new Error('Users cannot follow themselves');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Follow', followSchema);
