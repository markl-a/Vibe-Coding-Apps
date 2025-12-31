/**
 * Type Usage Examples
 * Demonstrates using shared types, type guards, and generic patterns
 */

import {
  // API Response Types
  type ApiResponse,
  type ApiError,
  type ResponseMeta,
  successResponse,
  errorResponse,
  isSuccessResponse,
  isErrorResponse,

  // Pagination Types
  type PaginationParams,
  type PaginatedResponse,
  paginatedResponse,

  // User Types
  type BaseUser,
  type UserRole,
  type AuthTokenPayload,

  // Request Types
  type AuthenticatedRequest,

  // Sorting and Filtering Types
  type SortOrder,
  type SortParams,
  type FilterParams,

  // Entity Types
  type BaseEntity,
  type SoftDeletableEntity,
  type AuditableEntity,

  // Event Types
  type DomainEvent,

  // Config Types
  type DatabaseConfig,
  type RedisConfig,
  type AppConfig,
} from '@vibe/shared-utils';

// =============================================================================
// Example 1: Using API Response Types
// =============================================================================

/**
 * Example: Typed API responses
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export async function fetchUser(userId: string): Promise<ApiResponse<User>> {
  try {
    // Simulate API call
    const user: User = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    };

    return successResponse(user, 'User fetched successfully');
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch user',
      { userId, error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Example: Handling typed responses
 */
export async function handleUserResponse() {
  const response = await fetchUser('123');

  // Type guard ensures TypeScript knows about response.data
  if (isSuccessResponse(response)) {
    // TypeScript knows response.data is User
    console.log(`Welcome, ${response.data.name}!`);
    console.log(`Email: ${response.data.email}`);
    console.log(`Role: ${response.data.role}`);
    return response.data;
  }

  // Type guard ensures TypeScript knows about response.error
  if (isErrorResponse(response)) {
    // TypeScript knows response.error exists
    console.error(`Error: ${response.error.message}`);
    console.error(`Code: ${response.error.code}`);
    if (response.error.details) {
      console.error('Details:', response.error.details);
    }
    return null;
  }

  return null;
}

// =============================================================================
// Example 2: Pagination Types
// =============================================================================

/**
 * Example: Paginated list endpoint
 */
export async function fetchUsers(
  params: PaginationParams
): Promise<PaginatedResponse<User>> {
  // Simulate database query
  const allUsers: User[] = Array.from({ length: 100 }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 3 === 0 ? 'admin' : 'user' as UserRole,
  }));

  const { page, limit } = params;
  const skip = params.skip ?? (page - 1) * limit;
  const items = allUsers.slice(skip, skip + limit);
  const total = allUsers.length;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Example: Using paginated response
 */
