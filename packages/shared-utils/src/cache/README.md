# Redis Cache Layer

A comprehensive caching solution with Redis support, in-memory fallback, and advanced features like decorators, multiple invalidation strategies, and cache patterns.

## Features

- **Redis Integration**: Full Redis support with automatic connection management
- **Memory Fallback**: Automatic fallback to in-memory cache when Redis is unavailable
- **TTL Support**: Time-to-live for cache entries with automatic expiration
- **Decorators**: Easy-to-use method decorators (@Cacheable, @CacheEvict, @CachePut)
- **Invalidation Strategies**: Multiple cache invalidation patterns
- **Cache Patterns**: Support for Write-Through, Write-Behind, Cache-Aside, and Refresh-Ahead
- **Statistics**: Built-in cache performance metrics
- **TypeScript**: Full TypeScript support with comprehensive types

## Installation

First, install the required dependencies:

```bash
npm install ioredis
# or
npm install redis
```

## Quick Start

### Basic Usage

```typescript
import { CacheManager } from '@vibe/shared-utils';

// Create cache manager
const cache = new CacheManager({
  redisUrl: 'redis://localhost:6379',
  defaultTTL: 3600, // 1 hour
  enableMemoryFallback: true,
});

// Connect to Redis
await cache.connect();

// Set a value
await cache.set('user:123', { name: 'John', email: 'john@example.com' }, 3600);

// Get a value
const user = await cache.get('user:123');

// Delete a value
await cache.delete('user:123');

// Check if key exists
const exists = await cache.has('user:123');

// Get statistics
const stats = cache.getStats();
console.log(`Hit rate: ${cache.getHitRate()}`);
```

### Using Decorators

```typescript
import { Cacheable, CacheEvict, CachePut } from '@vibe/shared-utils';

class UserService {
  // Cache the result for 1 hour
  @Cacheable({ ttl: 3600, keyPrefix: 'user' })
  async getUser(id: string) {
    console.log('Fetching from database...');
    return await database.users.findById(id);
  }

  // Cache with custom key generator
  @Cacheable({
    ttl: 3600,
    keyGenerator: (email: string) => `user:email:${email}`,
  })
  async getUserByEmail(email: string) {
    return await database.users.findByEmail(email);
  }

  // Cache only if result meets condition
  @Cacheable({
    ttl: 3600,
    condition: (user) => user !== null,
  })
  async searchUser(query: string) {
    return await database.users.search(query);
  }

  // Update cache after execution
  @CachePut({ ttl: 3600, keyPrefix: 'user' })
  async updateUser(id: string, data: any) {
    return await database.users.update(id, data);
  }

  // Evict cache after execution
  @CacheEvict({ keyPrefix: 'user' })
  async deleteUser(id: string) {
    await database.users.delete(id);
  }

  // Evict multiple keys
  @CacheEvict({ keys: ['users:list', 'users:count'] })
  async createUser(data: any) {
    return await database.users.create(data);
  }

  // Clear all cache
  @CacheEvict({ allEntries: true })
  async resetUsers() {
    await database.users.truncate();
  }
}
```

### Using with Functions

```typescript
import { withCache, cached } from '@vibe/shared-utils';

// Wrap function with cache
const cachedGetUser = withCache(
  async (id: string) => {
    return await database.users.findById(id);
  },
  { ttl: 3600, keyPrefix: 'user' }
);

// Simplified version
const getProduct = cached(
  'product',
  async (id: string) => database.products.findById(id),
  3600
);

const user = await cachedGetUser('123');
const product = await getProduct('456');
```

### Simple Memoization

```typescript
import { Memoize } from '@vibe/shared-utils';

class Calculator {
  @Memoize()
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  @Memoize()
  expensiveComputation(x: number, y: number): number {
    console.log('Computing...');
    return x ** y;
  }
}

const calc = new Calculator();
calc.fibonacci(10); // Computed
calc.fibonacci(10); // Cached
```

## Cache Strategies

### Cache-Aside (Lazy Loading)

```typescript
import { CacheAsideStrategy, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const cacheAside = new CacheAsideStrategy(cache);

// Get or load
const user = await cacheAside.get(
  'user:123',
  async () => {
    return await database.users.findById('123');
  },
  3600
);

// Invalidate
await cacheAside.invalidate('user:123');
```

### Write-Through

