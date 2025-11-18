const { GraphQLError } = require('graphql');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { generateToken } = require('../utils/auth');
const aiService = require('../services/aiService');
const {
  DateTimeScalar,
  EmailScalar,
  URLScalar,
  PositiveIntScalar,
} = require('../utils/customScalars');

const requireAuth = (user) => {
  if (!user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
};

/**
 * 增強版 Resolvers
 * 整合所有功能：AI、分頁、篩選、排序等
 */
const enhancedResolvers = {
  // ============================================
  // 自定義 Scalars
  // ============================================
  DateTime: DateTimeScalar,
  Email: EmailScalar,
  URL: URLScalar,
  PositiveInt: PositiveIntScalar,

  // ============================================
  // Queries
  // ============================================
  Query: {
    // 基本文章查詢（支援篩選和排序）
    posts: async (parent, { limit = 10, offset = 0, filter, sort }) => {
      const query = {};

      // 應用篩選
      if (filter) {
        if (filter.author) query.author = filter.author;
        if (filter.tags) query.tags = { $in: filter.tags };
        if (filter.published !== undefined) query.published = filter.published;
        if (filter.dateFrom || filter.dateTo) {
          query.createdAt = {};
          if (filter.dateFrom) query.createdAt.$gte = new Date(filter.dateFrom);
          if (filter.dateTo) query.createdAt.$lte = new Date(filter.dateTo);
        }
        if (filter.minViews) query.views = { $gte: filter.minViews };
      }

      // 構建排序
      let sortQuery = { createdAt: -1 }; // 預設排序
      if (sort) {
        const sortField = sort.field.toLowerCase();
        const sortOrder = sort.order === 'ASC' ? 1 : -1;
        sortQuery = { [sortField === 'created_at' ? 'createdAt' : sortField]: sortOrder };
      }

      return await Post.find(query)
        .sort(sortQuery)
        .limit(limit)
        .skip(offset);
    },

    // Cursor-based 分頁
    postsConnection: async (parent, { first = 10, after, filter, sort }) => {
      const query = {};

      // 應用篩選（與上面相同）
      if (filter) {
        if (filter.author) query.author = filter.author;
        if (filter.tags) query.tags = { $in: filter.tags };
        if (filter.published !== undefined) query.published = filter.published;
        if (filter.dateFrom || filter.dateTo) {
          query.createdAt = {};
          if (filter.dateFrom) query.createdAt.$gte = new Date(filter.dateFrom);
          if (filter.dateTo) query.createdAt.$lte = new Date(filter.dateTo);
        }
        if (filter.minViews) query.views = { $gte: filter.minViews };
      }

      // 如果提供了 cursor，添加到查詢
      if (after) {
        const decodedCursor = Buffer.from(after, 'base64').toString('utf-8');
        query._id = { $gt: decodedCursor };
      }

      // 構建排序
      let sortQuery = { _id: 1 }; // cursor 分頁需要穩定排序
      if (sort) {
        const sortField = sort.field.toLowerCase();
        const sortOrder = sort.order === 'ASC' ? 1 : -1;
        sortQuery = {
          [sortField === 'created_at' ? 'createdAt' : sortField]: sortOrder,
          _id: 1,
        };
      }

      // 查詢 first + 1 個項目來判斷是否有下一頁
      const posts = await Post.find(query)
        .sort(sortQuery)
        .limit(first + 1);

      const hasNextPage = posts.length > first;
      const nodes = hasNextPage ? posts.slice(0, first) : posts;

      // 獲取總數（用於 pageInfo）
      const totalCount = await Post.countDocuments(query);

      const edges = nodes.map((node) => ({
        node,
        cursor: Buffer.from(node._id.toString()).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          totalCount,
        },
        totalCount,
      };
    },

    // 單一文章
    post: async (parent, { id }) => {
      const post = await Post.findById(id);
      if (post) {
        // 增加瀏覽數
        post.views += 1;
        await post.save();
      }
      return post;
    },

    // 通過 slug 獲取文章
    postBySlug: async (parent, { slug }) => {
      const post = await Post.findOne({ slug });
      if (post) {
        post.views += 1;
        await post.save();
      }
      return post;
    },

    // 搜尋文章
    searchPosts: async (parent, { query }) => {
      return await Post.find({ $text: { $search: query } }).limit(20);
    },

    // AI 增強搜尋
    enhancedSearch: async (parent, { query }) => {
      const results = await Post.find({ $text: { $search: query } }).limit(10);

      if (results.length === 0) {
        const suggestions = await aiService.generateSearchSuggestions(query);
        return {
          query,
          suggestions: Array.isArray(suggestions) ? suggestions : [],
          correctedQuery: null,
        };
      }

      return {
        query,
        suggestions: [],
        correctedQuery: null,
      };
    },

    // 推薦文章
    recommendedPosts: async (parent, { postId, limit = 5 }) => {
      if (postId) {
        const currentPost = await Post.findById(postId);
        if (!currentPost) return [];

        // 基於標籤推薦
        return await Post.find({
          _id: { $ne: postId },
          tags: { $in: currentPost.tags },
          published: true,
        }).limit(limit);
      }

      // 預設返回最新文章
      return await Post.find({ published: true })
        .sort({ createdAt: -1 })
        .limit(limit);
    },

    // 趨勢文章
    trendingPosts: async (parent, { limit = 10 }) => {
      return await Post.find({ published: true })
        .sort({ views: -1, likes: -1 })
        .limit(limit);
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
      return await Comment.find({ post: postId }).sort({ createdAt: -1 });
    },

    comment: async (parent, { id }) => {
      return await Comment.findById(id);
    },

    // 統計
    stats: async () => {
      const [totalPosts, totalUsers, totalComments] = await Promise.all([
        Post.countDocuments(),
        User.countDocuments(),
        Comment.countDocuments(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const postsToday = await Post.countDocuments({
        createdAt: { $gte: today },
      });

      return {
        totalPosts,
        totalUsers,
        totalComments,
        postsToday,
      };
    },
  },

  // ============================================
  // Mutations
  // ============================================
  Mutation: {
    // 認證
    register: async (parent, { name, email, password }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new GraphQLError('Email already in use', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const user = await User.create({ name, email, password });
      const token = generateToken(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      return { token, user, expiresAt };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = generateToken(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      return { token, user, expiresAt };
    },

    // 創建文章（支援 AI 增強）
    createPost: async (parent, { input }, { user }) => {
      requireAuth(user);

      const postData = {
        title: input.title,
        content: input.content,
        author: user.id,
        published: input.published !== undefined ? input.published : false,
      };

      if (input.tags) {
        postData.tags = input.tags;
      }

      const post = await Post.create(postData);

      // AI 增強功能
      if (input.generateSummary) {
        try {
          const summary = await aiService.generateSummary(post.content, 200);
          post.excerpt = summary;
        } catch (error) {
          console.error('Summary generation failed:', error);
        }
      }

      if (input.generateSEO) {
        try {
          const seo = await aiService.generateSEOContent(post.title, post.content);
          // SEO 數據可以存儲在單獨的集合中
        } catch (error) {
          console.error('SEO generation failed:', error);
        }
      }

      // 如果沒有提供標籤且內容足夠長，自動生成
      if (!input.tags && post.content.length > 100) {
        try {
          const tags = await aiService.generateTags(post.content, 5);
          post.tags = tags;
        } catch (error) {
          console.error('Tag generation failed:', error);
        }
      }

      await post.save();
      return post;
    },

    // 更新文章
    updatePost: async (parent, { id, input }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(id);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (post.author.toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (input.title) post.title = input.title;
      if (input.content) post.content = input.content;
      if (input.tags) post.tags = input.tags;
      if (input.published !== undefined) post.published = input.published;

      await post.save();
      return post;
    },

    // 刪除文章
    deletePost: async (parent, { id }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(id);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (post.author.toString() !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await Post.findByIdAndDelete(id);
      await Comment.deleteMany({ post: id });

      return true;
    },

    // AI 功能
    generatePostSummary: async (parent, { postId }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const summary = await aiService.generateSummary(post.content, 200);
      post.excerpt = summary;
      await post.save();

      return summary;
    },

    generatePostSEO: async (parent, { postId }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return await aiService.generateSEOContent(post.title, post.content);
    },

    generatePostTags: async (parent, { postId }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const tags = await aiService.generateTags(post.content, 8);
      post.tags = tags;
      await post.save();

      return tags;
    },

    analyzePostSentiment: async (parent, { postId }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return await aiService.analyzeSentiment(post.content);
    },

    suggestContentImprovements: async (parent, { postId }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const suggestions = await aiService.suggestImprovements(post.content);
      return [
        { type: 'content', suggestion: suggestions, priority: 1 },
      ];
    },

    // 內容創作
    generateOutline: async (parent, { topic, keywords }, { user }) => {
      requireAuth(user);
      return await aiService.generateOutline(topic, keywords || []);
    },

    expandContent: async (parent, { outline, section }, { user }) => {
      requireAuth(user);
      return await aiService.expandContent(outline, section);
    },

    proofreadContent: async (parent, { content }, { user }) => {
      requireAuth(user);
      return await aiService.proofread(content);
    },

    translateContent: async (parent, { content, targetLanguage }, { user }) => {
      requireAuth(user);
      return await aiService.translate(content, targetLanguage);
    },

    // 評論
    addComment: async (parent, { postId, content, parentId }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const commentData = {
        content,
        author: user.id,
        post: postId,
      };

      if (parentId) {
        const parentComment = await Comment.findById(parentId);
        if (!parentComment) {
          throw new GraphQLError('Parent comment not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        commentData.parentComment = parentId;
      }

      const comment = await Comment.create(commentData);
      return comment;
    },

    updateComment: async (parent, { id, content }, { user }) => {
      requireAuth(user);

      const comment = await Comment.findById(id);
      if (!comment) {
        throw new GraphQLError('Comment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (comment.author.toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      comment.content = content;
      await comment.save();

      return comment;
    },

    deleteComment: async (parent, { id }, { user }) => {
      requireAuth(user);

      const comment = await Comment.findById(id);
      if (!comment) {
        throw new GraphQLError('Comment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (comment.author.toString() !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await Comment.findByIdAndDelete(id);
      // 也刪除所有回覆
      await Comment.deleteMany({ parentComment: id });

      return true;
    },

    // 互動
    likePost: async (parent, { postId }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      post.likes += 1;
      await post.save();

      return post;
    },

    unlikePost: async (parent, { postId }, { user }) => {
      requireAuth(user);

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (post.likes > 0) {
        post.likes -= 1;
        await post.save();
      }

      return post;
    },

    likeComment: async (parent, { commentId }, { user }) => {
      requireAuth(user);

      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new GraphQLError('Comment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      comment.likes += 1;
      await comment.save();

      return comment;
    },

    unlikeComment: async (parent, { commentId }, { user }) => {
      requireAuth(user);

      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new GraphQLError('Comment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (comment.likes > 0) {
        comment.likes -= 1;
        await comment.save();
      }

      return comment;
    },

    // 用戶管理
    updateProfile: async (parent, { name, bio, avatar }, { user }) => {
      requireAuth(user);

      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();
      return user;
    },

    changePassword: async (parent, { oldPassword, newPassword }, { user }) => {
      requireAuth(user);

      const isValid = await user.comparePassword(oldPassword);
      if (!isValid) {
        throw new GraphQLError('Invalid old password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      user.password = newPassword;
      await user.save();

      return true;
    },
  },

  // ============================================
  // Field Resolvers
  // ============================================
  Post: {
    author: async (parent, args, { loaders }) => {
      return await loaders.userLoader.load(parent.author);
    },

    comments: async (parent, args, { loaders }) => {
      return await loaders.commentsByPostLoader.load(parent.id);
    },

    // AI 相關欄位
    aiSummary: (parent) => parent.excerpt || null,

    aiRecommendations: async (parent) => {
      try {
        return await Post.find({
          _id: { $ne: parent.id },
          tags: { $in: parent.tags },
          published: true,
        }).limit(3);
      } catch (error) {
        return [];
      }
    },
  },

  Comment: {
    author: async (parent, args, { loaders }) => {
      return await loaders.userLoader.load(parent.author);
    },

    post: async (parent, args, { loaders }) => {
      return await loaders.postLoader.load(parent.post);
    },

    replies: async (parent) => {
      return await Comment.find({ parentComment: parent.id });
    },

    parentComment: async (parent) => {
      if (!parent.parentComment) return null;
      return await Comment.findById(parent.parentComment);
    },
  },

  User: {
    posts: async (parent, args, { loaders }) => {
      return await loaders.postsByAuthorLoader.load(parent.id);
    },

    comments: async (parent) => {
      return await Comment.find({ author: parent.id });
    },
  },
};

module.exports = enhancedResolvers;