export async function displayUsersList() {
  const result = await fetchUsers({ page: 1, limit: 10 });

  console.log(`\nShowing ${result.items.length} users:`);
  result.items.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`);
  });

  console.log('\nPagination Info:');
  console.log(`  Page: ${result.pagination.page}/${result.pagination.totalPages}`);
  console.log(`  Total: ${result.pagination.total} users`);
  console.log(`  Has next: ${result.pagination.hasNext ? 'Yes' : 'No'}`);
  console.log(`  Has previous: ${result.pagination.hasPrev ? 'Yes' : 'No'}`);

  return result;
}

// =============================================================================
// Example 3: Sorting and Filtering Types
// =============================================================================

interface Product extends BaseEntity {
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

/**
 * Example: Type-safe sorting
 */
export function sortProducts(
  products: Product[],
  sort: SortParams<keyof Product>
): Product[] {
  return [...products].sort((a, b) => {
    const aValue = a[sort.field];
    const bValue = b[sort.field];

    if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
    if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Example: Type-safe filtering
 */
export function filterProducts(
  products: Product[],
  filters: FilterParams
): Product[] {
  return products.filter(product => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined) return true;

      const productValue = product[key as keyof Product];

      // Handle array filters (e.g., multiple categories)
      if (Array.isArray(value)) {
        return value.includes(String(productValue));
      }

      // Handle exact match
      return productValue === value;
    });
  });
}

/**
 * Example: Using sorting and filtering
 */
export function productListExample() {
  const products: Product[] = [
    { id: '1', name: 'Laptop', price: 999, category: 'Electronics', inStock: true, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: '2', name: 'Mouse', price: 29, category: 'Electronics', inStock: true, createdAt: new Date('2024-01-02'), updatedAt: new Date() },
    { id: '3', name: 'Desk', price: 299, category: 'Furniture', inStock: false, createdAt: new Date('2024-01-03'), updatedAt: new Date() },
  ];

  // Sort by price (ascending)
  const sortedByPrice = sortProducts(products, {
    field: 'price',
    order: 'asc',
  });
  console.log('\nSorted by price:', sortedByPrice.map(p => `${p.name}: $${p.price}`));

  // Filter by category
  const filtered = filterProducts(products, {
    category: 'Electronics',
    inStock: true,
  });
  console.log('\nFiltered (Electronics, In Stock):', filtered.map(p => p.name));

  return { sorted: sortedByPrice, filtered };
}

// =============================================================================
// Example 4: Entity Types with Inheritance
// =============================================================================

/**
 * Example: Soft-deletable entity
 */
interface Article extends SoftDeletableEntity {
  title: string;
  content: string;
  author: string;
}

export function createArticle(data: Omit<Article, keyof SoftDeletableEntity>): Article {
  return {
    ...data,
    id: `article-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };
}

export function softDeleteArticle(article: Article): Article {
  return {
    ...article,
    deletedAt: new Date(),
    isDeleted: true,
    updatedAt: new Date(),
  };
}

/**
 * Example: Auditable entity
 */
interface Document extends AuditableEntity {
  title: string;
  content: string;
}

