const { GraphQLError } = require('graphql');
const Post = require('../models/Post');
const aiService = require('../services/aiService');

/**
 * AI 功能相關的 Resolvers
 */
const aiResolvers = {
  Query: {
    /**
     * 智能搜尋增強
     */
    enhancedSearch: async (parent, { query }, context) => {
      try {
        // 基本搜尋
        const results = await Post.find({ $text: { $search: query } }).limit(10);

        // AI 增強
        const enhancement = await aiService.enhanceSearch(query, results);

        // 如果沒有找到結果，生成搜尋建議
        if (results.length === 0) {
          const suggestions = await aiService.generateSearchSuggestions(query);
          return {
            query,
            suggestions,
            correctedQuery: null,
          };
        }

        return {
          query,
          suggestions: enhancement.suggestions || [],
          correctedQuery: enhancement.correctedQuery || null,
        };
      } catch (error) {
        console.error('Enhanced search error:', error);
        throw new GraphQLError('Failed to perform enhanced search', {
          extensions: { code: 'SEARCH_ERROR' },
        });
      }
    },

    /**
     * 推薦文章
     */
    recommendedPosts: async (parent, { postId, limit = 5 }, context) => {
      try {
        let currentPost = null;
        let userHistory = [];

        if (postId) {
          currentPost = await Post.findById(postId);
          if (!currentPost) {
            throw new GraphQLError('Post not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
        }

        // 獲取用戶歷史（如果已登入）
        if (context.user) {
          // 這裡應該從用戶閱讀歷史中獲取
          userHistory = await Post.find({ author: context.user.id }).limit(5);
        }

        // 使用 AI 生成推薦
        const recommendations = await aiService.generateRecommendations(
          currentPost || { title: 'New user' },
          userHistory,
          limit
        );

        // 如果 AI 返回的是 ID 列表，查詢實際的文章
        if (recommendations.length > 0 && typeof recommendations[0] === 'string') {
          return await Post.find({ _id: { $in: recommendations } }).limit(limit);
        }

        // 退回方案：返回最新的文章
        return await Post.find({ published: true })
          .sort({ createdAt: -1 })
          .limit(limit);
      } catch (error) {
        console.error('Recommendation error:', error);
        // 退回方案：返回熱門文章
        return await Post.find({ published: true })
          .sort({ views: -1 })
          .limit(limit);
      }
    },

    /**
     * 趨勢文章
     */
    trendingPosts: async (parent, { limit = 10 }, context) => {
      // 簡單實現：根據瀏覽量和最近的讚數
      return await Post.find({ published: true })
        .sort({ views: -1, likes: -1, createdAt: -1 })
        .limit(limit);
    },
  },

  Mutation: {
    /**
     * 生成文章摘要
     */
    generatePostSummary: async (parent, { postId }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      try {
        const summary = await aiService.generateSummary(post.content, 200);

        // 保存摘要到文章
        post.excerpt = summary;
        await post.save();

        return summary;
      } catch (error) {
        console.error('Summary generation error:', error);
        throw new GraphQLError('Failed to generate summary', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },

    /**
     * 生成 SEO 元數據
     */
    generatePostSEO: async (parent, { postId }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      try {
        const seoData = await aiService.generateSEOContent(post.title, post.content);

        return seoData;
      } catch (error) {
        console.error('SEO generation error:', error);
        throw new GraphQLError('Failed to generate SEO metadata', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },

    /**
     * 生成文章標籤
     */
    generatePostTags: async (parent, { postId }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      try {
        const tags = await aiService.generateTags(post.content, 8);

        // 保存標籤到文章
        post.tags = tags;
        await post.save();

        return tags;
      } catch (error) {
        console.error('Tag generation error:', error);
        throw new GraphQLError('Failed to generate tags', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },

    /**
     * 分析文章情感
     */
    analyzePostSentiment: async (parent, { postId }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      try {
        const sentiment = await aiService.analyzeSentiment(post.content);
        return sentiment;
      } catch (error) {
        console.error('Sentiment analysis error:', error);
        throw new GraphQLError('Failed to analyze sentiment', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },

    /**
     * 內容改進建議
     */
    suggestContentImprovements: async (parent, { postId }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      try {
        const suggestions = await aiService.suggestImprovements(post.content);

        // 解析建議並格式化
        const formattedSuggestions = [
          { type: 'structure', suggestion: suggestions, priority: 1 },
        ];

        return formattedSuggestions;
      } catch (error) {
        console.error('Improvement suggestion error:', error);
        throw new GraphQLError('Failed to generate suggestions', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },

    /**
     * 生成文章大綱
     */
    generateOutline: async (parent, { topic, keywords = [] }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const outline = await aiService.generateOutline(topic, keywords);
        return outline;
      } catch (error) {
        console.error('Outline generation error:', error);
        throw new GraphQLError('Failed to generate outline', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },

    /**
     * 擴展內容
     */
    expandContent: async (parent, { outline, section }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const expandedContent = await aiService.expandContent(outline, section);
        return expandedContent;
      } catch (error) {
        console.error('Content expansion error:', error);
        throw new GraphQLError('Failed to expand content', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },

    /**
     * 校對內容
     */
    proofreadContent: async (parent, { content }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const proofreadContent = await aiService.proofread(content);
        return proofreadContent;
      } catch (error) {
        console.error('Proofreading error:', error);
        throw new GraphQLError('Failed to proofread content', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },

    /**
     * 翻譯內容
     */
    translateContent: async (parent, { content, targetLanguage }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const translatedContent = await aiService.translate(content, targetLanguage);
        return translatedContent;
      } catch (error) {
        console.error('Translation error:', error);
        throw new GraphQLError('Failed to translate content', {
          extensions: { code: 'AI_SERVICE_ERROR' },
        });
      }
    },
  },

  // Field Resolvers
  Post: {
    /**
     * AI 摘要（延遲生成）
     */
    aiSummary: async (parent, args, context) => {
      if (parent.excerpt) {
        return parent.excerpt;
      }

      // 如果沒有現成的摘要，可以選擇：
      // 1. 即時生成（可能較慢）
      // 2. 返回 null 並提示用戶手動生成
      // 這裡我們返回 null
      return null;
    },

    /**
     * AI SEO（延遲生成）
     */
    aiSEO: async (parent, args, context) => {
      // 這裡可以從緩存或資料庫中獲取之前生成的 SEO 數據
      return null;
    },

    /**
     * AI 情感分析（延遲生成）
     */
    aiSentiment: async (parent, args, context) => {
      // 這裡可以從緩存中獲取
      return null;
    },

    /**
     * AI 推薦（基於當前文章）
     */
    aiRecommendations: async (parent, args, context) => {
      try {
        const recommendations = await aiService.generateRecommendations(parent, [], 3);

        // 如果返回的是 ID 列表
        if (recommendations.length > 0 && typeof recommendations[0] === 'string') {
          return await Post.find({ _id: { $in: recommendations } });
        }

        // 退回方案：返回相同作者的其他文章
        return await Post.find({
          author: parent.author,
          _id: { $ne: parent.id },
          published: true,
        }).limit(3);
      } catch (error) {
        console.error('Recommendation error:', error);
        return [];
      }
    },
  },
};

module.exports = aiResolvers;
