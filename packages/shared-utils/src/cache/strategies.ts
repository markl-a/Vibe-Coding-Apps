/**
 * Cache Invalidation Strategies
 * Provides various strategies for cache invalidation and management
 */

import { CacheManager, getDefaultCacheManager } from './CacheManager';

// Context types for different strategies
interface EventContext {
  event: string;
  data?: unknown;
}

interface TagContext {
  tags?: string[];
}

interface KeyContext {
  key?: string;
}

type InvalidationContext = EventContext | TagContext | KeyContext | undefined;

// Event handler type
type EventHandler = (data: unknown) => Promise<void>;

export interface InvalidationStrategy {
  /** Strategy name */
  name: string;
  /** Execute the strategy */
  execute(cacheManager: CacheManager, context?: InvalidationContext): Promise<void>;
}

/**
 * Time-based invalidation strategy
 * Invalidates cache entries based on time patterns
 */
export class TimeBasedInvalidation implements InvalidationStrategy {
  name = 'time-based';

  constructor(
    private config: {
      /** Interval in milliseconds */
      interval: number;
      /** Keys pattern to invalidate */
      keysPattern?: string[];
      /** Custom filter function */
      filter?: (key: string) => boolean;
    }
  ) {}

  async execute(cacheManager: CacheManager): Promise<void> {
    if (this.config.keysPattern) {
      for (const key of this.config.keysPattern) {
        await cacheManager.delete(key);
      }
    }
  }

  /**
   * Start automatic invalidation on interval
   */
  startAutoInvalidation(cacheManager: CacheManager = getDefaultCacheManager()): NodeJS.Timeout {
    return setInterval(() => {
      this.execute(cacheManager).catch((error) => {
        console.error(`Time-based invalidation error: ${error}`);
      });
    }, this.config.interval);
  }
}

/**
 * Event-based invalidation strategy
 * Invalidates cache based on specific events
 */
export class EventBasedInvalidation implements InvalidationStrategy {
  name = 'event-based';
  private listeners: Map<string, Set<EventHandler>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener
   */
  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Remove an event listener
   */
  off(event: string, handler: EventHandler): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(handler);
    }
  }

  /**
   * Emit an event
   */
  async emit(event: string, data: unknown): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      await Promise.all(Array.from(eventListeners).map((handler) => handler(data)));
    }
  }

  async execute(_cacheManager: CacheManager, context?: InvalidationContext): Promise<void> {
    // Implementation depends on context
    if (context && 'event' in context) {
      await this.emit(context.event, context.data);
    }
  }

  /**
   * Create a handler to invalidate specific keys
   */
  invalidateKeys(...keys: string[]): EventHandler {
    return async () => {
      const cacheManager = getDefaultCacheManager();
      await Promise.all(keys.map((key) => cacheManager.delete(key)));
    };
  }

  /**
   * Create a handler to invalidate keys matching a pattern
   */
  invalidatePattern(_pattern: RegExp): EventHandler {
    return async () => {
      const cacheManager = getDefaultCacheManager();
      // Note: This requires getting all keys, which may not be efficient for large caches
      // In production, consider using Redis SCAN command
      await cacheManager.clear();
    };
  }
}

/**
 * LRU (Least Recently Used) strategy
 * Tracks access patterns and evicts least recently used items
 */
export class LRUStrategy implements InvalidationStrategy {
  name = 'lru';
  private accessLog: Map<string, number>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.accessLog = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Record access to a key
   */
  recordAccess(key: string): void {
    this.accessLog.set(key, Date.now());
  }

  /**
   * Get least recently used keys
   */
  getLRUKeys(count: number): string[] {
    const sorted = Array.from(this.accessLog.entries()).sort((a, b) => a[1] - b[1]);
    return sorted.slice(0, count).map(([key]) => key);
  }

  async execute(cacheManager: CacheManager): Promise<void> {
    if (this.accessLog.size > this.maxSize) {
      const keysToEvict = this.getLRUKeys(this.accessLog.size - this.maxSize);
      await Promise.all(keysToEvict.map((key) => cacheManager.delete(key)));
      keysToEvict.forEach((key) => this.accessLog.delete(key));
    }
  }
}

/**
 * Tag-based invalidation strategy
 * Groups cache entries by tags for bulk invalidation
 */
