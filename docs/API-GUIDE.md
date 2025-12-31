# API Development Guide

Comprehensive reference guide for API patterns and conventions used across the Vibe Coding Apps project.

---

## Table of Contents

- [REST API Conventions](#rest-api-conventions)
- [Authentication Patterns](#authentication-patterns)
- [Pagination](#pagination)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Versioning](#api-versioning)
- [GraphQL Patterns](#graphql-patterns)
- [Security Best Practices](#security-best-practices)
- [Request/Response Examples](#requestresponse-examples)

---

## REST API Conventions

### Endpoint Naming Patterns

Use resource-based, plural nouns for endpoints:

```
✅ Good
GET    /api/v1/employees
GET    /api/v1/employees/:id
POST   /api/v1/employees
PUT    /api/v1/employees/:id
DELETE /api/v1/employees/:id

❌ Bad
GET    /api/v1/getEmployees
POST   /api/v1/createEmployee
GET    /api/v1/employee/:id
```

### Nested Resources

For related resources, use nested paths:

```
GET    /api/v1/articles/:id/comments      # Get comments for an article
POST   /api/v1/articles/:id/comments      # Add a comment to an article
POST   /api/v1/articles/:id/like          # Like an article
GET    /api/v1/employees/:id/attendance   # Get employee's attendance records
```

### HTTP Methods Usage

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resources | Yes | Yes |
| POST | Create new resources | No | No |
| PUT | Update/replace entire resource | Yes | No |
| PATCH | Partially update resource | No | No |
| DELETE | Remove resource | Yes | No |

### Standard HTTP Status Codes

Use these status codes consistently:

#### Success Codes (2xx)
- **200 OK**: Successful GET, PUT, PATCH requests
- **201 Created**: Successful POST request that creates a resource
- **204 No Content**: Successful DELETE request

#### Client Error Codes (4xx)
- **400 Bad Request**: Invalid request data or validation error
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict (e.g., duplicate email)
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded

#### Server Error Codes (5xx)
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Invalid response from upstream server
- **503 Service Unavailable**: Service temporarily unavailable

---

## Authentication Patterns

### JWT Token Format

The project uses JWT (JSON Web Tokens) with separate access and refresh tokens:

**Token Structure:**
```typescript
{
  userId: string,
  email: string,
  type: 'access' | 'refresh'
}
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

### Header Requirements

**Authorization Header:**
```http
Authorization: Bearer <access_token>
```

**Example:**
```http
GET /api/v1/employees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token Flow

Refresh tokens are stored in HTTP-only cookies for security:

```http
POST /auth/refresh
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└─────┬────┘                                    └─────┬────┘
      │                                               │
      │  POST /auth/login                             │
      │  { email, password }                          │
      │──────────────────────────────────────────────>│
      │                                               │
      │  200 OK                                       │
      │  { accessToken, user }                        │
      │  Set-Cookie: refreshToken                     │
      │<──────────────────────────────────────────────│
      │                                               │
      │  GET /api/v1/employees                        │
      │  Authorization: Bearer {accessToken}          │
      │──────────────────────────────────────────────>│
      │                                               │
      │  200 OK                                       │
      │  { data, total, page, limit }                 │
      │<──────────────────────────────────────────────│
      │                                               │
      │  (Access token expires)                       │
      │                                               │
      │  POST /auth/refresh                           │
      │  Cookie: refreshToken                         │
      │──────────────────────────────────────────────>│
      │                                               │
      │  200 OK                                       │
      │  { accessToken, expiresIn }                   │
      │  Set-Cookie: refreshToken (rotated)           │
      │<──────────────────────────────────────────────│
```

### Token Rotation

For security, refresh tokens are rotated (replaced) on each use:

1. Client sends refresh token
2. Server validates and revokes old refresh token
3. Server generates new access + refresh tokens
4. Server returns new access token and sets new refresh token in cookie

### Logout Flow

```http
POST /auth/logout
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

Both tokens are revoked to prevent reuse.

---

## Pagination

### Query Parameters

Use consistent query parameters for pagination:

```
GET /api/v1/employees?page=1&limit=10
GET /api/v1/articles?page=2&limit=20
```

**Parameters:**
- `page`: Page number (1-indexed, default: 1)
- `limit`: Items per page (default: 10)
- `search`: Optional search query
- `filter`: Optional filter parameters

### Response Structure

Return pagination metadata along with data:

```json
{
  "data": [
    {
      "id": "123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

### Pagination Headers

Include pagination info in response headers:

```http
X-Total-Count: 150
X-Page: 1
X-Page-Size: 10
Link: <https://api.example.com/employees?page=2&limit=10>; rel="next",
      <https://api.example.com/employees?page=15&limit=10>; rel="last"
```

---

## Error Handling

### Standardized Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "details": {
      "field": "email",
      "reason": "Email already exists"
    }
  }
}
```

### Error Codes

Use semantic error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid credentials |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Validation Errors

For validation errors, include field-level details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Email must be a valid email address"
        },
        {
          "field": "password",
          "message": "Password must be at least 6 characters"
        }
      ]
    }
  }
}
```

### Custom Error Classes

The project provides standard error classes:

```typescript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
} from '@vibe/shared-utils';

// Usage
throw new ValidationError('Invalid email format', {
  field: 'email',
  value: providedEmail
});

throw new NotFoundError('Employee');
throw new AuthenticationError();
throw new AuthorizationError('Admin access required');
```

### Development vs Production

**Development:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Cannot read property 'name' of undefined",
    "stack": "TypeError: Cannot read property 'name' of undefined\n    at..."
  }
}
```

**Production:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

Stack traces are only included in development environments.

---

## Rate Limiting

### Rate Limit Policies

Different endpoints have different rate limits:

| Endpoint Type | Window | Max Requests |
|---------------|--------|--------------|
| Standard API | 1 minute | 60 requests |
| Authentication | 15 minutes | 10 requests |
| Strict (login/register) | 15 minutes | 5 requests |
| Public/Relaxed | 1 minute | 200 requests |

### Rate Limit Headers

All rate-limited responses include headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642234800
```

### Rate Limit Exceeded Response

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 120
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642234800

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later.",
    "retryAfter": 120
  }
}
```

### Implementation

**Using Express:**
```typescript
import { rateLimit, rateLimitPresets } from '@vibe/shared-utils';

// Standard rate limiting
app.use('/api/', rateLimitPresets.standard());

// Strict rate limiting for auth endpoints
app.use('/auth/login', rateLimitPresets.strict());

// Custom rate limiting
app.use('/api/public', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.ip || 'unknown'
}));
```

**Using NestJS:**
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 60,
    }),
  ],
})
export class AppModule {}
```

