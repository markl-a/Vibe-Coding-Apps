# Social Media GraphQL API - AI Features

## 🤖 AI 增強功能

這個社交媒體 GraphQL API 可以使用共享的 AI 服務來提供智能功能。

### 可用的 AI 功能

#### 1. 內容審核和過濾
```graphql
mutation {
  createPost(content: "post content") {
    id
    content
    aiModeration {
      isSafe
      toxicityScore
      categories
      suggestedAction  # APPROVE, REVIEW, REJECT
    }
  }
}
```

#### 2. 智能內容推薦
```graphql
query {
  recommendedPosts(userId: "id", limit: 10) {
    id
    content
    author { name }
    relevanceScore
  }
}
```

#### 3. 貼文情感分析
```graphql
query {
  post(id: "id") {
    content
    aiSentiment {
      overall      # POSITIVE, NEGATIVE, NEUTRAL
      score
      emotions {
        joy
        trust
        surprise
        sadness
        anger
      }
    }
  }
}
```

#### 4. 智能 Hashtag 生成
```graphql
mutation {
  generateHashtags(postId: "id") {
    hashtags  # 返回: ["#graphql", "#api", "#tech"]
    relevanceScore
  }
}
```

#### 5. 自動文字摘要（長貼文）
```graphql
query {
  post(id: "id") {
    content
    aiSummary  # 自動生成的摘要
  }
}
```

#### 6. 智能回覆建議
```graphql
query {
  suggestReplies(postId: "id") {
    replies
    tone  # FRIENDLY, PROFESSIONAL, CASUAL
  }
}
```

#### 7. 趨勢話題分析
```graphql
query {
  trendingTopics {
    topic
    postCount
    sentiment
    growthRate
  }
}
```

#### 8. 好友推薦
```graphql
query {
  recommendFriends(userId: "id", limit: 10) {
    user {
      id
      name
    }
    commonInterests
    mutualFriends
    similarityScore
  }
}
```

#### 9. 內容翻譯
```graphql
mutation {
  translatePost(postId: "id", targetLanguage: "zh-TW") {
    translatedContent
    sourceLanguage
    confidence
  }
}
```

#### 10. 圖片內容識別（進階）
```graphql
mutation {
  analyzeImage(postId: "id", imageUrl: "url") {
    labels
    objects
    text
    explicitContent
    suggestedCaption
  }
}
```

## 🚀 如何啟用

### 1. 複製共享工具

```bash
# 從專案根目錄
cp -r blog-graphql-api/src/services/aiService.js social-media-graphql/src/services/
cp -r blog-graphql-api/src/utils/customScalars.js social-media-graphql/src/utils/
```

### 2. 配置環境變數

```env
# AI Service
AI_MOCK_MODE=true
AI_PROVIDER=openai
AI_API_KEY=your-key-here
AI_MODEL=gpt-3.5-turbo

# Content Moderation
ENABLE_AI_MODERATION=true
TOXICITY_THRESHOLD=0.7
```

### 3. 在 Schema 中添加

```graphql
type Post {
  id: ID!
  content: String!
  author: User!

  # AI 功能
  aiSentiment: SentimentAnalysis
  aiSummary: String
  aiModeration: ModerationResult
  aiHashtags: [String!]
}

type SentimentAnalysis {
  overall: SentimentType!
  score: Float!
  emotions: EmotionScores!
}

type ModerationResult {
  isSafe: Boolean!
  toxicityScore: Float!
  categories: [String!]!
  suggestedAction: ModerationAction!
}

enum ModerationAction {
  APPROVE
  REVIEW
  REJECT
}
```

### 4. 實現 Resolvers

