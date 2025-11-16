const { GraphQLError } = require('graphql');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { generateToken } = require('../utils/auth');

const requireAuth = (user) => {
  if (!user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
};

const resolvers = {
  Query: {
    // 文章查詢
    posts: async (parent, { limit = 10, offset = 0 }) => {
      return await Post.find().limit(limit).skip(offset).sort({ createdAt: -1 });
    },

    post: async (parent, { id }) => {
      return await Post.findById(id);
    },

    searchPosts: async (parent, { query }) => {
      return await Post.find({ $text: { $search: query } });
    },

    // 用戶查詢
    user: async (parent, { id }) => {
      return await User.findById(id);
    },

    me: async (parent, args, { user }) => {
      requireAuth(user);
      return user;
    },

    // 評論查詢
    comments: async (parent, { postId }) => {
      return await Comment.find({ post: postId });
    }
  },

  Mutation: {
    // 註冊
    register: async (parent, { name, email, password }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new GraphQLError('Email already in use', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const user = await User.create({ name, email, password });
      const token = generateToken(user.id);

      return { token, user };
    },

    // 登入
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const token = generateToken(user.id);
      return { token, user };
    },

    // 創建文章
    createPost: async (parent, { title, content, published }, { user }) => {
      requireAuth(user);

      const post = await Post.create({
        title,
        content,
        published: published !== undefined ? published : false,
        author: user.id
      });

      return post;
    },

    // 更新文章
    updatePost: async (parent, { id, title, content, published }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(id);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (post.author.toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      if (title) post.title = title;
      if (content) post.content = content;
      if (published !== undefined) post.published = published;
      post.updatedAt = Date.now();

      await post.save();
      return post;
    },

    // 刪除文章
    deletePost: async (parent, { id }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(id);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (post.author.toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await Post.findByIdAndDelete(id);
      await Comment.deleteMany({ post: id });

      return true;
    },

    // 添加評論
    addComment: async (parent, { postId, content }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      const comment = await Comment.create({
        content,
        author: user.id,
        post: postId
      });

      return comment;
    },

    // 刪除評論
    deleteComment: async (parent, { id }, { user }) => {
      requireAuth(user);

      const comment = await Comment.findById(id);
      if (!comment) {
        throw new GraphQLError('Comment not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (comment.author.toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await Comment.findByIdAndDelete(id);
      return true;
    }
  },

  // Field Resolvers (使用 DataLoader)
  Post: {
    author: async (parent, args, { loaders }) => {
      return await loaders.userLoader.load(parent.author);
    },
    comments: async (parent, args, { loaders }) => {
      return await loaders.commentsByPostLoader.load(parent.id);
    }
  },

  Comment: {
    author: async (parent, args, { loaders }) => {
      return await loaders.userLoader.load(parent.author);
    },
    post: async (parent, args, { loaders }) => {
      return await loaders.postLoader.load(parent.post);
    }
  },

  User: {
    posts: async (parent, args, { loaders }) => {
      return await loaders.postsByAuthorLoader.load(parent.id);
    }
  }
};

module.exports = resolvers;
