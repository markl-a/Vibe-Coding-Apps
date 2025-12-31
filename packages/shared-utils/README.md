# @vibe/shared-utils

A comprehensive utility library for Vibe-Coding-Apps projects, providing common utilities, middleware, and tools for building robust Node.js applications.

## Installation

```bash
pnpm add @vibe/shared-utils
```

## Overview

This package provides a wide range of utilities organized into focused modules:

- **Basic Utilities**: String, array, object, date, async, and validation helpers
- **Security**: CORS configuration, security headers, and protection middleware
- **Error Handling**: Type-safe error utilities and standardized error classes
- **Caching**: Redis-backed caching with decorators and strategies
- **Database**: Connection helpers and health checks for MongoDB, PostgreSQL, and Redis
- **Monitoring**: Metrics collection, distributed tracing, and alerting
- **Documentation**: Swagger/OpenAPI setup for Express and NestJS
- **Health Checks**: Kubernetes-ready health check endpoints
- **Logging**: HTTP request/response logging with correlation IDs
- **Rate Limiting**: API rate limiting middleware

---

## Available Modules

### Security (`security/`)

Secure your application with CORS configuration and HTTP security headers.

**Exports:**
- `createCorsConfig(options)` - Create secure CORS configuration
- `corsPresets` - Predefined CORS configurations (strict, development, api)
- `securityHeaders(options)` - Security headers middleware
- `securityPresets` - Predefined security configurations

**Example: CORS Configuration**

```typescript
import express from 'express';
import cors from 'cors';
import { createCorsConfig, corsPresets } from '@vibe/shared-utils';

const app = express();

// Use predefined development preset
app.use(cors(createCorsConfig(corsPresets.development())));

// Or create custom configuration
app.use(cors(createCorsConfig({
  origin: ['https://example.com', 'https://app.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})));

// Wildcard subdomain support
app.use(cors(createCorsConfig({
  origin: ['*.example.com'],
  credentials: true,
})));
```

**Example: Security Headers**

```typescript
import { securityHeaders, securityPresets } from '@vibe/shared-utils';

// Use preset configurations
app.use(securityHeaders(securityPresets.web()));

// Or customize security headers
app.use(securityHeaders({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameGuard: 'deny'
}));
```

---

### Error Handling (`errors/`)

Type-safe error handling utilities with standardized error classes.

**Exports:**
- `getErrorMessage(error, fallback?)` - Extract message from unknown errors
- `getErrorInfo(error)` - Extract full error information
- `AppError` - Base application error class
- `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `RateLimitError` - Specific error types
- `errorHandler` - Express error handling middleware
- `asyncHandler` - Async route wrapper

**Example: Error Utilities**

```typescript
import { getErrorMessage, getErrorInfo } from '@vibe/shared-utils';

try {
  await someAsyncOperation();
} catch (error: unknown) {
  // Safely extract error message
  const message = getErrorMessage(error, 'Operation failed');
  console.error(message);

  // Get full error info
  const errorInfo = getErrorInfo(error);
  console.error(errorInfo);
}
```

**Example: Error Classes**

```typescript
import {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  errorHandler,
  asyncHandler
} from '@vibe/shared-utils';

