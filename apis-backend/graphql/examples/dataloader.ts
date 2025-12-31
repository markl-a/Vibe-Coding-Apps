/**
 * DataLoader Examples for GraphQL
 *
 * Demonstrates:
 * - DataLoader setup to solve N+1 query problems
 * - Batch loading strategies
 * - Caching strategies
 * - Complex relationship loading
 * - Custom cache implementations
 * - Performance optimization patterns
 */

import DataLoader from 'dataloader';
import { User, Post, Comment, Category } from './schema-design';

// ============================================================================
// DATABASE MODELS (Mock interfaces)
// ============================================================================

interface UserModel {
  findByIds(ids: string[]): Promise<User[]>;
  findOne(filter: any): Promise<User | null>;
}

interface PostModel {
  findByIds(ids: string[]): Promise<Post[]>;
  findByAuthorIds(authorIds: string[]): Promise<Post[]>;
  findByCategoryIds(categoryIds: string[]): Promise<Post[]>;
}

interface CommentModel {
  findByIds(ids: string[]): Promise<Comment[]>;
  findByPostIds(postIds: string[]): Promise<Comment[]>;
  findByAuthorIds(authorIds: string[]): Promise<Comment[]>;
}

interface CategoryModel {
  findByIds(ids: string[]): Promise<Category[]>;
}

// ============================================================================
// BASIC DATALOADERS
// ============================================================================

/**
 * User DataLoader
 * Batches and caches user lookups by ID
 */
export function createUserLoader(userModel: UserModel): DataLoader<string, User> {
  return new DataLoader<string, User>(
    async (userIds: readonly string[]) => {
      console.log(`📦 Batching ${userIds.length} user queries`);

      // Fetch all users in a single query
      const users = await userModel.findByIds([...userIds]);

      // Create a map for O(1) lookup
      const userMap = new Map<string, User>();
      users.forEach(user => {
        userMap.set(user.id, user);
      });

      // Return users in the same order as requested
      // Return null for missing users
      return userIds.map(id => userMap.get(id) || null);
    },
    {
      // Cache results for the duration of the request
      cache: true,
      // Batch window: collect requests for 10ms before executing
      batchScheduleFn: (callback) => setTimeout(callback, 10),
      // Maximum batch size
      maxBatchSize: 100
    }
  );
}

/**
 * Post DataLoader
 * Batches and caches post lookups by ID
 */
export function createPostLoader(postModel: PostModel): DataLoader<string, Post> {
  return new DataLoader<string, Post>(
    async (postIds: readonly string[]) => {
      console.log(`📦 Batching ${postIds.length} post queries`);

      const posts = await postModel.findByIds([...postIds]);

      const postMap = new Map<string, Post>();
      posts.forEach(post => {
        postMap.set(post.id, post);
      });

      return postIds.map(id => postMap.get(id) || null);
    },
    { cache: true }
  );
}

/**
 * Comment DataLoader
 * Batches comment lookups by ID
 */
export function createCommentLoader(
  commentModel: CommentModel
): DataLoader<string, Comment> {
  return new DataLoader<string, Comment>(
    async (commentIds: readonly string[]) => {
      console.log(`📦 Batching ${commentIds.length} comment queries`);

      const comments = await commentModel.findByIds([...commentIds]);

      const commentMap = new Map<string, Comment>();
      comments.forEach(comment => {
        commentMap.set(comment.id, comment);
      });

      return commentIds.map(id => commentMap.get(id) || null);
    },
    { cache: true }
  );
}

// ============================================================================
// ONE-TO-MANY RELATIONSHIP DATALOADERS
// ============================================================================

/**
 * Posts by Author DataLoader
 * Loads all posts for given author IDs
 */