export function createDocument(
  data: Omit<Document, keyof AuditableEntity>,
  userId: string
): Document {
  return {
    ...data,
    id: `doc-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  };
}

export function updateDocument(
  document: Document,
  updates: Partial<Pick<Document, 'title' | 'content'>>,
  userId: string
): Document {
  return {
    ...document,
    ...updates,
    updatedAt: new Date(),
    updatedBy: userId,
  };
}

/**
 * Example: Using entity types
 */
export function entityTypesExample() {
  // Create article
  const article = createArticle({
    title: 'Introduction to TypeScript',
    content: 'TypeScript is a typed superset of JavaScript...',
    author: 'John Doe',
  });
  console.log('\nCreated article:', article);

  // Soft delete article
  const deletedArticle = softDeleteArticle(article);
  console.log('Deleted article:', {
    id: deletedArticle.id,
    isDeleted: deletedArticle.isDeleted,
    deletedAt: deletedArticle.deletedAt,
  });

  // Create document
  const doc = createDocument({
    title: 'Project Proposal',
    content: 'This proposal outlines...',
  }, 'user-123');
  console.log('\nCreated document:', doc);

  // Update document
  const updatedDoc = updateDocument(
    doc,
    { title: 'Updated Project Proposal' },
    'user-456'
  );
  console.log('Updated document:', {
    id: updatedDoc.id,
    title: updatedDoc.title,
    createdBy: updatedDoc.createdBy,
    updatedBy: updatedDoc.updatedBy,
  });

  return { article: deletedArticle, document: updatedDoc };
}

// =============================================================================
// Example 5: Domain Events
// =============================================================================

/**
 * Example: Type-safe domain events
 */
type UserCreatedPayload = {
  userId: string;
  email: string;
  name: string;
};

type UserUpdatedPayload = {
  userId: string;
  changes: Partial<User>;
};

type OrderPlacedPayload = {
  orderId: string;
  userId: string;
  total: number;
  items: string[];
};

export class EventEmitter {
  private events: DomainEvent[] = [];

  emit<T>(type: string, payload: T, correlationId?: string): void {
    const event: DomainEvent<T> = {
      type,
      payload,
      timestamp: new Date(),
      correlationId,
    };

    this.events.push(event);
    console.log(`Event emitted: ${type}`, event);
  }

  getEvents(): DomainEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Example: Using domain events
 */
export function domainEventsExample() {
  const emitter = new EventEmitter();

  // User created event
  emitter.emit<UserCreatedPayload>('user.created', {
    userId: 'user-123',
    email: 'john@example.com',
    name: 'John Doe',
  }, 'correlation-1');

  // User updated event
  emitter.emit<UserUpdatedPayload>('user.updated', {
    userId: 'user-123',
    changes: { name: 'John Smith' },
  }, 'correlation-2');

  // Order placed event
  emitter.emit<OrderPlacedPayload>('order.placed', {
    orderId: 'order-456',
    userId: 'user-123',
    total: 99.99,
    items: ['item-1', 'item-2'],
  }, 'correlation-3');

  console.log(`\nTotal events: ${emitter.getEvents().length}`);

  return emitter.getEvents();
}

// =============================================================================
// Example 6: Configuration Types
// =============================================================================

/**
 * Example: Type-safe configuration
 */
export function createAppConfig(): AppConfig {
  return {
    env: (process.env.NODE_ENV as AppConfig['env']) || 'development',
    port: Number(process.env.PORT) || 3000,
    name: process.env.APP_NAME || 'My App',
    version: process.env.npm_package_version || '1.0.0',
    logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
  };
}

export function createDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
  };
}

export function createRedisConfig(): RedisConfig {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB) || 0,
  };
}

/**
 * Example: Using configuration types
 */
export function configExample() {
  const appConfig = createAppConfig();
  const dbConfig = createDatabaseConfig();
  const redisConfig = createRedisConfig();

  console.log('\nApp Configuration:');
  console.log(`  Environment: ${appConfig.env}`);
  console.log(`  Port: ${appConfig.port}`);
  console.log(`  Name: ${appConfig.name}`);
  console.log(`  Version: ${appConfig.version}`);
  console.log(`  Log Level: ${appConfig.logLevel}`);

  console.log('\nDatabase Configuration:');
  console.log(`  Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`  Database: ${dbConfig.name}`);
  console.log(`  SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);

  console.log('\nRedis Configuration:');
  console.log(`  Host: ${redisConfig.host}:${redisConfig.port}`);
  console.log(`  Database: ${redisConfig.db}`);

  return { appConfig, dbConfig, redisConfig };
}

// =============================================================================
// Example 7: Custom Type Guards
// =============================================================================

/**
 * Example: User role type guard
 */
export function isAdmin(user: BaseUser): user is BaseUser & { role: 'admin' } {
  return user.role === 'admin';
}

export function isModerator(user: BaseUser): user is BaseUser & { role: 'moderator' } {
  return user.role === 'moderator';
}

/**
 * Example: Using type guards
 */
export function checkUserPermissions(user: BaseUser) {
  if (isAdmin(user)) {
    console.log(`${user.name} is an admin with full access`);
    return 'full';
  }

  if (isModerator(user)) {
    console.log(`${user.name} is a moderator with limited admin access`);
    return 'limited';
  }

  console.log(`${user.name} is a regular user`);
  return 'read';
}

/**
 * Example: Entity type guard
 */
export function isSoftDeleted<T extends SoftDeletableEntity>(
  entity: T
): entity is T & { deletedAt: Date; isDeleted: true } {
  return entity.isDeleted === true && entity.deletedAt !== undefined;
}

/**
 * Example: Using entity type guard
 */
export function filterActiveArticles(articles: Article[]): Article[] {
  return articles.filter(article => !isSoftDeleted(article));
}

// =============================================================================
// Example 8: Generic Utility Types
// =============================================================================

/**
 * Example: Repository pattern with generic types
 */
export class Repository<T extends BaseEntity> {
  private items: T[] = [];

  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    const item = {
      ...data,
      id: `${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T;

    this.items.push(item);
    return item;
  }

  async findById(id: string): Promise<T | null> {
    return this.items.find(item => item.id === id) || null;
  }

  async findAll(): Promise<T[]> {
    return [...this.items];
  }

  async update(id: string, updates: Partial<Omit<T, keyof BaseEntity>>): Promise<T | null> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.items[index] = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.items[index] as T;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.items.splice(index, 1);
    return true;
  }
}