```typescript
import { WriteThroughStrategy, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const writeThrough = new WriteThroughStrategy(cache, {
  async get(key: string) {
    return await database.get(key);
  },
  async set(key: string, value: any) {
    await database.set(key, value);
  },
  async delete(key: string) {
    await database.delete(key);
  },
});

// Reads from cache, falls back to DB, updates cache
const value = await writeThrough.get('key');

// Writes to DB first, then updates cache
await writeThrough.set('key', { data: 'value' }, 3600);

// Deletes from both DB and cache
await writeThrough.delete('key');
```

### Write-Behind (Write-Back)

```typescript
import { WriteBehindStrategy, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const writeBehind = new WriteBehindStrategy(
  cache,
  {
    async set(key: string, value: any) {
      await database.set(key, value);
    },
    async setMany(entries: Map<string, any>) {
      await database.batchSet(entries);
    },
  },
  {
    flushInterval: 5000, // Flush every 5 seconds
    maxQueueSize: 100, // Flush when queue reaches 100
  }
);

// Writes to cache immediately, queues DB write
await writeBehind.set('key', { data: 'value' }, 3600);

// Force flush
await writeBehind.flush();

// Check pending writes
console.log(writeBehind.getPendingCount());
```

### Refresh-Ahead

```typescript
import { RefreshAheadStrategy, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const refreshAhead = new RefreshAheadStrategy(
  cache,
  async (key: string) => {
    return await database.get(key);
  },
  {
    refreshThreshold: 0.2, // Refresh when 20% TTL remaining
  }
);

// Gets from cache, refreshes in background if TTL is low
const value = await refreshAhead.get('key', 3600);
```

## Invalidation Strategies

### Time-Based Invalidation

```typescript
import { TimeBasedInvalidation, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const timeInvalidation = new TimeBasedInvalidation({
  interval: 60000, // 1 minute
  keysPattern: ['user:*', 'session:*'],
});

// Start auto-invalidation
const intervalId = timeInvalidation.startAutoInvalidation(cache);

// Stop when done
clearInterval(intervalId);
```

### Event-Based Invalidation

```typescript
import { EventBasedInvalidation } from '@vibe/shared-utils';

const eventInvalidation = new EventBasedInvalidation();

// Register handlers
eventInvalidation.on('user.updated', eventInvalidation.invalidateKeys('user:123', 'users:list'));

eventInvalidation.on('user.deleted', async (data) => {
  const cache = getDefaultCacheManager();
  await cache.delete(`user:${data.id}`);
  await cache.delete('users:list');
});

// Emit events
await eventInvalidation.emit('user.updated', { id: '123' });
```

### Tag-Based Invalidation

```typescript
import { TagBasedInvalidation, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const tagInvalidation = new TagBasedInvalidation();

// Tag cache entries
tagInvalidation.tag('user:123', 'user', 'premium');
tagInvalidation.tag('user:456', 'user', 'free');
tagInvalidation.tag('product:789', 'product', 'featured');

// Invalidate by tag
await tagInvalidation.invalidateByTag(cache, 'user'); // Invalidates user:123 and user:456
await tagInvalidation.invalidateByTag(cache, 'premium'); // Invalidates user:123 only
```

### Dependency-Based Invalidation

```typescript
import { DependencyBasedInvalidation, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const depInvalidation = new DependencyBasedInvalidation();

// Define dependencies
depInvalidation.addDependency('user:123', 'user:123:posts', 'user:123:profile');
depInvalidation.addDependency('team:abc', 'user:123', 'user:456', 'user:789');

// Invalidate with dependents
await depInvalidation.invalidateWithDependents(cache, 'user:123');
// Also invalidates: user:123:posts, user:123:profile
```

### LRU (Least Recently Used)

```typescript
import { LRUStrategy, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const lru = new LRUStrategy(1000); // Max 1000 entries

// Record access
lru.recordAccess('key1');
lru.recordAccess('key2');

// Execute strategy to evict LRU items
await lru.execute(cache);
```

## Batch Operations

```typescript
import { BatchCache, CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager();
await cache.connect();

const batch = new BatchCache(cache);

// Get multiple values
const results = await batch.mget<User>(['user:1', 'user:2', 'user:3']);
console.log(results.get('user:1'));

// Set multiple values
await batch.mset(
  new Map([
    ['user:1', { name: 'Alice' }],
    ['user:2', { name: 'Bob' }],
  ]),
  3600
);

// Delete multiple keys
await batch.mdel(['user:1', 'user:2']);
```

## Configuration

