/**
 * Cache Usage Examples
 * Practical examples of using the cache module
 */

import {
  CacheManager,
  Cacheable,
  CacheEvict,
  CachePut,
  Memoize,
  withCache,
  cached,
  BatchCache,
  CacheAsideStrategy,
  WriteThroughStrategy,
  WriteBehindStrategy,
  RefreshAheadStrategy,
  TagBasedInvalidation,
  EventBasedInvalidation,
  DependencyBasedInvalidation,
} from './index';

// ============================================================================
// Example 1: Basic Cache Usage
// ============================================================================

async function basicCacheExample() {
  const cache = new CacheManager({
    redisUrl: 'redis://localhost:6379',
    defaultTTL: 3600,
    enableMemoryFallback: true,
    debug: true,
  });

  await cache.connect();

  // Set and get
  await cache.set('user:123', { name: 'John', email: 'john@example.com' });
  const user = await cache.get('user:123');
  console.log('User:', user);

  // Check existence
  const exists = await cache.has('user:123');
  console.log('Exists:', exists);

  // Get TTL
  const ttl = await cache.ttl('user:123');
  console.log('TTL:', ttl);

  // Delete
  await cache.delete('user:123');

  // Stats
  console.log('Hit rate:', cache.getHitRate());
  console.log('Stats:', cache.getStats());

  await cache.disconnect();
}

// ============================================================================
// Example 2: Using Decorators
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
}

class UserService {
  private database = {
    users: new Map<string, User>([
      ['1', { id: '1', name: 'Alice', email: 'alice@example.com' }],
      ['2', { id: '2', name: 'Bob', email: 'bob@example.com' }],
    ]),
  };

  @Cacheable({ ttl: 3600, keyPrefix: 'user' })
  async getUser(id: string): Promise<User | null> {
    console.log('Fetching user from database:', id);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate DB delay
    return this.database.users.get(id) || null;
  }

  @Cacheable({
    ttl: 3600,
    keyGenerator: (email: string) => `user:email:${email}`,
  })
  async getUserByEmail(email: string): Promise<User | null> {
    console.log('Fetching user by email:', email);
    return Array.from(this.database.users.values()).find((u) => u.email === email) || null;
  }

  @CachePut({ ttl: 3600, keyPrefix: 'user' })
  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.database.users.get(id);
    if (user) {
      Object.assign(user, data);
      this.database.users.set(id, user);
      return user;
    }
    return null;
  }

  @CacheEvict({ keyPrefix: 'user' })
  async deleteUser(id: string): Promise<boolean> {
    return this.database.users.delete(id);
  }

  @Memoize()
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}

async function decoratorExample() {
  const service = new UserService();

  // First call: DB query
  const user1 = await service.getUser('1');
  console.log('User 1:', user1);

  // Second call: Cached
  const user2 = await service.getUser('1');
  console.log('User 2 (cached):', user2);

  // Update: Updates cache
  const updated = await service.updateUser('1', { name: 'Alice Updated' });
  console.log('Updated:', updated);

  // Memoized fibonacci
  console.log('Fib(30):', service.fibonacci(30));
  console.log('Fib(30) again (memoized):', service.fibonacci(30));
}

// ============================================================================
// Example 3: Function Wrapping
// ============================================================================

async function functionWrappingExample() {
  const fetchUser = async (id: string) => {
    console.log('Fetching user:', id);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { id, name: `User ${id}` };
  };

  // Using withCache
  const cachedFetchUser = withCache(fetchUser, {
    ttl: 3600,
    keyPrefix: 'user',
  });

  // Using cached shorthand
  const getProduct = cached(
    'product',
    async (id: string) => {
      console.log('Fetching product:', id);
      return { id, name: `Product ${id}` };
    },
    3600
  );

  // Usage
  await cachedFetchUser('123');
  await cachedFetchUser('123'); // Cached

  await getProduct('456');
  await getProduct('456'); // Cached
}

// ============================================================================
// Example 4: Cache Strategies
// ============================================================================