export function createPostsByAuthorLoader(
  postModel: PostModel
): DataLoader<string, Post[]> {
  return new DataLoader<string, Post[]>(
    async (authorIds: readonly string[]) => {
      console.log(`📦 Batching posts for ${authorIds.length} authors`);

      // Fetch all posts for all authors in one query
      const posts = await postModel.findByAuthorIds([...authorIds]);

      // Group posts by author ID
      const postsByAuthor = new Map<string, Post[]>();
      authorIds.forEach(id => {
        postsByAuthor.set(id, []);
      });

      posts.forEach(post => {
        const authorPosts = postsByAuthor.get(post.authorId);
        if (authorPosts) {
          authorPosts.push(post);
        }
      });

      // Return arrays in the same order as requested
      return authorIds.map(id => postsByAuthor.get(id) || []);
    },
    {
      cache: true,
      // Cache key function for complex keys
      cacheKeyFn: (key: string) => `posts-by-author:${key}`
    }
  );
}

/**
 * Comments by Post DataLoader
 * Loads all comments for given post IDs
 */
export function createCommentsByPostLoader(
  commentModel: CommentModel
): DataLoader<string, Comment[]> {
  return new DataLoader<string, Comment[]>(
    async (postIds: readonly string[]) => {
      console.log(`📦 Batching comments for ${postIds.length} posts`);

      const comments = await commentModel.findByPostIds([...postIds]);

      const commentsByPost = new Map<string, Comment[]>();
      postIds.forEach(id => {
        commentsByPost.set(id, []);
      });

      comments.forEach(comment => {
        const postComments = commentsByPost.get(comment.postId);
        if (postComments) {
          postComments.push(comment);
        }
      });

      return postIds.map(id => commentsByPost.get(id) || []);
    },
    { cache: true }
  );
}

/**
 * Comments by Author DataLoader
 */
export function createCommentsByAuthorLoader(
  commentModel: CommentModel
): DataLoader<string, Comment[]> {
  return new DataLoader<string, Comment[]>(
    async (authorIds: readonly string[]) => {
      console.log(`📦 Batching comments for ${authorIds.length} authors`);

      const comments = await commentModel.findByAuthorIds([...authorIds]);

      const commentsByAuthor = new Map<string, Comment[]>();
      authorIds.forEach(id => {
        commentsByAuthor.set(id, []);
      });

      comments.forEach(comment => {
        const authorComments = commentsByAuthor.get(comment.authorId);
        if (authorComments) {
          authorComments.push(comment);
        }
      });

      return authorIds.map(id => commentsByAuthor.get(id) || []);
    },
    { cache: true }
  );
}

/**
 * Posts by Category DataLoader
 */
export function createPostsByCategoryLoader(
  postModel: PostModel
): DataLoader<string, Post[]> {
  return new DataLoader<string, Post[]>(
    async (categoryIds: readonly string[]) => {
      console.log(`📦 Batching posts for ${categoryIds.length} categories`);

      const posts = await postModel.findByCategoryIds([...categoryIds]);

      const postsByCategory = new Map<string, Post[]>();
      categoryIds.forEach(id => {
        postsByCategory.set(id, []);
      });

      posts.forEach(post => {
        if (post.category?.id) {
          const categoryPosts = postsByCategory.get(post.category.id);
          if (categoryPosts) {
            categoryPosts.push(post);
          }
        }
      });

      return categoryIds.map(id => postsByCategory.get(id) || []);
    },
    { cache: true }
  );
}

// ============================================================================
// ADVANCED CACHING STRATEGIES
// ============================================================================

/**
 * Custom Cache Implementation
 * Using Redis or in-memory cache with TTL
 */
class CustomCache<K, V> {
  private cache = new Map<K, { value: V; expiresAt: number }>();
  private ttl: number;

  constructor(ttlMs: number = 60000) {
    this.ttl = ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    });
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * User Loader with Custom Cache
 */