// Use specific error classes
app.post('/users', asyncHandler(async (req, res) => {
  if (!req.body.email) {
    throw new ValidationError('Email is required', {
      field: 'email',
      value: req.body.email
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User');
  }

  if (!req.user) {
    throw new AuthenticationError();
  }

  res.json({ success: true, data: user });
}));

// Add error handler middleware (must be last)
app.use(errorHandler);
```

---

### Cache (`cache/`)

Redis-backed caching with in-memory fallback, decorators, and advanced strategies.

**Exports:**
- `CacheManager` - Main cache manager class
- `getDefaultCacheManager()`, `setDefaultCacheManager()` - Global cache instance
- Decorators: `@Cacheable`, `@CacheEvict`, `@CachePut`, `@Memoize`, `withCache`, `cached`, `BatchCache`
- Strategies: `CacheAsideStrategy`, `WriteThroughStrategy`, `WriteBehindStrategy`, `RefreshAheadStrategy`
- Invalidation: `TagBasedInvalidation`, `EventBasedInvalidation`, `DependencyBasedInvalidation`

**Example: Basic Caching**

```typescript
import { CacheManager } from '@vibe/shared-utils';

const cache = new CacheManager({
  redisUrl: 'redis://localhost:6379',
  defaultTTL: 3600,
  enableMemoryFallback: true,
  keyPrefix: 'myapp:',
});

await cache.connect();

// Set and get
await cache.set('user:123', { name: 'John' }, 3600);
const user = await cache.get('user:123');

// Check existence
const exists = await cache.has('user:123');

// Get TTL
const ttl = await cache.ttl('user:123');

// Delete
await cache.delete('user:123');

// Stats
console.log('Hit rate:', cache.getHitRate());
```

**Example: Decorators**

```typescript
import { Cacheable, CacheEvict, CachePut, Memoize } from '@vibe/shared-utils';

class UserService {
  @Cacheable({ ttl: 3600, keyPrefix: 'user' })
  async getUser(id: string) {
    return await db.users.findById(id);
  }

  @CachePut({ ttl: 3600, keyPrefix: 'user' })
  async updateUser(id: string, data: any) {
    return await db.users.update(id, data);
  }

  @CacheEvict({ keyPrefix: 'user' })
  async deleteUser(id: string) {
    return await db.users.delete(id);
  }

  @Memoize()
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}
```

---

### Database (`database/`)

Database connection helpers and health checks for MongoDB, PostgreSQL, and Redis.

**Exports:**
- `mongodbOptions` - Optimized MongoDB connection options
- `postgresPoolConfig` - PostgreSQL connection pool configuration
- `redisConfig` - Redis connection configuration
- `buildMongoUri(config)` - Build MongoDB connection string
- `buildPostgresUri(config)` - Build PostgreSQL connection string
- `checkDatabaseHealth(connection)` - Database health checker

**Example: MongoDB Connection**

```typescript
import mongoose from 'mongoose';
import { mongodbOptions, buildMongoUri } from '@vibe/shared-utils';

const uri = buildMongoUri({
  host: 'localhost',
  port: 27017,
  database: 'myapp',
  user: 'admin',
  password: 'password',
  authSource: 'admin'
});

await mongoose.connect(uri, mongodbOptions);
```

**Example: Health Checks**

```typescript
import { checkDatabaseHealth } from '@vibe/shared-utils';

const health = await checkDatabaseHealth(mongoose.connection);
console.log(health); // { healthy: true, message: 'Database connected' }
```

---

### Monitoring (`monitoring/`)

Comprehensive monitoring with metrics, distributed tracing, and alerting.

**Exports:**
- Metrics: `MetricsRegistry`, `createHttpMetrics`, `createDatabaseMetrics`, `createSystemMetrics`, `defaultRegistry`
- Tracing: `configureTracer`, `trace`, `traceAsync`, `traceHttp`, `traceDatabase`
- Alerts: `AlertManager`, `defaultAlertManager`, `alert()`, `createCommonAlertRules()`

**Example: HTTP Metrics**

```typescript
import express from 'express';
import { createHttpMetrics } from '@vibe/shared-utils';

const app = express();
const httpMetrics = createHttpMetrics();

// Add metrics middleware
app.use(httpMetrics.middleware());

// Expose metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await httpMetrics.registry.metrics());
});
```

**Example: Distributed Tracing**

```typescript
import { configureTracer, trace, traceHttp } from '@vibe/shared-utils';

// Configure tracer
configureTracer({
  serviceName: 'my-service',
  serviceVersion: '1.0.0',
});

// Trace HTTP requests
app.use(traceHttp());

// Trace async functions
async function processOrder(orderId: string) {
  return await trace('processOrder', { orderId }, async (span) => {
    // Your processing logic
    span.setAttribute('order.status', 'processing');
    return await database.processOrder(orderId);
  });
}
```

---

### Documentation (`docs/`)

Swagger/OpenAPI documentation setup for Express and NestJS applications.

**Exports:**
- `createOpenAPIConfig(config)` - Create OpenAPI configuration
- `setupExpressSwagger(app, options)` - Setup Swagger for Express
- `setupNestSwagger(app, options)` - Setup Swagger for NestJS
- `CommonErrorResponses` - Standard error response schemas
- `SwaggerDecorators` - JSDoc helpers
- `CommonTags` - Predefined API tags

**Example: Express Swagger Setup**

```typescript
import express from 'express';
import { setupExpressSwagger, CommonTags } from '@vibe/shared-utils';