```javascript
const aiService = require('./services/aiService');

const resolvers = {
  Post: {
    // 情感分析
    aiSentiment: async (parent) => {
      return await aiService.analyzeSentiment(parent.content);
    },

    // 自動摘要（長貼文）
    aiSummary: async (parent) => {
      if (parent.content.length > 500) {
        return await aiService.generateSummary(parent.content, 100);
      }
      return null;
    },

    // Hashtags
    aiHashtags: async (parent) => {
      return await aiService.generateTags(parent.content, 5);
    },
  },

  Mutation: {
    // 創建貼文時自動審核
    createPost: async (parent, { content }, context) => {
      // 創建貼文
      const post = await Post.create({
        content,
        author: context.userId,
      });

      // AI 審核
      if (process.env.ENABLE_AI_MODERATION === 'true') {
        const moderation = await moderateContent(content);

        if (moderation.suggestedAction === 'REJECT') {
          await Post.findByIdAndDelete(post.id);
          throw new GraphQLError('Content violates community guidelines');
        }

        if (moderation.suggestedAction === 'REVIEW') {
          post.status = 'PENDING_REVIEW';
          await post.save();
        }
      }

      return post;
    },
  },

  Query: {
    // 推薦貼文
    recommendedPosts: async (parent, { userId, limit }, context) => {
      const user = await User.findById(userId);

      // 獲取用戶興趣（基於互動歷史）
      const interactions = await Interaction.find({ userId })
        .populate('post')
        .sort({ createdAt: -1 })
        .limit(50);

      // 提取興趣標籤
      const interests = interactions
        .flatMap(i => i.post.tags)
        .filter(Boolean);

      // 基於興趣推薦
      return await Post.find({
        tags: { $in: interests },
        author: { $ne: userId },
        status: 'PUBLISHED',
      })
        .sort({ createdAt: -1 })
        .limit(limit);
    },
  },
};
```

## 📝 內容審核實現

```javascript
async function moderateContent(content) {
  // 使用 AI 檢測有害內容
  const prompt = `
    Analyze this social media post for toxic content, hate speech,
    harassment, or other policy violations:

    "${content}"

    Rate toxicity from 0 to 1 and categorize any violations.
  `;

  const result = await aiService.aiClient.callAI(prompt, {
    type: 'moderation',
  });

  // 解析結果
  const toxicityScore = result.score || 0;

  return {
    isSafe: toxicityScore < 0.7,
    toxicityScore,
    categories: result.categories || [],
    suggestedAction:
      toxicityScore >= 0.9
        ? 'REJECT'
        : toxicityScore >= 0.7
        ? 'REVIEW'
        : 'APPROVE',
  };
}
```

## 🎯 推薦算法

```javascript
async function generatePersonalizedFeed(userId) {
  // 1. 獲取用戶檔案
  const user = await User.findById(userId);

  // 2. 獲取用戶互動歷史
  const interactions = await getRecentInteractions(userId, 100);

  // 3. 計算用戶興趣向量
  const interests = calculateInterestVector(interactions);

  // 4. 獲取候選貼文
  const candidates = await Post.find({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    status: 'PUBLISHED',
  }).limit(1000);

  // 5. 為每個貼文計算相關性分數
  const scoredPosts = candidates.map(post => ({
    post,
    score: calculateRelevanceScore(post, interests, user),
  }));

  // 6. 排序並返回
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(item => item.post);
}

function calculateRelevanceScore(post, userInterests, user) {
  let score = 0;

  // 內容相關性
  const contentScore = cosineSimilarity(
    post.contentVector,
    userInterests.contentVector
  );
  score += contentScore * 0.4;

  // 作者權重
  if (user.following.includes(post.author)) {
    score += 0.3;
  }

  // 新鮮度
  const ageHours = (Date.now() - post.createdAt) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 1 - ageHours / 48);
  score += freshnessScore * 0.2;

  // 熱度
  const engagementScore = Math.log(post.likes + post.comments + 1) / 10;
  score += engagementScore * 0.1;

  return score;
}
```

## 🔮 進階功能

### 圖片內容分析

```javascript
async function analyzePostImage(imageUrl) {
  // 使用 Vision AI API
  const analysis = await visionAPI.analyze(imageUrl);

  return {
    labels: analysis.labels.map(l => l.description),
    objects: analysis.objects,
    text: analysis.text,
    explicitContent: analysis.safeSearch,
    suggestedCaption: await generateCaptionFromImage(analysis),
  };
}
```

### 自動回覆建議

```javascript
async function generateReplySuggestions(postContent, tone = 'FRIENDLY') {
  const prompt = `
    Generate 3 appropriate replies to this social media post.
    Tone: ${tone}

    Post: "${postContent}"

    Provide diverse replies (supportive, questioning, enthusiastic).
  `;

  const suggestions = await aiService.aiClient.callAI(prompt);

  return suggestions.split('\n').filter(s => s.trim());
}
```

---

**讓 AI 打造更智能、更安全的社交平台！** 🚀
