const DataLoader = require('dataloader');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// 批次載入用戶
const batchUsers = async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });
  return userIds.map(id => userMap[id] || null);
};

// 批次載入文章
const batchPosts = async (postIds) => {
  const posts = await Post.find({ _id: { $in: postIds } });
  const postMap = {};
  posts.forEach(post => {
    postMap[post.id] = post;
  });
  return postIds.map(id => postMap[id] || null);
};

// 批次載入評論（按文章 ID）
const batchCommentsByPost = async (postIds) => {
  const comments = await Comment.find({ post: { $in: postIds } });
  const commentMap = {};
  postIds.forEach(id => {
    commentMap[id] = [];
  });
  comments.forEach(comment => {
    if (commentMap[comment.post]) {
      commentMap[comment.post].push(comment);
    }
  });
  return postIds.map(id => commentMap[id] || []);
};

// 批次載入文章（按作者 ID）
const batchPostsByAuthor = async (authorIds) => {
  const posts = await Post.find({ author: { $in: authorIds } });
  const postMap = {};
  authorIds.forEach(id => {
    postMap[id] = [];
  });
  posts.forEach(post => {
    if (postMap[post.author]) {
      postMap[post.author].push(post);
    }
  });
  return authorIds.map(id => postMap[id] || []);
};

const createLoaders = () => ({
  userLoader: new DataLoader(batchUsers),
  postLoader: new DataLoader(batchPosts),
  commentsByPostLoader: new DataLoader(batchCommentsByPost),
  postsByAuthorLoader: new DataLoader(batchPostsByAuthor)
});

module.exports = { createLoaders };