---

## API Versioning

### Global Prefix Versioning

Use URL path versioning with global prefix:

```typescript
// NestJS
app.setGlobalPrefix('api/v1');

// Express
app.use('/api/v1', routes);
```

**Result:**
```
/api/v1/employees
/api/v1/articles
/api/v1/auth/login
```

### Version Strategy

- **v1**: Current stable version
- **v2**: Major breaking changes
- Maintain previous version for at least 6 months
- Deprecation warnings in headers

### Deprecation Headers

When deprecating an endpoint:

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Fri, 30 Jun 2025 23:59:59 GMT
Link: <https://api.example.com/v2/employees>; rel="alternate"

{
  "data": [...],
  "warning": "This API version is deprecated. Please migrate to v2."
}
```

### Version-Specific Changes

Document breaking changes:

```markdown
## v2 Breaking Changes

- `/employees` endpoint now requires `departmentId`
- `created_at` renamed to `createdAt` (camelCase)
- Pagination defaults changed: limit 10 → 20
- Authentication now requires refresh token rotation
```

---

## GraphQL Patterns

### Schema Definition

Use GraphQL Schema Definition Language:

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: String!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  comments: [Comment!]!
  published: Boolean!
  createdAt: String!
  updatedAt: String!
}

type Query {
  posts(limit: Int, offset: Int): [Post!]!
  post(id: ID!): Post
  searchPosts(query: String!): [Post!]!
  me: User
}

type Mutation {
  createPost(title: String!, content: String!): Post!
  updatePost(id: ID!, title: String, content: String): Post!
  deletePost(id: ID!): Boolean!
}

type AuthPayload {
  token: String!
  user: User!
}
```