export function createUserLoaderWithTTL(
  userModel: UserModel,
  ttlMs: number = 60000
): DataLoader<string, User> {
  const cache = new CustomCache<string, Promise<User>>(ttlMs);

  return new DataLoader<string, User>(
    async (userIds: readonly string[]) => {
      const users = await userModel.findByIds([...userIds]);

      const userMap = new Map<string, User>();
      users.forEach(user => {
        userMap.set(user.id, user);
      });

      return userIds.map(id => userMap.get(id) || null);
    },
    {
      cacheMap: cache as any
    }
  );
}

// ============================================================================
// COMPOSITE KEY DATALOADERS
// ============================================================================

/**
 * DataLoader with composite keys
 * Example: Load posts filtered by author AND status
 */
interface PostsByAuthorAndStatusKey {
  authorId: string;
  status: string;
}

export function createPostsByAuthorAndStatusLoader(
  postModel: PostModel
): DataLoader<PostsByAuthorAndStatusKey, Post[]> {
  return new DataLoader<PostsByAuthorAndStatusKey, Post[]>(
    async (keys: readonly PostsByAuthorAndStatusKey[]) => {
      console.log(`📦 Batching posts for ${keys.length} author+status combinations`);

      // Collect unique author IDs
      const authorIds = [...new Set(keys.map(k => k.authorId))];

      // Fetch all posts for these authors
      const allPosts = await postModel.findByAuthorIds(authorIds);

      // Group and filter by both author and status
      return keys.map(key => {
        return allPosts.filter(
          post => post.authorId === key.authorId && post.status === key.status
        );
      });
    },
    {
      cacheKeyFn: (key: PostsByAuthorAndStatusKey) =>
        `${key.authorId}:${key.status}`
    }
  );
}

// ============================================================================
// DATALOADER FACTORY
// ============================================================================

export interface DataLoaders {
  userLoader: DataLoader<string, User>;
  postLoader: DataLoader<string, Post>;
  commentLoader: DataLoader<string, Comment>;
  categoryLoader: DataLoader<string, Category>;
  postsByAuthorLoader: DataLoader<string, Post[]>;
  commentsByPostLoader: DataLoader<string, Comment[]>;
  commentsByAuthorLoader: DataLoader<string, Comment[]>;
  postsByCategoryLoader: DataLoader<string, Post[]>;
  postsByAuthorAndStatusLoader: DataLoader<PostsByAuthorAndStatusKey, Post[]>;
}

/**
 * Create all DataLoaders for a request
 * Should be called once per GraphQL request to ensure proper caching
 */
export function createDataLoaders(models: {
  userModel: UserModel;
  postModel: PostModel;
  commentModel: CommentModel;
  categoryModel: CategoryModel;
}): DataLoaders {
  return {
    userLoader: createUserLoader(models.userModel),
    postLoader: createPostLoader(models.postModel),
    commentLoader: createCommentLoader(models.commentModel),
    categoryLoader: new DataLoader(async (ids: readonly string[]) => {
      const categories = await models.categoryModel.findByIds([...ids]);
      const categoryMap = new Map(categories.map(c => [c.id, c]));
      return ids.map(id => categoryMap.get(id) || null);
    }),
    postsByAuthorLoader: createPostsByAuthorLoader(models.postModel),
    commentsByPostLoader: createCommentsByPostLoader(models.commentModel),
    commentsByAuthorLoader: createCommentsByAuthorLoader(models.commentModel),
    postsByCategoryLoader: createPostsByCategoryLoader(models.postModel),
    postsByAuthorAndStatusLoader: createPostsByAuthorAndStatusLoader(models.postModel)
  };
}

// ============================================================================
// NESTJS CONTEXT SETUP
// ============================================================================

/**
 * Example NestJS GraphQL Module configuration
 */
export const graphqlModuleOptions = {
  context: ({ req }: any) => {
    // Create fresh DataLoaders for each request
    const loaders = createDataLoaders({
      userModel: req.app.get('UserModel'),
      postModel: req.app.get('PostModel'),
      commentModel: req.app.get('CommentModel'),
      categoryModel: req.app.get('CategoryModel')
    });

    return {
      req,
      loaders
    };
  }
};