const app = express();

setupExpressSwagger(app, {
  title: 'My API',
  description: 'API documentation for My App',
  version: '1.0.0',
  tags: [CommonTags.Authentication, CommonTags.Users, CommonTags.Health],
  security: {
    bearer: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Development' },
    { url: 'https://api.example.com', description: 'Production' },
  ],
});

// Swagger UI available at: http://localhost:3001/api-docs
```

---

### Health Checks (`health/`)

Kubernetes-ready health check endpoints with custom health checkers.

**Exports:**
- `createHealthRouter(options)` - Create health check router
- `healthCheckers` - Predefined health checkers (mongodb, redis, memory)

**Example: Health Check Setup**

```typescript
import express from 'express';
import { createHealthRouter, healthCheckers } from '@vibe/shared-utils';
import mongoose from 'mongoose';
import redis from './redis';

const app = express();

const healthRouter = createHealthRouter({
  version: '1.0.0',
  checks: {
    mongodb: healthCheckers.mongodb(mongoose),
    redis: healthCheckers.redis(redis),
    memory: healthCheckers.memory(512),
    custom: async () => {
      // Custom health check
      const isHealthy = await checkSomething();
      return isHealthy
        ? { status: 'pass', message: 'Custom check passed' }
        : { status: 'fail', message: 'Custom check failed' };
    }
  }
});

app.use(healthRouter);

// Endpoints:
// GET /health - Simple liveness probe
// GET /health/ready - Detailed readiness probe with all checks
```

---

### Logging (`logging/`)

HTTP request/response logging with correlation IDs for request tracking.

**Exports:**
- `correlationId` - Correlation ID middleware
- `generateCorrelationId()`, `getCorrelationId()` - Correlation ID helpers
- `requestLogger`, `responseLogger`, `httpLogger` - HTTP logging middleware
- `sanitize`, `sanitizeHeaders` - Data sanitization utilities

**Example: HTTP Logging**

```typescript
import express from 'express';
import { correlationId, httpLogger } from '@vibe/shared-utils';

const app = express();

// Add correlation ID to all requests
app.use(correlationId());

// Log all HTTP requests and responses
app.use(httpLogger({
  includeRequestBody: true,
  includeResponseBody: false,
  sanitize: true, // Remove sensitive data
}));
```

---

### Rate Limiting (`rateLimit/`)

API rate limiting middleware with customizable rules.

**Exports:**
- `rateLimit(options)` - Create rate limit middleware
- `rateLimitPresets` - Predefined configurations (standard, strict, relaxed, auth)

**Example: Rate Limiting**

```typescript
import express from 'express';
import { rateLimit, rateLimitPresets } from '@vibe/shared-utils';

const app = express();

// Apply standard rate limiting to all routes
app.use(rateLimitPresets.standard());

// Strict rate limiting for authentication endpoints
app.post('/auth/login',
  rateLimitPresets.auth(),
  async (req, res) => {
    // Login logic
  }
);

// Custom rate limit
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  keyGenerator: (req) => req.ip || 'unknown',
}));
```

---

## Basic Utilities

### String Utilities

```typescript
import { capitalize, kebabCase, camelCase, pascalCase, truncate, randomString } from '@vibe/shared-utils';

capitalize('hello'); // 'Hello'
kebabCase('helloWorld'); // 'hello-world'
camelCase('hello-world'); // 'helloWorld'
pascalCase('hello-world'); // 'HelloWorld'
truncate('Hello World', 8); // 'Hello...'
randomString(10); // 'aB3dE5fG7h'
```

### Array Utilities

```typescript
import { unique, chunk, shuffle, groupBy, intersection, difference } from '@vibe/shared-utils';

