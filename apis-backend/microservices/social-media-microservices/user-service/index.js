const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social_users';
const JWT_SECRET = process.env.JWT_SECRET || 'social-media-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Users)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'User Service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Register
app.post('/api/auth/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').trim().notEmpty().withMessage('Display name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = new User({ username, email, password, displayName });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (userId !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { displayName, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { displayName, bio, avatar, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow user
app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const targetId = req.params.id;

    if (userId === targetId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add to following/followers
    if (!user.following.includes(targetId)) {
      user.following.push(targetId);
      targetUser.followers.push(userId);
      await user.save();
      await targetUser.save();
    }

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unfollow user
app.delete('/api/users/:id/follow', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const targetId = req.params.id;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.following = user.following.filter(id => id.toString() !== targetId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

    await user.save();
    await targetUser.save();

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
app.get('/api/users', async (req, res) => {
  try {
    const { q } = req.query;
    const query = q ? {
      $or: [
        { username: new RegExp(q, 'i') },
        { displayName: new RegExp(q, 'i') }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password')
      .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 User Service running on port ${PORT}`);
});
