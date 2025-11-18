/**
 * AI 智能推薦模組
 * 基於用戶興趣和行為的內容推薦
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface Post {
  id: string;
  content: string;
  author: string;
  tags: string[];
  likes: number;
  timestamp: number;
  embedding?: number[];
}

export interface UserProfile {
  address: string;
  interests: string[];
  likedPosts: string[];
  followedUsers: string[];
  interactionHistory: {
    postId: string;
    type: 'like' | 'comment' | 'share';
    timestamp: number;
  }[];
}

/**
 * 生成文本嵌入向量
 */
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    return [];
  }
}

/**
 * 計算兩個向量的餘弦相似度
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 為貼文生成嵌入向量
 */
export async function generatePostEmbedding(post: Post): Promise<Post> {
  const text = `${post.content} ${post.tags.join(' ')}`;
  const embedding = await getEmbedding(text);

  return {
    ...post,
    embedding,
  };
}

/**
 * 基於內容相似度推薦貼文
 */
export async function recommendByContent(
  userProfile: UserProfile,
  allPosts: Post[],
  limit: number = 20
): Promise<Post[]> {
  try {
    // 獲取用戶興趣的嵌入向量
    const interestsText = userProfile.interests.join(' ');
    const userEmbedding = await getEmbedding(interestsText);

    // 計算每個貼文的相似度分數
    const scoredPosts = await Promise.all(
      allPosts.map(async (post) => {
        if (!post.embedding) {
          post = await generatePostEmbedding(post);
        }

        const similarity = cosineSimilarity(userEmbedding, post.embedding || []);

        // 綜合分數：相似度 + 熱度 + 時效性
        const hotnessScore = Math.log(post.likes + 1) * 0.1;
        const timeDecay = Math.exp(
          -(Date.now() - post.timestamp) / (7 * 24 * 60 * 60 * 1000)
        ); // 7天衰減

        const finalScore = similarity * 0.6 + hotnessScore * 0.2 + timeDecay * 0.2;

        return {
          post,
          score: finalScore,
        };
      })
    );

    // 排序並返回
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.post);
  } catch (error) {
    console.error('Recommendation error:', error);
    // 降級：返回熱門貼文
    return allPosts.sort((a, b) => b.likes - a.likes).slice(0, limit);
  }
}

/**
 * 基於協同過濾推薦
 * 找到相似用戶喜歡的內容
 */
export async function recommendByCollaborativeFiltering(
  userProfile: UserProfile,
  allUsers: UserProfile[],
  allPosts: Post[],
  limit: number = 20
): Promise<Post[]> {
  // 找到相似用戶
  const similarUsers = allUsers
    .filter((u) => u.address !== userProfile.address)
    .map((otherUser) => {
      // 計算用戶相似度（基於共同喜歡的貼文）
      const commonLikes = userProfile.likedPosts.filter((postId) =>
        otherUser.likedPosts.includes(postId)
      ).length;

      const similarity =
        commonLikes /
        Math.sqrt(userProfile.likedPosts.length * otherUser.likedPosts.length || 1);

      return {
        user: otherUser,
        similarity,
      };
    })
    .filter((item) => item.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10); // 取前10個相似用戶

  // 收集相似用戶喜歡但當前用戶未看過的貼文
  const recommendedPostIds = new Set<string>();
  similarUsers.forEach(({ user, similarity }) => {
    user.likedPosts.forEach((postId) => {
      if (!userProfile.likedPosts.includes(postId)) {
        recommendedPostIds.add(postId);
      }
    });
  });

  // 獲取貼文詳情並排序
  const recommendedPosts = allPosts
    .filter((post) => recommendedPostIds.has(post.id))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);

  return recommendedPosts;
}

/**
 * 混合推薦策略
 * 結合內容推薦和協同過濾
 */
export async function getRecommendations(
  userProfile: UserProfile,
  allUsers: UserProfile[],
  allPosts: Post[],
  limit: number = 20
): Promise<Post[]> {
  try {
    // 並行獲取兩種推薦
    const [contentBased, collaborative] = await Promise.all([
      recommendByContent(userProfile, allPosts, limit),
      recommendByCollaborativeFiltering(userProfile, allUsers, allPosts, limit),
    ]);

    // 合併去重
    const merged = [...contentBased];
    collaborative.forEach((post) => {
      if (!merged.find((p) => p.id === post.id)) {
        merged.push(post);
      }
    });

    return merged.slice(0, limit);
  } catch (error) {
    console.error('Hybrid recommendation error:', error);
    // 降級：返回最新貼文
    return allPosts.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
}

/**
 * 使用 GPT 生成個性化推薦理由
 */
export async function generateRecommendationReason(
  post: Post,
  userProfile: UserProfile
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            '你是一個社交網絡推薦助手。根據用戶興趣和貼文內容，生成簡短的推薦理由（不超過30字）。',
        },
        {
          role: 'user',
          content: `用戶興趣：${userProfile.interests.join(', ')}
貼文內容：${post.content}
貼文標籤：${post.tags.join(', ')}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0].message.content || '推薦給你的內容';
  } catch (error) {
    console.error('Generate reason error:', error);
    return '基於你的興趣推薦';
  }
}

/**
 * 熱門話題發現
 */
export async function discoverTrendingTopics(posts: Post[]): Promise<string[]> {
  // 統計標籤頻率
  const tagFrequency: Record<string, number> = {};

  posts.forEach((post) => {
    // 給最近的貼文更高的權重
    const timeWeight = Math.exp(-(Date.now() - post.timestamp) / (24 * 60 * 60 * 1000));

    post.tags.forEach((tag) => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + timeWeight;
    });
  });

  // 排序並返回前10個
  return Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);
}

/**
 * 智能通知：推薦用戶可能想關注的人
 */
export async function recommendUsersToFollow(
  userProfile: UserProfile,
  allUsers: UserProfile[]
): Promise<UserProfile[]> {
  const candidates = allUsers.filter(
    (u) =>
      u.address !== userProfile.address &&
      !userProfile.followedUsers.includes(u.address)
  );

  // 計算每個候選用戶的分數
  const scoredUsers = candidates.map((candidate) => {
    // 共同興趣
    const commonInterests = userProfile.interests.filter((interest) =>
      candidate.interests.includes(interest)
    ).length;

    // 共同關注的人
    const commonFollowing = userProfile.followedUsers.filter((followedUser) =>
      candidate.followedUsers.includes(followedUser)
    ).length;

    const score = commonInterests * 2 + commonFollowing;

    return {
      user: candidate,
      score,
    };
  });

  return scoredUsers
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.user);
}