### Resolver Pattern

Implement resolvers with proper error handling:

```javascript
const resolvers = {
  Query: {
    posts: async (parent, { limit = 10, offset = 0 }) => {
      return await Post.find()
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },

    me: async (parent, args, { user }) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      return user;
    },
  },

  Mutation: {
    createPost: async (parent, { title, content }, { user }) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      return await Post.create({
        title,
        content,
        author: user.id
      });
    },
  },

  // Field resolvers with DataLoader
  Post: {
    author: async (parent, args, { loaders }) => {
      return await loaders.userLoader.load(parent.author);
    },
    comments: async (parent, args, { loaders }) => {
      return await loaders.commentsByPostLoader.load(parent.id);
    }
  },
};
```

### DataLoader Pattern

Use DataLoader to solve N+1 query problems:

```javascript
import DataLoader from 'dataloader';

const createLoaders = () => ({
  userLoader: new DataLoader(async (userIds) => {
    const users = await User.find({ _id: { $in: userIds } });
    return userIds.map(id =>
      users.find(user => user.id === id)
    );
  }),

  commentsByPostLoader: new DataLoader(async (postIds) => {
    const comments = await Comment.find({
      post: { $in: postIds }
    });
    return postIds.map(id =>
      comments.filter(comment => comment.post === id)
    );
  }),
});
```

### GraphQL Error Handling

Use standard GraphQL error codes:

```javascript
import { GraphQLError } from 'graphql';

// Unauthenticated
throw new GraphQLError('Not authenticated', {
  extensions: { code: 'UNAUTHENTICATED' }
});

// Forbidden
throw new GraphQLError('Not authorized', {
  extensions: { code: 'FORBIDDEN' }
});

// Bad user input
throw new GraphQLError('Email already in use', {
  extensions: { code: 'BAD_USER_INPUT' }
});

// Not found
throw new GraphQLError('Post not found', {
  extensions: { code: 'NOT_FOUND' }
});
```

### GraphQL Context

Pass authentication and loaders via context:

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = token ? await authenticateUser(token) : null;

    return {
      user,
      loaders: createLoaders(),
    };
  },
});
```

---

## Security Best Practices

### CORS Configuration

Use secure CORS settings:

```typescript
import { createCorsConfig } from '@vibe/shared-utils';

// Strict production CORS
app.use(cors(createCorsConfig({
  origin: ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})));

// Development CORS
app.use(cors(createCorsConfig({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
})));
```

### Security Headers

Apply security headers to all responses:

```typescript
import { securityHeaders } from '@vibe/shared-utils';

// Strict security for APIs
app.use(securityHeaders({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'none'"],
      "frame-ancestors": ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameGuard: 'deny',
}));
```

### Input Validation

Always validate and sanitize input:

```typescript
// Using Zod
import { z } from 'zod';

const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().min(1),
  baseSalary: z.number().positive().optional(),
});