async function cacheStrategiesExample() {
  const cache = new CacheManager();
  await cache.connect();

  // Cache-Aside
  const cacheAside = new CacheAsideStrategy(cache);
  const user = await cacheAside.get(
    'user:1',
    async () => ({ id: '1', name: 'Alice' }),
    3600
  );

  // Write-Through
  const writeThrough = new WriteThroughStrategy(cache, {
    async get(key: string) {
      console.log('DB get:', key);
      return { data: key };
    },
    async set(key: string, value: unknown) {
      console.log('DB set:', key, value);
    },
    async delete(key: string) {
      console.log('DB delete:', key);
    },
  });

  await writeThrough.set('key1', { data: 'value1' });
  const value = await writeThrough.get('key1');

  // Write-Behind
  const writeBehind = new WriteBehindStrategy(
    cache,
    {
      async set(key: string, value: unknown) {
        console.log('Async DB write:', key, value);
      },
      async setMany(entries: Map<string, unknown>) {
        console.log('Batch DB write:', entries.size, 'entries');
      },
    },
    { flushInterval: 5000, maxQueueSize: 10 }
  );

  await writeBehind.set('key2', { data: 'value2' });
  console.log('Pending writes:', writeBehind.getPendingCount());

  // Refresh-Ahead
  const refreshAhead = new RefreshAheadStrategy(
    cache,
    async (key: string) => {
      console.log('Refreshing:', key);
      return { data: key, timestamp: Date.now() };
    },
    { refreshThreshold: 0.2 }
  );

  await refreshAhead.get('key3', 3600);

  await cache.disconnect();
}

// ============================================================================
// Example 5: Invalidation Strategies
// ============================================================================

async function invalidationStrategiesExample() {
  const cache = new CacheManager();
  await cache.connect();

  // Tag-Based
  const tagInvalidation = new TagBasedInvalidation();
  tagInvalidation.tag('user:1', 'user', 'premium');
  tagInvalidation.tag('user:2', 'user', 'free');
  tagInvalidation.tag('product:1', 'product', 'featured');

  await cache.set('user:1', { name: 'Alice' });
  await cache.set('user:2', { name: 'Bob' });
  await cache.set('product:1', { name: 'Product' });

  // Invalidate all users
  await tagInvalidation.invalidateByTag(cache, 'user');

  // Event-Based
  const eventInvalidation = new EventBasedInvalidation();

  eventInvalidation.on('user.updated', async (data) => {
    await cache.delete(`user:${data.id}`);
    console.log('Invalidated user:', data.id);
  });

  eventInvalidation.on('user.deleted', eventInvalidation.invalidateKeys('users:list', 'users:count'));

  await eventInvalidation.emit('user.updated', { id: '123' });

  // Dependency-Based
  const depInvalidation = new DependencyBasedInvalidation();
  depInvalidation.addDependency('user:1', 'user:1:posts', 'user:1:profile');
  depInvalidation.addDependency('team:abc', 'user:1', 'user:2');

  await cache.set('user:1', { name: 'Alice' });
  await cache.set('user:1:posts', []);
  await cache.set('user:1:profile', {});

  // Invalidates user:1, user:1:posts, user:1:profile
  await depInvalidation.invalidateWithDependents(cache, 'user:1');

  await cache.disconnect();
}

// ============================================================================
// Example 6: Batch Operations
// ============================================================================

async function batchOperationsExample() {
  const cache = new CacheManager();
  await cache.connect();

  const batch = new BatchCache(cache);

  // Set multiple values
  await batch.mset(
    new Map([
      ['user:1', { name: 'Alice' }],
      ['user:2', { name: 'Bob' }],
      ['user:3', { name: 'Charlie' }],
    ]),
    3600
  );

  // Get multiple values
  const users = await batch.mget<User>(['user:1', 'user:2', 'user:3']);
  console.log('Users:', Array.from(users.entries()));

  // Delete multiple keys
  await batch.mdel(['user:1', 'user:2']);

  await cache.disconnect();
}

// ============================================================================
// Example 7: Real-World E-commerce Service
// ============================================================================

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  stock: number;
}

class EcommerceService {
  private cache: CacheManager;
  private tagInvalidation: TagBasedInvalidation;
  private eventInvalidation: EventBasedInvalidation;

  constructor() {
    this.cache = new CacheManager({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      defaultTTL: 3600,
      keyPrefix: 'ecommerce:',
    });

    this.tagInvalidation = new TagBasedInvalidation();
    this.eventInvalidation = new EventBasedInvalidation();

    this.setupEventHandlers();
  }

  async initialize() {
    await this.cache.connect();
  }