unique([1, 2, 2, 3]); // [1, 2, 3]
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4]
groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}], 'type');
intersection([1, 2, 3], [2, 3, 4]); // [2, 3]
difference([1, 2, 3], [2, 3, 4]); // [1]
```

### Object Utilities

```typescript
import { deepClone, pick, omit, isEmpty, deepMerge } from '@vibe/shared-utils';

const obj = { a: 1, b: { c: 2 } };
deepClone(obj);
pick(obj, ['a']); // { a: 1 }
omit(obj, ['a']); // { b: { c: 2 } }
isEmpty({}); // true
deepMerge({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }
```

### Date Utilities

```typescript
import { formatISO, formatDate, timeAgo, addDays, isValidDate } from '@vibe/shared-utils';

formatISO(new Date());
formatDate(new Date()); // '2025年11月19日'
timeAgo(new Date(Date.now() - 60000)); // '1 分鐘前'
addDays(new Date(), 7);
isValidDate(new Date()); // true
```

### Validation Utilities

```typescript
import { isEmail, isURL, isPhoneTW, isUUID, isJSON, isStrongPassword } from '@vibe/shared-utils';

isEmail('test@example.com'); // true
isURL('https://example.com'); // true
isPhoneTW('0912345678'); // true
isUUID('550e8400-e29b-41d4-a716-446655440000'); // true
isJSON('{"key": "value"}'); // true
isStrongPassword('Abc123!@#'); // true
```

### Async Utilities

```typescript
import { sleep, retry, debounce, throttle, timeout } from '@vibe/shared-utils';

await sleep(1000); // Sleep for 1 second
await retry(() => fetch('/api'), { retries: 3, delay: 1000 });

const debouncedFn = debounce(() => console.log('Called'), 500);
const throttledFn = throttle(() => console.log('Called'), 1000);

await timeout(fetch('/api'), 5000); // Timeout after 5 seconds
```

---

## Complete Example: Express Application

Here's a complete example showing how to use multiple utilities together:

```typescript
import express from 'express';
import cors from 'cors';
import {
  // Security
  createCorsConfig,
  corsPresets,
  securityHeaders,
  securityPresets,

  // Error handling
  errorHandler,
  asyncHandler,
  NotFoundError,

  // Health checks
  createHealthRouter,
  healthCheckers,

  // Logging
  correlationId,
  httpLogger,

  // Rate limiting
  rateLimitPresets,

  // Monitoring
  createHttpMetrics,

  // Documentation
  setupExpressSwagger,
  CommonTags,
} from '@vibe/shared-utils';

const app = express();

// Security
app.use(cors(createCorsConfig(corsPresets.development())));
app.use(securityHeaders(securityPresets.web()));

// Logging and tracking
app.use(correlationId());
app.use(httpLogger());

// Rate limiting
app.use(rateLimitPresets.standard());

// Metrics
const metrics = createHttpMetrics();
app.use(metrics.middleware());

// Health checks
app.use(createHealthRouter({
  version: '1.0.0',
  checks: {
    memory: healthCheckers.memory(512),
  }
}));

// Swagger documentation
setupExpressSwagger(app, {
  title: 'My API',
  description: 'API documentation',
  version: '1.0.0',
  tags: [CommonTags.Health, CommonTags.Users],
});

// Routes
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.users.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User');
  }
  res.json({ success: true, data: user });
}));

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await metrics.registry.metrics());
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log('Swagger UI: http://localhost:3001/api-docs');
  console.log('Health: http://localhost:3001/health');
  console.log('Metrics: http://localhost:3001/metrics');
});
```

---

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## Peer Dependencies

Some modules require optional peer dependencies:

- **Cache**: `ioredis` or `redis` for Redis support
- **Monitoring**: `express` for HTTP metrics
- **Documentation**: `swagger-ui-express` and `swagger-jsdoc` for Express, or `@nestjs/swagger` for NestJS
- **React utilities**: `react` for React hooks and components

Install only what you need:

```bash
# For Redis caching
pnpm add ioredis

# For Express Swagger
pnpm add swagger-ui-express swagger-jsdoc

# For NestJS Swagger
pnpm add @nestjs/swagger
```

## License

MIT