/**
 * Example: Using generic repository
 */
export async function repositoryExample() {
  interface BlogPost extends BaseEntity {
    title: string;
    content: string;
    authorId: string;
  }

  const postRepo = new Repository<BlogPost>();

  // Create
  const post = await postRepo.create({
    title: 'My First Post',
    content: 'Hello, World!',
    authorId: 'user-123',
  });
  console.log('\nCreated post:', post);

  // Find
  const found = await postRepo.findById(post.id);
  console.log('Found post:', found);

  // Update
  const updated = await postRepo.update(post.id, {
    title: 'My Updated Post',
  });
  console.log('Updated post:', updated);

  // List all
  const allPosts = await postRepo.findAll();
  console.log('All posts:', allPosts.length);

  return { post, updated, allPosts };
}

// =============================================================================
// Example 9: Advanced Type Patterns
// =============================================================================

/**
 * Example: Discriminated unions for different response types
 */
type LoadingState = { status: 'loading' };
type SuccessState<T> = { status: 'success'; data: T };
type ErrorState = { status: 'error'; error: string };

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

export function handleAsyncState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'loading':
      console.log('Loading...');
      break;

    case 'success':
      // TypeScript knows state.data exists here
      console.log('Success:', state.data);
      break;

    case 'error':
      // TypeScript knows state.error exists here
      console.error('Error:', state.error);
      break;
  }
}

/**
 * Example: Type-safe event handlers
 */
type EventHandler<T> = (payload: T) => void | Promise<void>;

export class TypedEventBus {
  private handlers = new Map<string, EventHandler<unknown>[]>();

  on<T>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler as EventHandler<unknown>);
    this.handlers.set(event, handlers);
  }

  async emit<T>(event: string, payload: T): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    await Promise.all(handlers.map(handler => handler(payload)));
  }
}

/**
 * Example: Using typed event bus
 */
export async function eventBusExample() {
  const bus = new TypedEventBus();

  // Register typed handler
  bus.on<UserCreatedPayload>('user:created', async (payload) => {
    console.log(`New user: ${payload.name} (${payload.email})`);
  });

  // Emit typed event
  await bus.emit<UserCreatedPayload>('user:created', {
    userId: 'user-123',
    email: 'john@example.com',
    name: 'John Doe',
  });
}

// =============================================================================
// Example 10: Putting It All Together
// =============================================================================

/**
 * Example: Complete type-safe API endpoint
 */
export async function completeApiEndpointExample() {
  // Define request/response types
  interface CreateUserRequest {
    name: string;
    email: string;
    role?: UserRole;
  }

  interface UserResponse extends BaseUser {
    // Additional fields
  }

  // Type-safe endpoint handler
  async function createUser(
    req: CreateUserRequest
  ): Promise<ApiResponse<UserResponse>> {
    try {
      // Validate input (would use validation library in real code)
      if (!req.name || !req.email) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Missing required fields',
          { fields: { name: !req.name, email: !req.email } }
        );
      }

      // Create user
      const user: UserResponse = {
        id: `user-${Date.now()}`,
        name: req.name,
        email: req.email,
        role: req.role || 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Emit domain event
      const emitter = new EventEmitter();
      emitter.emit<UserCreatedPayload>('user.created', {
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return successResponse(user, 'User created successfully');
    } catch (error) {
      return errorResponse(
        'INTERNAL_ERROR',
        'Failed to create user',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  // Usage
  const response = await createUser({
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'admin',
  });

  if (isSuccessResponse(response)) {
    console.log('\nUser created successfully:');
    console.log(`  ID: ${response.data.id}`);
    console.log(`  Name: ${response.data.name}`);
    console.log(`  Email: ${response.data.email}`);
    console.log(`  Role: ${response.data.role}`);
  } else if (isErrorResponse(response)) {
    console.error('\nFailed to create user:');
    console.error(`  Error: ${response.error.message}`);
  }

  return response;
}