  private setupEventHandlers() {
    // When product updated, invalidate related caches
    this.eventInvalidation.on('product.updated', async (data: { id: string; categoryId: string }) => {
      await this.cache.delete(`product:${data.id}`);
      await this.tagInvalidation.invalidateByTag(this.cache, `category:${data.categoryId}`);
    });

    // When order placed, update stock cache
    this.eventInvalidation.on('order.placed', async (data: { products: Array<{ id: string }> }) => {
      for (const product of data.products) {
        await this.cache.delete(`product:${product.id}:stock`);
      }
    });
  }

  @Cacheable({ ttl: 3600, keyPrefix: 'product' })
  async getProduct(id: string): Promise<Product | null> {
    console.log('Fetching product from DB:', id);
    // Simulate DB query
    const product = await this.fetchProductFromDB(id);

    if (product) {
      // Tag the cache entry
      this.tagInvalidation.tag(`product:${id}`, 'product', `category:${product.categoryId}`);
    }

    return product;
  }

  @Cacheable({ ttl: 1800, keyPrefix: 'products:category' })
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    console.log('Fetching products by category:', categoryId);
    const products = await this.fetchProductsByCategoryFromDB(categoryId);

    // Tag the cache entry
    this.tagInvalidation.tag(`products:category:${categoryId}`, `category:${categoryId}`);

    return products;
  }

  @Cacheable({ ttl: 300, keyPrefix: 'product:stock' })
  async getProductStock(productId: string): Promise<number> {
    console.log('Fetching stock for product:', productId);
    return await this.fetchStockFromDB(productId);
  }

  @CacheEvict({
    keyGenerator: (id: string) => [`product:${id}`],
  })
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.updateProductInDB(id, data);

    // Emit event for additional cache invalidation
    await this.eventInvalidation.emit('product.updated', {
      id: product.id,
      categoryId: product.categoryId,
    });

    return product;
  }

  async placeOrder(products: Array<{ id: string; quantity: number }>) {
    console.log('Placing order...');

    // Process order...

    // Emit event to update caches
    await this.eventInvalidation.emit('order.placed', { products });
  }

  async getStats() {
    return {
      cacheStats: this.cache.getStats(),
      hitRate: this.cache.getHitRate(),
    };
  }

  async shutdown() {
    await this.cache.disconnect();
  }

  // Simulated DB methods
  private async fetchProductFromDB(id: string): Promise<Product | null> {
    return {
      id,
      name: `Product ${id}`,
      price: 99.99,
      categoryId: 'cat1',
      stock: 100,
    };
  }

  private async fetchProductsByCategoryFromDB(categoryId: string): Promise<Product[]> {
    return [
      {
        id: '1',
        name: 'Product 1',
        price: 99.99,
        categoryId,
        stock: 100,
      },
    ];
  }

  private async fetchStockFromDB(productId: string): Promise<number> {
    return 100;
  }

  private async updateProductInDB(id: string, data: Partial<Product>): Promise<Product> {
    return {
      id,
      name: data.name || `Product ${id}`,
      price: data.price || 99.99,
      categoryId: data.categoryId || 'cat1',
      stock: data.stock || 100,
    };
  }
}

async function ecommerceExample() {
  const service = new EcommerceService();
  await service.initialize();

  // Get product (cached)
  const product1 = await service.getProduct('1');
  const product2 = await service.getProduct('1'); // Cached

  // Get products by category
  const products = await service.getProductsByCategory('cat1');

  // Update product (invalidates caches)
  await service.updateProduct('1', { price: 89.99 });

  // Place order (updates stock cache)
  await service.placeOrder([{ id: '1', quantity: 2 }]);

  // Check stats
  const stats = await service.getStats();
  console.log('Stats:', stats);

  await service.shutdown();
}

// ============================================================================
// Run Examples
// ============================================================================

export async function runAllExamples() {
  console.log('\n=== Basic Cache Example ===');
  await basicCacheExample();

  console.log('\n=== Decorator Example ===');
  await decoratorExample();

  console.log('\n=== Function Wrapping Example ===');
  await functionWrappingExample();

  console.log('\n=== Cache Strategies Example ===');
  await cacheStrategiesExample();

  console.log('\n=== Invalidation Strategies Example ===');
  await invalidationStrategiesExample();

  console.log('\n=== Batch Operations Example ===');
  await batchOperationsExample();

  console.log('\n=== E-commerce Example ===');
  await ecommerceExample();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
