const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  published: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
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

// 文字搜尋索引
postSchema.index({ title: 'text', content: 'text' });

// 複合索引（用於排序和篩選）
postSchema.index({ published: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ views: -1, likes: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ slug: 1 }, { unique: true, sparse: true });

// 生成 slug（如果沒有提供）
postSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // 添加隨機字串以確保唯一性
    this.slug += '-' + Math.random().toString(36).substring(2, 8);
  }

  // 更新 updatedAt
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);
