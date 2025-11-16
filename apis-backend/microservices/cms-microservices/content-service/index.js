const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_content';
const JWT_SECRET = process.env.JWT_SECRET || 'cms-secret';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (CMS Content)'))
  .catch(err => console.error('❌ MongoDB error:', err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor', 'author'], default: 'author' },
  createdAt: { type: Date, default: Date.now }
});

const contentSchema = new mongoose.Schema({
  type: { type: String, enum: ['article', 'page'], required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  categories: [String],
  tags: [String],
  metadata: {
    seoTitle: String,
    seoDescription: String,
    keywords: [String]
  },
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Content = mongoose.model('Content', contentSchema);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Content Service' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get content list
app.get('/api/content', async (req, res) => {
  try {
    const { type, status, limit = 20 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const content = await Content.find(query)
      .populate('author', 'email')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ content, total: content.length });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single content
app.get('/api/content/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id).populate('author', 'email');
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create content
app.post('/api/content', [
  body('title').notEmpty(),
  body('slug').notEmpty(),
  body('content').notEmpty(),
  body('type').isIn(['article', 'page'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const content = new Content(req.body);
    await content.save();

    res.status(201).json({ message: 'Content created', content });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update content
app.put('/api/content/:id', async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json({ message: 'Content updated', content });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete content
app.delete('/api/content/:id', async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json({ message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Publish content
app.post('/api/content/:id/publish', async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { status: 'published', publishedAt: Date.now() },
      { new: true }
    );
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json({ message: 'Content published', content });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Content Service running on port ${PORT}`);
});