```typescript
import { CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager({
  // Redis connection URL
  redisUrl: 'redis://localhost:6379',

  // Default TTL in seconds (default: 3600)
  defaultTTL: 7200,

  // Enable memory fallback (default: true)
  enableMemoryFallback: true,

  // Max memory cache entries (default: 1000)
  maxMemoryCacheSize: 5000,

  // Connection timeout in ms (default: 5000)
  connectionTimeout: 10000,

  // Key prefix for all entries (default: 'cache:')
  keyPrefix: 'myapp:',

  // Enable debug logging (default: false)
  debug: true,
});
```

## Statistics and Monitoring

```typescript
const stats = cache.getStats();

console.log({
  hits: stats.hits,
  misses: stats.misses,
  sets: stats.sets,
  deletes: stats.deletes,
  errors: stats.errors,
  isRedisConnected: stats.isRedisConnected,
  memoryEntriesCount: stats.memoryEntriesCount,
  hitRate: cache.getHitRate(),
});

// Reset statistics
cache.resetStats();
```

## Best Practices

1. **Set Appropriate TTL**: Choose TTL based on data volatility
2. **Use Key Prefixes**: Organize cache keys with prefixes
3. **Handle Cache Misses**: Always have fallback logic
4. **Monitor Performance**: Track hit rates and adjust strategy
5. **Invalidate Wisely**: Clear cache when data changes
6. **Use Decorators**: Simplify caching with method decorators
7. **Batch Operations**: Use batch operations for multiple keys
8. **Resource Cleanup**: Always disconnect when done

```typescript
// Good practice
async function example() {
  const cache = new CacheManager({ redisUrl: 'redis://localhost:6379' });

  try {
    await cache.connect();

    // Use cache
    await cache.set('key', 'value');
    const value = await cache.get('key');
  } finally {
    // Always cleanup
    await cache.disconnect();
  }
}
```

## Advanced Example

```typescript
import {
  CacheManager,
  Cacheable,
  CacheEvict,
  TagBasedInvalidation,
  WriteThroughStrategy,
} from '@vibe/shared-utils';

// Initialize cache
const cache = new CacheManager({
  redisUrl: process.env.REDIS_URL,
  defaultTTL: 3600,
  keyPrefix: 'myapp:',
  debug: process.env.NODE_ENV === 'development',
});

await cache.connect();

// Tag-based invalidation
const tagInvalidation = new TagBasedInvalidation();

class ProductService {
  private writeThrough: WriteThroughStrategy<any>;

  constructor() {
    this.writeThrough = new WriteThroughStrategy(cache, {
      async get(key: string) {
        return await db.products.findById(key);
      },
      async set(key: string, value: any) {
        await db.products.update(key, value);
      },
      async delete(key: string) {
        await db.products.delete(key);
      },
    });
  }

  @Cacheable({
    ttl: 3600,
    keyPrefix: 'product',
    cacheManager: cache,
  })
  async getProduct(id: string) {
    const product = await db.products.findById(id);
    tagInvalidation.tag(`product:${id}`, 'product', `category:${product.categoryId}`);
    return product;
  }

  @Cacheable({
    ttl: 1800,
    keyPrefix: 'products:category',
  })
  async getProductsByCategory(categoryId: string) {
    const products = await db.products.findByCategory(categoryId);
    products.forEach((p) => {
      tagInvalidation.tag(`products:category:${categoryId}`, `category:${categoryId}`);
    });
    return products;
  }

  @CacheEvict({
    cacheManager: cache,
    keyGenerator: (id: string) => [`product:${id}`],
  })
  async updateProduct(id: string, data: any) {
    const product = await this.writeThrough.set(`product:${id}`, data);
    // Invalidate category cache
    await tagInvalidation.invalidateByTag(cache, `category:${product.categoryId}`);
    return product;
  }

  @CacheEvict({ allEntries: true, cacheManager: cache })
  async clearAllProducts() {
    await db.products.truncate();
  }
}

// Usage
const productService = new ProductService();

// First call: DB query
const product1 = await productService.getProduct('123');

// Second call: Cached
const product2 = await productService.getProduct('123');

// Update: Invalidates cache
await productService.updateProduct('123', { name: 'Updated' });

// Stats
console.log('Cache hit rate:', cache.getHitRate());
console.log('Stats:', cache.getStats());
```

## Error Handling

The cache manager gracefully handles errors and falls back to memory cache when Redis is unavailable:

```typescript
const cache = new CacheManager({
  redisUrl: 'redis://invalid:6379',
  enableMemoryFallback: true,
  debug: true,
});

try {
  await cache.connect();
} catch (error) {
  // Connection failed, but memory fallback is active
  console.log('Using memory cache fallback');
}

// Operations work with memory cache
await cache.set('key', 'value');
const value = await cache.get('key'); // Works with memory cache
```

## License

MIT
