const DataLoader = require('dataloader');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// 批次載入用戶
// Optimized with field selection and lean for better performance
const batchUsers = async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } })
    .select('_id name email avatar bio createdAt') // Select only needed fields
    .lean(); // Use lean for better performance

  const userMap = {};
  users.forEach(user => {
    userMap[user._id.toString()] = user;
  });
  return userIds.map(id => userMap[id.toString()] || null);
};

// 批次載入文章
// Optimized with field selection and lean for better performance
const batchPosts = async (postIds) => {
  const posts = await Post.find({ _id: { $in: postIds } })
    .select('_id title content excerpt author categories tags createdAt updatedAt publishedAt status viewCount') // Select only needed fields
    .lean(); // Use lean for better performance

  const postMap = {};
  posts.forEach(post => {
    postMap[post._id.toString()] = post;
  });
  return postIds.map(id => postMap[id.toString()] || null);
};

// 批次載入評論（按文章 ID）
// Optimized to prevent N+1 queries with limit, sort, and field selection
const batchCommentsByPost = async (postIds) => {
  const COMMENTS_LIMIT = 50; // Limit comments per post

  const comments = await Comment.find({ post: { $in: postIds } })
    .select('_id content createdAt updatedAt author post isApproved') // Select only needed fields
    .populate('author', 'name email avatar') // Populate author with limited fields
    .sort({ createdAt: -1 }) // Sort by most recent first
    .lean(); // Use lean for better performance

  const commentMap = {};
  postIds.forEach(id => {
    commentMap[id.toString()] = [];
  });

  comments.forEach(comment => {
    const postId = comment.post.toString();
    if (commentMap[postId]) {
      commentMap[postId].push(comment);
    }
  });

  // Apply limit per post to prevent returning too many comments
  return postIds.map(id => {
    const postComments = commentMap[id.toString()] || [];
    return postComments.slice(0, COMMENTS_LIMIT);
  });
};

// 批次載入文章（按作者 ID）
// Optimized with limit, sort, field selection and lean for better performance
const batchPostsByAuthor = async (authorIds) => {
  const POSTS_LIMIT = 100; // Limit posts per author

  const posts = await Post.find({ author: { $in: authorIds } })
    .select('_id title excerpt author createdAt publishedAt status viewCount') // Select only needed fields
    .sort({ publishedAt: -1 }) // Sort by most recent published first
    .lean(); // Use lean for better performance

  const postMap = {};
  authorIds.forEach(id => {
    postMap[id.toString()] = [];
  });

  posts.forEach(post => {
    const authorId = post.author.toString();
    if (postMap[authorId]) {
      postMap[authorId].push(post);
    }
  });

  // Apply limit per author to prevent returning too many posts
  return authorIds.map(id => {
    const authorPosts = postMap[id.toString()] || [];
    return authorPosts.slice(0, POSTS_LIMIT);
  });
};

const createLoaders = () => ({
  userLoader: new DataLoader(batchUsers),
  postLoader: new DataLoader(batchPosts),
  commentsByPostLoader: new DataLoader(batchCommentsByPost),
  postsByAuthorLoader: new DataLoader(batchPostsByAuthor)
});

module.exports = { createLoaders };
