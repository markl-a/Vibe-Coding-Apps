/**
 * Edge Caching Example
 *
 * Demonstrates intelligent caching strategies at the edge:
 * - Content caching for faster delivery
 * - Predictive caching based on usage patterns
 * - Cache invalidation and synchronization
 * - Multi-tier caching architecture
 * - Bandwidth optimization through smart caching
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // bytes
  ttl?: number; // time to live in ms
  priority: number;
  tags?: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
}

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number;
  defaultTTL: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'priority';
}

interface PredictionModel {
  resourceId: string;
  confidence: number;
  nextAccessTime: number;
}

// ============================================================================
// Edge Cache Manager
// ============================================================================

class EdgeCacheManager<T = any> extends EventEmitter {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalSize: 0,
    entryCount: 0,
    evictions: 0,
  };

  constructor(private config: CacheConfig) {
    super();
    console.log(`[Cache] Initialized with ${this.formatBytes(config.maxSize)} max size`);
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      this.emit('cache-miss', { key });
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      console.log(`[Cache] Entry expired: ${key}`);
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRate();
    this.emit('cache-hit', { key, accessCount: entry.accessCount });

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, options?: { ttl?: number; priority?: number; tags?: string[] }): boolean {
    const size = this.estimateSize(value);

    // Check if we need to evict entries
    while (this.shouldEvict(size)) {
      const evicted = this.evict();
      if (!evicted) break; // Can't evict any more
    }

    // Check if still can't fit
    if (this.stats.totalSize + size > this.config.maxSize) {
      console.warn(`[Cache] Cannot cache ${key}: size ${this.formatBytes(size)} exceeds remaining capacity`);
      return false;
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      ttl: options?.ttl || this.config.defaultTTL,
      priority: options?.priority || 1,
      tags: options?.tags,
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.entryCount++;

    this.emit('cache-set', { key, size });
    console.log(`[Cache] Cached ${key} (${this.formatBytes(size)})`);

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    this.stats.entryCount--;

    this.emit('cache-delete', { key, size: entry.size });
    return true;
  }

  /**
   * Check if cache has key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clear cache by tags
   */
  clearByTag(tag: string): number {
    let cleared = 0;

    for (const [key, entry] of this.cache) {
      if (entry.tags?.includes(tag)) {
        this.delete(key);
        cleared++;
      }
    }

    console.log(`[Cache] Cleared ${cleared} entries with tag: ${tag}`);
    return cleared;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
    console.log(`[Cache] Cleared ${count} entries`);
    this.emit('cache-cleared', { count });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache utilization percentage
   */
  getUtilization(): number {
    return (this.stats.totalSize / this.config.maxSize) * 100;
  }

  // Private methods

  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private shouldEvict(newEntrySize: number): boolean {
    return (
      this.stats.totalSize + newEntrySize > this.config.maxSize ||
      this.stats.entryCount >= this.config.maxEntries
    );
  }

  private evict(): boolean {
    let victim: string | undefined;

    switch (this.config.evictionPolicy) {
      case 'lru':
        victim = this.findLRUVictim();
        break;
      case 'lfu':
        victim = this.findLFUVictim();
        break;
      case 'fifo':
        victim = this.findFIFOVictim();
        break;
      case 'priority':
        victim = this.findPriorityVictim();
        break;
    }

    if (victim) {
      console.log(`[Cache] Evicting entry: ${victim} (policy: ${this.config.evictionPolicy})`);
      this.delete(victim);
      this.stats.evictions++;
      this.emit('cache-evicted', { key: victim, policy: this.config.evictionPolicy });
      return true;
    }

    return false;
  }

  private findLRUVictim(): string | undefined {
    let oldest: { key: string; time: number } | undefined;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.lastAccessed < oldest.time) {
        oldest = { key, time: entry.lastAccessed };
      }
    }

    return oldest?.key;
  }

  private findLFUVictim(): string | undefined {
    let leastUsed: { key: string; count: number } | undefined;

    for (const [key, entry] of this.cache) {
      if (!leastUsed || entry.accessCount < leastUsed.count) {
        leastUsed = { key, count: entry.accessCount };
      }
    }

    return leastUsed?.key;
  }

  private findFIFOVictim(): string | undefined {
    let oldest: { key: string; time: number } | undefined;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.timestamp < oldest.time) {
        oldest = { key, time: entry.timestamp };
      }
    }

    return oldest?.key;
  }

  private findPriorityVictim(): string | undefined {
    let lowestPriority: { key: string; priority: number } | undefined;

    for (const [key, entry] of this.cache) {
      if (!lowestPriority || entry.priority < lowestPriority.priority) {
        lowestPriority = { key, priority: entry.priority };
      }
    }

    return lowestPriority?.key;
  }

  private estimateSize(value: any): number {
    const json = JSON.stringify(value);
    return new Blob([json]).size;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// ============================================================================
// Predictive Cache Manager
// ============================================================================

class PredictiveCacheManager extends EventEmitter {
  private accessHistory = new Map<string, number[]>();
  private predictions: PredictionModel[] = [];

  constructor(private cache: EdgeCacheManager, private fetchCallback: (key: string) => Promise<any>) {
    super();
  }

  /**
   * Record access for prediction model
   */
  recordAccess(key: string): void {
    const history = this.accessHistory.get(key) || [];
    history.push(Date.now());

    // Keep only last 100 accesses
    if (history.length > 100) {
      history.shift();
    }

    this.accessHistory.set(key, history);
  }

  /**
   * Predict next accesses and prefetch
   */
  async predictAndPrefetch(): Promise<void> {
    console.log('[PredictiveCache] Running prediction analysis...');

    this.predictions = [];

    for (const [key, history] of this.accessHistory) {
      if (history.length < 5) continue; // Need minimum history

      // Calculate access pattern
      const intervals: number[] = [];
      for (let i = 1; i < history.length; i++) {
        intervals.push(history[i] - history[i - 1]);
      }

      // Average interval
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // Standard deviation
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // Confidence based on regularity (lower stdDev = higher confidence)
      const confidence = Math.max(0, 1 - stdDev / avgInterval);

      // Predict next access time
      const lastAccess = history[history.length - 1];
      const nextAccessTime = lastAccess + avgInterval;

      // Only predict if high confidence and within reasonable timeframe
      if (confidence > 0.6 && avgInterval < 3600000) {
        // < 1 hour
        this.predictions.push({
          resourceId: key,
          confidence,
          nextAccessTime,
        });
      }
    }

    // Sort by next access time
    this.predictions.sort((a, b) => a.nextAccessTime - b.nextAccessTime);

    console.log(`[PredictiveCache] Generated ${this.predictions.length} predictions`);

    // Prefetch top predictions
    await this.prefetchPredictions();
  }

  /**
   * Prefetch predicted resources
   */
  private async prefetchPredictions(): Promise<void> {
    const now = Date.now();
    const prefetchWindow = 60000; // Prefetch if predicted within 1 minute

    for (const prediction of this.predictions) {
      // Skip if already cached
      if (this.cache.has(prediction.resourceId)) {
        continue;
      }

      // Check if within prefetch window
      const timeUntilAccess = prediction.nextAccessTime - now;
      if (timeUntilAccess < 0 || timeUntilAccess > prefetchWindow) {
        continue;
      }

      console.log(
        `[PredictiveCache] Prefetching ${prediction.resourceId} (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`
      );

      try {
        const data = await this.fetchCallback(prediction.resourceId);
        this.cache.set(prediction.resourceId, data, {
          priority: Math.round(prediction.confidence * 10),
          tags: ['prefetched'],
        });

        this.emit('prefetch-complete', {
          key: prediction.resourceId,
          confidence: prediction.confidence,
        });
      } catch (error) {
        console.error(`[PredictiveCache] Failed to prefetch ${prediction.resourceId}:`, error);
      }
    }
  }

  /**
   * Get prediction statistics
   */
  getPredictionStats(): {
    totalPredictions: number;
    avgConfidence: number;
    trackedResources: number;
  } {
    const avgConfidence =
      this.predictions.length > 0
        ? this.predictions.reduce((sum, p) => sum + p.confidence, 0) / this.predictions.length
        : 0;

    return {
      totalPredictions: this.predictions.length,
      avgConfidence,
      trackedResources: this.accessHistory.size,
    };
  }
}

// ============================================================================
// Multi-Tier Cache
// ============================================================================

class MultiTierCache {
  private l1Cache: EdgeCacheManager; // Fast, small
  private l2Cache: EdgeCacheManager; // Slower, larger

  constructor() {
    // L1: Fast memory cache
    this.l1Cache = new EdgeCacheManager({
      maxSize: 10 * 1024 * 1024, // 10 MB
      maxEntries: 1000,
      defaultTTL: 60000, // 1 minute
      evictionPolicy: 'lru',
    });

    // L2: Larger disk-based cache
    this.l2Cache = new EdgeCacheManager({
      maxSize: 100 * 1024 * 1024, // 100 MB
      maxEntries: 10000,
      defaultTTL: 3600000, // 1 hour
      evictionPolicy: 'lfu',
    });

    // Promote from L2 to L1 on L1 miss
    this.l1Cache.on('cache-miss', ({ key }) => {
      const value = this.l2Cache.get(key);
      if (value !== undefined) {
        this.l1Cache.set(key, value);
        console.log(`[MultiTier] Promoted ${key} from L2 to L1`);
      }
    });
  }

  /**
   * Get value from multi-tier cache
   */
  get(key: string): any | undefined {
    // Try L1 first
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Try L2
    value = this.l2Cache.get(key);
    if (value !== undefined) {
      // Promote to L1
      this.l1Cache.set(key, value);
      return value;
    }

    return undefined;
  }

  /**
   * Set value in multi-tier cache
   */
  set(key: string, value: any, hot: boolean = false): void {
    // Always set in L2
    this.l2Cache.set(key, value);

    // Set in L1 if hot data
    if (hot) {
      this.l1Cache.set(key, value);
    }
  }

  /**
   * Get combined statistics
   */
  getStats() {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats(),
      totalHitRate:
        (this.l1Cache.getStats().hits + this.l2Cache.getStats().hits) /
        (this.l1Cache.getStats().hits +
          this.l1Cache.getStats().misses +
          this.l2Cache.getStats().hits +
          this.l2Cache.getStats().misses),
    };
  }
}