// Using class-validator (NestJS)
import { IsString, IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### Password Security

- Hash passwords with bcrypt (minimum 10 rounds)
- Never return passwords in responses
- Enforce minimum password length (6+ characters)
- Consider password strength requirements

### Token Security

- Store refresh tokens in HTTP-only cookies
- Use secure flag in production (HTTPS only)
- Implement token rotation
- Revoke tokens on logout
- Use short expiry for access tokens (15 minutes)

---

## Request/Response Examples

### Authentication

#### Register User

**Request:**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Set-Cookie: refreshToken=eyJhbGci...; HttpOnly; Secure; SameSite=Strict
Content-Type: application/json

{
  "user": {
    "id": "123",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

#### Login

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=eyJhbGci...; HttpOnly; Secure; SameSite=Strict
Content-Type: application/json

{
  "user": {
    "id": "123",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

#### Refresh Token

**Request:**
```http
POST /auth/refresh
Cookie: refreshToken=eyJhbGci...
```

**Response:**
```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=eyJhbGci...; HttpOnly; Secure; SameSite=Strict

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### CRUD Operations

#### Create Resource

**Request:**
```http
POST /api/v1/employees
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "position": "Software Engineer",
  "departmentId": "dept-123",
  "hireDate": "2025-01-15T00:00:00.000Z",
  "baseSalary": 75000
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "emp-456",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "position": "Software Engineer",
  "departmentId": "dept-123",
  "hireDate": "2025-01-15T00:00:00.000Z",
  "baseSalary": 75000,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

#### List Resources with Pagination

**Request:**
```http
GET /api/v1/employees?page=1&limit=10&search=engineer&department=dept-123
Authorization: Bearer eyJhbGci...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "id": "emp-456",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "position": "Software Engineer"
    },
    {
      "id": "emp-789",
      "firstName": "Bob",
      "lastName": "Johnson",
      "email": "bob@example.com",
      "position": "Senior Engineer"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### Get Single Resource

**Request:**
```http
GET /api/v1/employees/emp-456
Authorization: Bearer eyJhbGci...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "emp-456",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "position": "Software Engineer",
  "department": {
    "id": "dept-123",
    "name": "Engineering"
  },
  "hireDate": "2025-01-15T00:00:00.000Z",
  "baseSalary": 75000,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

#### Update Resource

**Request:**
```http
PUT /api/v1/employees/emp-456
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "position": "Senior Software Engineer",
  "baseSalary": 85000
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "emp-456",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "position": "Senior Software Engineer",
  "baseSalary": 85000,
  "updatedAt": "2025-01-16T14:20:00.000Z"
}
```

#### Delete Resource

**Request:**
```http
DELETE /api/v1/employees/emp-456
Authorization: Bearer eyJhbGci...
```

**Response:**
```http
HTTP/1.1 204 No Content
```

### File Upload

**Request:**
```http
POST /api/v1/employees/import
Authorization: Bearer eyJhbGci...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="employees.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[binary data]
------WebKitFormBoundary--
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "imported": 45,
  "failed": 2,
  "errors": [
    {
      "row": 12,
      "error": "Invalid email format"
    },
    {
      "row": 23,
      "error": "Department not found"
    }
  ]
}
```

### GraphQL Query

**Request:**
```http
POST /graphql
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "query": "query GetPosts($limit: Int!) { posts(limit: $limit) { id title author { name email } comments { content author { name } } } }",
  "variables": {
    "limit": 10
  }
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "posts": [
      {
        "id": "1",
        "title": "Getting Started with GraphQL",
        "author": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "comments": [
          {
            "content": "Great post!",
            "author": {
              "name": "Jane Smith"
            }
          }
        ]
      }
    ]
  }
}
```

### Error Responses

#### Validation Error

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Email must be a valid email address"
        },
        {
          "field": "baseSalary",
          "message": "Salary must be a positive number"
        }
      ]
    }
  }
}
```

#### Authentication Error

**Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid or expired token",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Not Found Error

**Response:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Employee not found",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Rate Limit Error

**Response:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 120
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642234800
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later.",
    "retryAfter": 120,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Quick Reference

### Common Headers

```http
# Request Headers
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
X-Request-ID: unique-request-id

# Response Headers
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642234800
X-Request-ID: unique-request-id
```

### Pagination Template

```javascript
// Request
GET /api/v1/resource?page=1&limit=10

// Response
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

### Error Template

```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "details": {}
  }
}
```

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# JWT
ACCESS_TOKEN_SECRET=your-secret-here
REFRESH_TOKEN_SECRET=your-secret-here

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [REST API Design Best Practices](https://restfulapi.net/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Last Updated:** 2025-01-15
