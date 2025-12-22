const User = require('../models/User');
const Follow = require('../models/Follow');
const { validationResult } = require('express-validator');
const { createLogger } = require('@vibe/shared-utils');
const logger = createLogger('social-media-api:user-controller');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    logger.error('Get user profile error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { displayName, bio, avatar } = req.body;
    const userId = req.user.id;

    if (req.params.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({ message: 'Profile updated successfully', user: user.toPublicJSON() });
  } catch (error) {
    logger.error('Update profile error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Follow user
exports.followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(followingId);
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: followerId,
      following: followingId
    });

    await follow.save();

    // Update counts
    await User.findByIdAndUpdate(followerId, {
      $push: { following: followingId },
      $inc: { followingCount: 1 }
    });

    await User.findByIdAndUpdate(followingId, {
      $push: { followers: followerId },
      $inc: { followersCount: 1 }
    });

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    logger.error('Follow user error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unfollow user
exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot unfollow yourself' });
    }

    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: followingId
    });

    if (!follow) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    // Update counts
    await User.findByIdAndUpdate(followerId, {
      $pull: { following: followingId },
      $inc: { followingCount: -1 }
    });

    await User.findByIdAndUpdate(followingId, {
      $pull: { followers: followerId },
      $inc: { followersCount: -1 }
    });

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    logger.error('Unfollow user error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user followers
exports.getUserFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const follows = await Follow.find({ following: userId })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'username displayName avatar isVerified');

    const total = await Follow.countDocuments({ following: userId });

    const followers = follows.map(f => f.follower);

    res.json({
      followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get followers error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user following
exports.getUserFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const follows = await Follow.find({ follower: userId })
      .skip(skip)
      .limit(limit)
      .populate('following', 'username displayName avatar isVerified');

    const total = await Follow.countDocuments({ follower: userId });

    const following = follows.map(f => f.following);

    res.json({
      following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get following error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchRegex = new RegExp(q, 'i');

    const users = await User.find({
      $or: [
        { username: searchRegex },
        { displayName: searchRegex }
      ]
    })
      .select('-password')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { displayName: searchRegex }
      ]
    });

    res.json({
      users: users.map(u => u.toPublicJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Search users error', error);
    res.status(500).json({ error: 'Server error' });
  }
};