// ============================================================================
// USAGE EXAMPLES IN RESOLVERS
// ============================================================================

/**
 * Example: Using DataLoaders in Field Resolvers
 */
export class ExampleResolver {
  /**
   * Without DataLoader (N+1 problem)
   * If fetching 10 posts, this will make 10 separate database queries
   */
  async getAuthorWithoutDataLoader(post: Post, userModel: UserModel): Promise<User> {
    // ❌ BAD: One query per post
    return await userModel.findOne({ id: post.authorId });
  }

  /**
   * With DataLoader (Optimized)
   * If fetching 10 posts, this will make just 1 batched database query
   */
  async getAuthorWithDataLoader(
    post: Post,
    loaders: DataLoaders
  ): Promise<User> {
    // ✅ GOOD: Batched and cached
    return await loaders.userLoader.load(post.authorId);
  }

  /**
   * Example: Loading posts with comments (nested relationships)
   */
  async getPostsWithComments(
    authorId: string,
    loaders: DataLoaders
  ): Promise<Post[]> {
    // Load all posts by author (1 query)
    const posts = await loaders.postsByAuthorLoader.load(authorId);

    // Load comments for all posts (1 query, batched)
    await Promise.all(
      posts.map(post => loaders.commentsByPostLoader.load(post.id))
    );

    // Comments are now cached and available
    return posts;
  }

  /**
   * Example: Prime the cache manually
   */
  async primeUserCache(users: User[], loaders: DataLoaders): Promise<void> {
    users.forEach(user => {
      loaders.userLoader.prime(user.id, user);
    });
  }

  /**
   * Example: Clear specific cache entries
   */
  async clearUserCache(userId: string, loaders: DataLoaders): Promise<void> {
    loaders.userLoader.clear(userId);
  }

  /**
   * Example: Clear all cache
   */
  async clearAllCaches(loaders: DataLoaders): Promise<void> {
    loaders.userLoader.clearAll();
    loaders.postLoader.clearAll();
    loaders.commentLoader.clearAll();
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * DataLoader with performance monitoring
 */
export function createMonitoredUserLoader(
  userModel: UserModel
): DataLoader<string, User> {
  return new DataLoader<string, User>(
    async (userIds: readonly string[]) => {
      const startTime = Date.now();

      console.log(`📊 Loading ${userIds.length} users...`);

      const users = await userModel.findByIds([...userIds]);

      const duration = Date.now() - startTime;
      console.log(`✅ Loaded ${users.length} users in ${duration}ms`);

      // Log cache hit/miss ratio
      const hitRatio = (users.length / userIds.length) * 100;
      console.log(`📈 Cache hit ratio: ${hitRatio.toFixed(2)}%`);

      const userMap = new Map<string, User>();
      users.forEach(user => {
        userMap.set(user.id, user);
      });

      return userIds.map(id => userMap.get(id) || null);
    },
    { cache: true }
  );
}

/**
 * Batch statistics tracking
 */
export class DataLoaderStats {
  private stats = {
    totalBatches: 0,
    totalItems: 0,
    averageBatchSize: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  recordBatch(batchSize: number): void {
    this.stats.totalBatches++;
    this.stats.totalItems += batchSize;
    this.stats.averageBatchSize =
      this.stats.totalItems / this.stats.totalBatches;
  }

  recordCacheHit(): void {
    this.stats.cacheHits++;
  }

  recordCacheMiss(): void {
    this.stats.cacheMisses++;
  }

  getStats() {
    return {
      ...this.stats,
      cacheHitRatio:
        this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)
    };
  }

  reset(): void {
    this.stats = {
      totalBatches: 0,
      totalItems: 0,
      averageBatchSize: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}