export class TagBasedInvalidation implements InvalidationStrategy {
  name = 'tag-based';
  private tagIndex: Map<string, Set<string>>;
  private keyTags: Map<string, Set<string>>;

  constructor() {
    this.tagIndex = new Map();
    this.keyTags = new Map();
  }

  /**
   * Tag a cache key
   */
  tag(key: string, ...tags: string[]): void {
    // Add key to tag index
    tags.forEach((tag) => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    // Track tags for key
    if (!this.keyTags.has(key)) {
      this.keyTags.set(key, new Set());
    }
    tags.forEach((tag) => this.keyTags.get(key)!.add(tag));
  }

  /**
   * Get all keys associated with a tag
   */
  getKeysByTag(tag: string): string[] {
    return Array.from(this.tagIndex.get(tag) || []);
  }

  /**
   * Get all tags for a key
   */
  getTagsForKey(key: string): string[] {
    return Array.from(this.keyTags.get(key) || []);
  }

  /**
   * Invalidate all keys with specific tags
   */
  async invalidateByTag(
    cacheManager: CacheManager,
    ...tags: string[]
  ): Promise<void> {
    const keysToInvalidate = new Set<string>();

    tags.forEach((tag) => {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.forEach((key) => keysToInvalidate.add(key));
      }
    });

    await Promise.all(Array.from(keysToInvalidate).map((key) => cacheManager.delete(key)));

    // Clean up tag index
    tags.forEach((tag) => {
      this.tagIndex.delete(tag);
    });

    // Clean up key tags
    keysToInvalidate.forEach((key) => {
      this.keyTags.delete(key);
    });
  }

  async execute(cacheManager: CacheManager, context?: { tags?: string[] }): Promise<void> {
    if (context?.tags) {
      await this.invalidateByTag(cacheManager, ...context.tags);
    }
  }
}

/**
 * Dependency-based invalidation strategy
 * Invalidates cache based on dependencies between keys
 */
export class DependencyBasedInvalidation implements InvalidationStrategy {
  name = 'dependency-based';
  private dependencies: Map<string, Set<string>>;

  constructor() {
    this.dependencies = new Map();
  }

  /**
   * Define a dependency: when parentKey changes, childKeys should be invalidated
   */
  addDependency(parentKey: string, ...childKeys: string[]): void {
    if (!this.dependencies.has(parentKey)) {
      this.dependencies.set(parentKey, new Set());
    }
    childKeys.forEach((childKey) => this.dependencies.get(parentKey)!.add(childKey));
  }

  /**
   * Remove a dependency
   */
  removeDependency(parentKey: string, childKey: string): void {
    const deps = this.dependencies.get(parentKey);
    if (deps) {
      deps.delete(childKey);
    }
  }

  /**
   * Get all dependent keys
   */
  getDependentKeys(parentKey: string): string[] {
    return Array.from(this.dependencies.get(parentKey) || []);
  }

  /**
   * Invalidate a key and all its dependents
   */
  async invalidateWithDependents(
    cacheManager: CacheManager,
    parentKey: string
  ): Promise<void> {
    // Invalidate parent
    await cacheManager.delete(parentKey);

    // Invalidate dependents
    const dependents = this.getDependentKeys(parentKey);
    await Promise.all(dependents.map((key) => cacheManager.delete(key)));
  }

  async execute(cacheManager: CacheManager, context?: { key?: string }): Promise<void> {
    if (context?.key) {
      await this.invalidateWithDependents(cacheManager, context.key);
    }
  }
}

/**
 * Write-through strategy
 * Ensures cache and data source are always in sync
 */
export class WriteThroughStrategy<T> {
  constructor(
    private cacheManager: CacheManager,
    private dataSource: {
      get: (key: string) => Promise<T | null>;
      set: (key: string, value: T) => Promise<void>;
      delete: (key: string) => Promise<void>;
    }
  ) {}

  /**
   * Get value with write-through
   */
  async get(key: string): Promise<T | null> {
    // Try cache first
    let value = await this.cacheManager.get<T>(key);

    if (value === null) {
      // Load from data source
      value = await this.dataSource.get(key);

      if (value !== null) {
        // Write to cache
        await this.cacheManager.set(key, value);
      }
    }

    return value;
  }

