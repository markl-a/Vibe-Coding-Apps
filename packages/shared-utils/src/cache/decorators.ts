/**
 * Cache Decorators
 * Provides method-level caching decorators
 */

import { CacheManager, getDefaultCacheManager } from './CacheManager';

export interface CacheableOptions<T = unknown> {
  /** Time to live in seconds */
  ttl?: number;
  /** Custom cache key generator function */
  keyGenerator?: (...args: unknown[]) => string;
  /** Cache manager instance (uses default if not provided) */
  cacheManager?: CacheManager;
  /** Condition to determine if result should be cached */
  condition?: (result: T) => boolean;
  /** Prefix for cache key */
  keyPrefix?: string;
}

export interface CacheEvictOptions {
  /** Cache manager instance (uses default if not provided) */
  cacheManager?: CacheManager;
  /** Specific keys to evict */
  keys?: string[];
  /** Whether to clear all cache */
  allEntries?: boolean;
  /** Custom key generator for eviction */
  keyGenerator?: (...args: unknown[]) => string | string[];
  /** Prefix for cache key */
  keyPrefix?: string;
}

export interface CachePutOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Custom cache key generator function */
  keyGenerator?: (...args: unknown[]) => string;
  /** Cache manager instance (uses default if not provided) */
  cacheManager?: CacheManager;
  /** Prefix for cache key */
  keyPrefix?: string;
}

/**
 * Generate a default cache key from method name and arguments
 */
function generateDefaultKey(
  className: string,
  methodName: string,
  args: unknown[],
  prefix?: string
): string {
  const argsKey = args.length > 0 ? `:${JSON.stringify(args)}` : '';
  const prefixPart = prefix ? `${prefix}:` : '';
  return `${prefixPart}${className}:${methodName}${argsKey}`;
}

/**
 * @Cacheable Decorator
 * Caches the result of a method call
 *
 * @example
 * class UserService {
 *   @Cacheable({ ttl: 3600 })
 *   async getUser(id: string) {
 *     return await db.users.findById(id);
 *   }
 * }
 */
export function Cacheable(options: CacheableOptions = {}) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: unknown[]) {
      const cacheManager = options.cacheManager || getDefaultCacheManager();

      // Generate cache key
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(...args)
        : generateDefaultKey(className, propertyKey, args, options.keyPrefix);

      // Try to get from cache
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Check condition before caching
      if (options.condition && !options.condition(result)) {
        return result;
      }

      // Store in cache
      await cacheManager.set(cacheKey, result, options.ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * @CacheEvict Decorator
 * Evicts entries from cache when method is called
 *
 * @example
 * class UserService {
 *   @CacheEvict({ allEntries: true })
 *   async updateUser(id: string, data: any) {
 *     return await db.users.update(id, data);
 *   }
 * }
 */
export function CacheEvict(options: CacheEvictOptions = {}) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: unknown[]) {
      const cacheManager = options.cacheManager || getDefaultCacheManager();

      // Execute original method first
      const result = await originalMethod.apply(this, args);

      // Evict cache entries
      if (options.allEntries) {
        await cacheManager.clear();
      } else if (options.keys && options.keys.length > 0) {
        for (const key of options.keys) {
          await cacheManager.delete(key);
        }
      } else if (options.keyGenerator) {
        const keysToEvict = options.keyGenerator(...args);
        if (Array.isArray(keysToEvict)) {
          for (const key of keysToEvict) {
            await cacheManager.delete(key);
          }
        } else {
          await cacheManager.delete(keysToEvict);
        }
      } else {
        // Default: evict key based on method and args
        const cacheKey = generateDefaultKey(className, propertyKey, args, options.keyPrefix);
        await cacheManager.delete(cacheKey);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * @CachePut Decorator
 * Always executes the method and updates the cache with the result
 *
 * @example
 * class UserService {
 *   @CachePut({ ttl: 3600 })
 *   async refreshUser(id: string) {
 *     return await db.users.findById(id);
 *   }
 * }
 */
export function CachePut(options: CachePutOptions = {}) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: unknown[]) {
      const cacheManager = options.cacheManager || getDefaultCacheManager();

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Generate cache key
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(...args)
        : generateDefaultKey(className, propertyKey, args, options.keyPrefix);

      // Update cache
      await cacheManager.set(cacheKey, result, options.ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * @Memoize Decorator
 * Simple in-memory memoization for synchronous functions
 * Uses WeakMap for class instances to prevent memory leaks
 *
 * @example
 * class Calculator {
 *   @Memoize()
 *   fibonacci(n: number): number {
 *     if (n <= 1) return n;
 *     return this.fibonacci(n - 1) + this.fibonacci(n - 2);
 *   }
 * }
 */
export function Memoize() {
  const cache = new WeakMap<object, Map<string, unknown>>();

  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      // Get or create cache for this instance
      if (!cache.has(this)) {
        cache.set(this, new Map());
      }
      const instanceCache = cache.get(this)!;

      // Generate cache key
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;

      // Check cache
      if (instanceCache.has(cacheKey)) {
        return instanceCache.get(cacheKey);
      }

      // Execute and cache
      const result = originalMethod.apply(this, args);
      instanceCache.set(cacheKey, result);

      return result;
    };

    return descriptor;
  };
}

/**
 * Function wrapper for cacheable behavior
 * Useful when you can't use decorators
 *
 * @example
 * const cachedGetUser = withCache(
 *   async (id: string) => db.users.findById(id),
 *   { ttl: 3600, keyPrefix: 'user' }
 * );
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: CacheableOptions & { name?: string } = {}
): T {
  const cacheManager = options.cacheManager || getDefaultCacheManager();
  const functionName = options.name || fn.name || 'anonymous';

  return (async (...args: unknown[]) => {
    // Generate cache key
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(...args)
      : generateDefaultKey('Function', functionName, args, options.keyPrefix);

    // Try to get from cache
    const cached = await cacheManager.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Check condition before caching
    if (options.condition && !options.condition(result)) {
      return result;
    }

    // Store in cache
    await cacheManager.set(cacheKey, result, options.ttl);

    return result;
  }) as T;
}

/**
 * Create a cached version of an async function with automatic cache key generation
 *
 * @example
 * const getUser = cached(
 *   'user',
 *   async (id: string) => db.users.findById(id),
 *   3600
 * );
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  keyPrefix: string,
  fn: T,
  ttl?: number,
  cacheManager?: CacheManager
): T {
  const options: CacheableOptions & { name?: string } = { keyPrefix };
  if (ttl !== undefined) options.ttl = ttl;
  if (cacheManager !== undefined) options.cacheManager = cacheManager;
  if (fn.name) options.name = fn.name;
  return withCache(fn, options);
}

/**
 * Batch cache operations
 * Useful for caching multiple items at once
 */
export class BatchCache {
  constructor(private cacheManager: CacheManager = getDefaultCacheManager()) {}

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    await Promise.all(
      keys.map(async (key) => {
        const value = await this.cacheManager.get<T>(key);
        if (value !== null) {
          results.set(key, value);
        }
      })
    );

    return results;
  }

  /**
   * Set multiple values in cache
   */
  async mset(entries: Map<string, unknown>, ttl?: number): Promise<void> {
    await Promise.all(
      Array.from(entries.entries()).map(([key, value]) =>
        this.cacheManager.set(key, value, ttl)
      )
    );
  }

  /**
   * Delete multiple keys from cache
   */
  async mdel(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.cacheManager.delete(key)));
  }
}
