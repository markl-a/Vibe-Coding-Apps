/**
 * Cache Manager
 * Provides Redis caching with in-memory fallback
 */

export interface CacheConfig {
  /** Redis connection URL (e.g., redis://localhost:6379) */
  redisUrl?: string;
  /** Default TTL in seconds */
  defaultTTL?: number;
  /** Enable in-memory fallback when Redis is unavailable */
  enableMemoryFallback?: boolean;
  /** Maximum memory cache size (number of entries) */
  maxMemoryCacheSize?: number;
  /** Redis connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Key prefix for all cache entries */
  keyPrefix?: string;
  /** Enable debug logging */
  debug?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  isRedisConnected: boolean;
  memoryEntriesCount: number;
}

/**
 * Redis client interface (compatible with ioredis and node-redis)
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<string>;
  ping(): Promise<string>;
  quit(): Promise<string>;
  disconnect(): void;
}

export class CacheManager {
  private redis: RedisClient | null = null;
  private memoryCache: Map<string, CacheEntry<unknown>>;
  private config: Required<CacheConfig>;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    this.config = {
      redisUrl: config.redisUrl || '',
      defaultTTL: config.defaultTTL || 3600, // 1 hour
      enableMemoryFallback: config.enableMemoryFallback ?? true,
      maxMemoryCacheSize: config.maxMemoryCacheSize || 1000,
      connectionTimeout: config.connectionTimeout || 5000,
      keyPrefix: config.keyPrefix || 'cache:',
      debug: config.debug ?? false,
    };

    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      isRedisConnected: false,
      memoryEntriesCount: 0,
    };

    // Start memory cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Initialize Redis connection
   * This should be called separately to handle async initialization
   */
  async connect(): Promise<void> {
    if (!this.config.redisUrl) {
      this.log('No Redis URL provided, using memory cache only');
      return;
    }

    try {
      // Dynamic import to avoid hard dependency on Redis client
      // Users should install ioredis or node-redis separately
      const Redis = await this.loadRedisClient();

      this.redis = new Redis(this.config.redisUrl, {
        connectTimeout: this.config.connectionTimeout,
        lazyConnect: true,
      }) as unknown as RedisClient;

      await this.redis.ping();
      this.stats.isRedisConnected = true;
      this.log('Redis connected successfully');
    } catch (error) {
      this.stats.errors++;
      this.log(`Failed to connect to Redis: ${error}`, true);

      if (!this.config.enableMemoryFallback) {
        throw new Error(`Redis connection failed and memory fallback is disabled: ${error}`);
      }

      this.log('Falling back to memory cache');
      this.redis = null;
    }
  }

  /**
   * Load Redis client library dynamically
   */
  private async loadRedisClient(): Promise<any> {
    try {
      // Try ioredis first
      const { default: IORedis } = await import('ioredis');
      return IORedis;
    } catch {
      try {
        // Try node-redis
        const { createClient } = await import('redis');
        return createClient;
      } catch {
        throw new Error(
          'No Redis client library found. Please install ioredis or redis: npm install ioredis'
        );
      }
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.getPrefixedKey(key);

    try {
      // Try Redis first
      if (this.redis && this.stats.isRedisConnected) {
        const value = await this.redis.get(prefixedKey);

        if (value !== null) {
          this.stats.hits++;
          return JSON.parse(value) as T;
        }
      }

      // Fallback to memory cache
      if (this.config.enableMemoryFallback) {
        const entry = this.memoryCache.get(prefixedKey) as CacheEntry<T> | undefined;

        if (entry) {
          // Check if expired
          if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.memoryCache.delete(prefixedKey);
            this.stats.misses++;
            return null;
          }

          this.stats.hits++;
          return entry.value;
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      this.log(`Error getting key ${key}: ${error}`, true);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const prefixedKey = this.getPrefixedKey(key);
    const ttlSeconds = ttl ?? this.config.defaultTTL;

    try {
      const serialized = JSON.stringify(value);

      // Store in Redis
      if (this.redis && this.stats.isRedisConnected) {
        await this.redis.setex(prefixedKey, ttlSeconds, serialized);
      }

      // Store in memory cache as fallback
      if (this.config.enableMemoryFallback) {
        // Enforce max cache size
        if (this.memoryCache.size >= this.config.maxMemoryCacheSize) {
          // Remove oldest entry (first entry in Map)
          const firstKey = this.memoryCache.keys().next().value;
          if (firstKey) {
            this.memoryCache.delete(firstKey);
          }
        }

        const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
        this.memoryCache.set(prefixedKey, { value, expiresAt });
        this.stats.memoryEntriesCount = this.memoryCache.size;
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.log(`Error setting key ${key}: ${error}`, true);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const prefixedKey = this.getPrefixedKey(key);

    try {
      // Delete from Redis
      if (this.redis && this.stats.isRedisConnected) {
        await this.redis.del(prefixedKey);
      }

      // Delete from memory cache
      if (this.config.enableMemoryFallback) {
        this.memoryCache.delete(prefixedKey);
        this.stats.memoryEntriesCount = this.memoryCache.size;
      }

      this.stats.deletes++;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.log(`Error deleting key ${key}: ${error}`, true);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const prefixedKey = this.getPrefixedKey(key);

    try {
      // Check Redis
      if (this.redis && this.stats.isRedisConnected) {
        const exists = await this.redis.exists(prefixedKey);
        return exists > 0;
      }

      // Check memory cache
      if (this.config.enableMemoryFallback) {
        const entry = this.memoryCache.get(prefixedKey);
        if (entry) {
          // Check if expired
          if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.memoryCache.delete(prefixedKey);
            return false;
          }
          return true;
        }
      }

      return false;
    } catch (error) {
      this.stats.errors++;
      this.log(`Error checking key ${key}: ${error}`, true);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key in seconds
   */
  async ttl(key: string): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);

    try {
      // Check Redis
      if (this.redis && this.stats.isRedisConnected) {
        return await this.redis.ttl(prefixedKey);
      }

      // Check memory cache
      if (this.config.enableMemoryFallback) {
        const entry = this.memoryCache.get(prefixedKey);
        if (entry && entry.expiresAt) {
          const remaining = Math.floor((entry.expiresAt - Date.now()) / 1000);
          return remaining > 0 ? remaining : -2; // -2 means key doesn't exist
        }
      }

      return -2;
    } catch (error) {
      this.stats.errors++;
      this.log(`Error getting TTL for key ${key}: ${error}`, true);
      return -2;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      // Clear Redis
      if (this.redis && this.stats.isRedisConnected) {
        const keys = await this.redis.keys(`${this.config.keyPrefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Clear memory cache
      if (this.config.enableMemoryFallback) {
        this.memoryCache.clear();
        this.stats.memoryEntriesCount = 0;
      }

      this.log('Cache cleared');
    } catch (error) {
      this.stats.errors++;
      this.log(`Error clearing cache: ${error}`, true);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      isRedisConnected: this.stats.isRedisConnected,
      memoryEntriesCount: this.stats.memoryEntriesCount,
    };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      if (this.redis) {
        await this.redis.quit();
        this.redis = null;
        this.stats.isRedisConnected = false;
        this.log('Redis disconnected');
      }
    } catch (error) {
      this.log(`Error disconnecting from Redis: ${error}`, true);
    }
  }

  /**
   * Get prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Start cleanup interval for memory cache
   */
  private startCleanupInterval(): void {
    // Clean up expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemoryCache();
    }, 60000);
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    this.stats.memoryEntriesCount = this.memoryCache.size;

    if (cleaned > 0) {
      this.log(`Cleaned up ${cleaned} expired entries from memory cache`);
    }
  }

  /**
   * Log message
   */
  private log(message: string, isError = false): void {
    if (this.config.debug) {
      const prefix = '[CacheManager]';
      if (isError) {
        console.error(`${prefix} ${message}`);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }
}

/**
 * Create a singleton cache manager instance
 */
let defaultCacheManager: CacheManager | null = null;

export function getDefaultCacheManager(): CacheManager {
  if (!defaultCacheManager) {
    defaultCacheManager = new CacheManager();
  }
  return defaultCacheManager;
}

export function setDefaultCacheManager(manager: CacheManager): void {
  defaultCacheManager = manager;
}