  /**
   * Set value with write-through
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    // Write to data source first
    await this.dataSource.set(key, value);

    // Then update cache
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete value with write-through
   */
  async delete(key: string): Promise<void> {
    // Delete from data source
    await this.dataSource.delete(key);

    // Delete from cache
    await this.cacheManager.delete(key);
  }
}

/**
 * Write-behind (Write-back) strategy
 * Writes to cache immediately and data source asynchronously
 */
export class WriteBehindStrategy<T> {
  private writeQueue: Map<string, T>;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(
    private cacheManager: CacheManager,
    private dataSource: {
      set: (key: string, value: T) => Promise<void>;
      setMany: (entries: Map<string, T>) => Promise<void>;
    },
    private config: {
      /** Flush interval in milliseconds */
      flushInterval?: number;
      /** Maximum queue size before forcing flush */
      maxQueueSize?: number;
    } = {}
  ) {
    this.writeQueue = new Map();

    // Start auto-flush if interval is set
    if (config.flushInterval) {
      this.startAutoFlush(config.flushInterval);
    }
  }

  /**
   * Set value with write-behind
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    // Write to cache immediately
    await this.cacheManager.set(key, value, ttl);

    // Queue for background write
    this.writeQueue.set(key, value);

    // Flush if queue is too large
    if (this.config.maxQueueSize && this.writeQueue.size >= this.config.maxQueueSize) {
      await this.flush();
    }
  }

  /**
   * Flush all pending writes to data source
   */
  async flush(): Promise<void> {
    if (this.writeQueue.size === 0) {
      return;
    }

    const entriesToWrite = new Map(this.writeQueue);
    this.writeQueue.clear();

    try {
      await this.dataSource.setMany(entriesToWrite);
    } catch (error) {
      // On error, re-queue the entries
      entriesToWrite.forEach((value, key) => {
        this.writeQueue.set(key, value);
      });
      throw error;
    }
  }

  /**
   * Start automatic flush on interval
   */
  private startAutoFlush(interval: number): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch((error) => {
        console.error(`Write-behind flush error: ${error}`);
      });
    }, interval);
  }

  /**
   * Stop automatic flush
   */
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Get pending writes count
   */
  getPendingCount(): number {
    return this.writeQueue.size;
  }
}

/**
 * Cache-aside (Lazy loading) strategy
 * Application code is responsible for loading data into cache
 */
export class CacheAsideStrategy<T> {
  constructor(private cacheManager: CacheManager) {}

  /**
   * Get or load value
   */
  async get(key: string, loader: () => Promise<T>, ttl?: number): Promise<T> {
    // Try cache first
    let value = await this.cacheManager.get<T>(key);

    if (value === null) {
      // Load from data source
      value = await loader();

      // Store in cache
      await this.cacheManager.set(key, value, ttl);
    }

    return value;
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key: string): Promise<void> {
    await this.cacheManager.delete(key);
  }
}

/**
 * Refresh-ahead strategy
 * Proactively refreshes cache before expiration
 */
export class RefreshAheadStrategy<T> {
  private refreshThreshold: number;

  constructor(
    private cacheManager: CacheManager,
    private loader: (key: string) => Promise<T>,
    config: {
      /** Refresh when TTL is below this percentage (0-1) */
      refreshThreshold?: number;
    } = {}
  ) {
    this.refreshThreshold = config.refreshThreshold || 0.2; // 20% remaining TTL
  }

  /**
   * Get value with refresh-ahead
   */
  async get(key: string, ttl: number): Promise<T | null> {
    // Get from cache
    const value = await this.cacheManager.get<T>(key);

    if (value !== null) {
      // Check remaining TTL
      const remainingTTL = await this.cacheManager.ttl(key);

      // Refresh if below threshold
      if (remainingTTL > 0 && remainingTTL < ttl * this.refreshThreshold) {
        // Refresh in background
        this.refresh(key, ttl).catch((error) => {
          console.error(`Refresh-ahead error for key ${key}: ${error}`);
        });
      }

      return value;
    }

    // Load and cache
    const newValue = await this.loader(key);
    await this.cacheManager.set(key, newValue, ttl);
    return newValue;
  }

  /**
   * Refresh a cache entry
   */
  private async refresh(key: string, ttl: number): Promise<void> {
    const value = await this.loader(key);
    await this.cacheManager.set(key, value, ttl);
  }
}
