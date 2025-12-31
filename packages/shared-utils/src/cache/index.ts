/**
 * Cache Module
 * Comprehensive caching utilities with Redis support and in-memory fallback
 *
 * @module cache
 */

// Cache Manager
export {
  CacheManager,
  getDefaultCacheManager,
  setDefaultCacheManager,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
  type RedisClient,
} from './CacheManager';

// Decorators
export {
  Cacheable,
  CacheEvict,
  CachePut,
  Memoize,
  withCache,
  cached,
  BatchCache,
  type CacheableOptions,
  type CacheEvictOptions,
  type CachePutOptions,
} from './decorators';

// Strategies
export {
  TimeBasedInvalidation,
  EventBasedInvalidation,
  LRUStrategy,
  TagBasedInvalidation,
  DependencyBasedInvalidation,
  WriteThroughStrategy,
  WriteBehindStrategy,
  CacheAsideStrategy,
  RefreshAheadStrategy,
  type InvalidationStrategy,
} from './strategies';