// ============================================================================
// Usage Example
// ============================================================================

async function main() {
  console.log('=== Edge Caching Example ===\n');

  // 1. Basic caching
  console.log('1. Basic Cache Operations:');
  const cache = new EdgeCacheManager({
    maxSize: 1024 * 1024, // 1 MB
    maxEntries: 100,
    defaultTTL: 60000,
    evictionPolicy: 'lru',
  });

  // Cache some data
  cache.set('user:1', { id: 1, name: 'Alice', email: 'alice@example.com' });
  cache.set('user:2', { id: 2, name: 'Bob', email: 'bob@example.com' }, { priority: 5 });
  cache.set('config', { theme: 'dark', lang: 'en' }, { tags: ['settings'] });

  // Retrieve data
  console.log('User 1:', cache.get('user:1'));
  console.log('User 2:', cache.get('user:2'));
  console.log('Missing:', cache.get('user:3'));

  console.log('\nCache Stats:', cache.getStats());
  console.log(`Utilization: ${cache.getUtilization().toFixed(2)}%`);

  // 2. Predictive caching
  console.log('\n2. Predictive Caching:');
  const predictiveCache = new PredictiveCacheManager(cache, async (key) => {
    console.log(`[Fetch] Loading ${key}...`);
    return { key, data: `Data for ${key}` };
  });

  // Simulate access patterns
  for (let i = 0; i < 10; i++) {
    predictiveCache.recordAccess('api:users');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await predictiveCache.predictAndPrefetch();
  console.log('Prediction Stats:', predictiveCache.getPredictionStats());

  // 3. Multi-tier caching
  console.log('\n3. Multi-Tier Cache:');
  const multiTier = new MultiTierCache();

  multiTier.set('hot-data', { value: 'frequently accessed' }, true);
  multiTier.set('cold-data', { value: 'rarely accessed' }, false);

  console.log('Hot data:', multiTier.get('hot-data'));
  console.log('Cold data (promoted):', multiTier.get('cold-data'));
  console.log('\nMulti-Tier Stats:', JSON.stringify(multiTier.getStats(), null, 2));

  // 4. Tag-based invalidation
  console.log('\n4. Tag-Based Cache Invalidation:');
  cache.set('product:1', { id: 1, name: 'Widget' }, { tags: ['products'] });
  cache.set('product:2', { id: 2, name: 'Gadget' }, { tags: ['products'] });
  cache.set('category:1', { id: 1, name: 'Electronics' }, { tags: ['categories'] });

  console.log(`Cached entries: ${cache.keys().length}`);
  const cleared = cache.clearByTag('products');
  console.log(`Cleared ${cleared} product entries`);
  console.log(`Remaining entries: ${cache.keys().length}`);

  console.log('\n=== Edge Caching Complete ===');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { EdgeCacheManager, PredictiveCacheManager, MultiTierCache, CacheEntry, CacheStats, CacheConfig };
