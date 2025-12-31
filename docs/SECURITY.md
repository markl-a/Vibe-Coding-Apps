# Security Policy and Guidelines

## Table of Contents

- [Security Policy Overview](#security-policy-overview)
- [Authentication Best Practices](#authentication-best-practices)
- [Authorization Patterns](#authorization-patterns)
- [Data Protection](#data-protection)
- [CORS Configuration](#cors-configuration)
- [Input Validation](#input-validation)
- [SQL Injection Prevention](#sql-injection-prevention)
- [XSS Prevention](#xss-prevention)
- [CSRF Protection](#csrf-protection)
- [Security Headers](#security-headers)
- [Rate Limiting](#rate-limiting)
- [Dependency Security](#dependency-security)
- [Environment Variables](#environment-variables)
- [Reporting Vulnerabilities](#reporting-vulnerabilities)

---

## Security Policy Overview

This document outlines the security practices and guidelines for the Vibe Coding Apps project. All contributors and users should follow these guidelines to maintain a secure application environment.

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal access rights for users and services
3. **Secure by Default**: Security features enabled by default
4. **Zero Trust**: Verify everything, trust nothing
5. **Security Awareness**: Continuous monitoring and updates

---

## Authentication Best Practices

### Password Requirements

Our authentication system enforces strong password policies using the `@vibe/shared-utils` validation utilities:

```typescript
import { validatePassword } from '@vibe/shared-utils';

const result = validatePassword(password, {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minScore: 3
});
```

**Password Requirements:**
- Minimum 8 characters (recommended: 12+)
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;':",./<>?)
- No sequential patterns (123, abc)
- No repeated characters (aaa, 111)

### Password Hashing

Use bcrypt with a minimum of 12 salt rounds:

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

// Verify password
const isValid = await bcrypt.compare(password, passwordHash);
```

**Never:**
- Store passwords in plain text
- Log passwords or password hashes
- Send passwords over unencrypted connections
- Use weak hashing algorithms (MD5, SHA1)

### Session Management

#### JWT Best Practices

```typescript
// .env configuration
JWT_SECRET=[GENERATE_WITH: openssl rand -base64 32]
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=[GENERATE_WITH: openssl rand -base64 32]
```

**JWT Configuration:**
- Use strong, randomly generated secrets (minimum 32 bytes)
- Set appropriate expiration times:
  - Access tokens: 15 minutes - 1 hour
  - Refresh tokens: 7-30 days
- Include only necessary claims in the payload
- Never store sensitive data in JWT payload (it's base64 encoded, not encrypted)

**Implementation Example:**

```typescript
import { JwtService } from '@nestjs/jwt';

const payload = {
  username: user.username,
  sub: user.id,
  role: user.role
};

const access_token = this.jwtService.sign(payload, {
  expiresIn: '1h',
  secret: process.env.JWT_SECRET
});
```

#### Token Storage

- **Client-side:**
  - Use httpOnly cookies for refresh tokens
  - Store access tokens in memory or sessionStorage
  - Never use localStorage for sensitive tokens

- **Server-side:**
  - Implement token revocation lists for critical operations
  - Use Redis or similar for blacklisting revoked tokens

### OAuth/OIDC Integration

When integrating third-party authentication:

1. **Use established libraries:**
   - NextAuth.js for Next.js applications
   - Passport.js for Node.js/Express applications
   - NestJS Passport strategies for NestJS applications

2. **Validate redirect URIs:**
   - Whitelist allowed callback URLs
   - Validate state parameters to prevent CSRF

3. **Secure token exchange:**
   - Use PKCE (Proof Key for Code Exchange) for OAuth 2.0
   - Validate ID tokens properly
   - Store tokens securely

**Example with NextAuth.js:**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
};
```

---

## Authorization Patterns

### Role-Based Access Control (RBAC)

The project implements RBAC using TypeORM enums and NestJS guards:

```typescript
// User roles enumeration
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  USER = 'user',
}

// User entity
@Entity('users')
export class User {
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
}
```

### Permission Management

#### Guards Implementation

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler()
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

#### Usage in Controllers

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles(UserRole.ADMIN)
  getAllUsers() {
    // Only accessible by admins
  }

  @Get('content')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  getContent() {
    // Accessible by admins and editors
  }
}
```

### Resource Ownership Validation

Use the `checkOwnership` middleware from `@vibe/shared-utils`:

```typescript
import { checkOwnership } from '@vibe/shared-utils';

router.put(
  '/posts/:id',
  authenticateUser,
  loadResource('Post'),
  checkOwnership('authorId'), // Verify user owns the resource
  updatePost
);
```

---

## Data Protection

### Encryption at Rest

#### Database Encryption

- Use encrypted database connections (SSL/TLS)
- Enable encryption at rest for production databases
- Encrypt sensitive fields before storing

```typescript
// PostgreSQL with SSL
const postgresConfig = {
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./ca-certificate.crt').toString(),
  } : false,
};
```

#### Field-Level Encryption

For highly sensitive data (e.g., SSN, credit cards):

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Encryption in Transit

- **Always use HTTPS in production**
- Enable HSTS (HTTP Strict Transport Security)
- Use TLS 1.2 or higher
- Configure secure cipher suites

```typescript
import { securityHeaders } from '@vibe/shared-utils';

app.use(securityHeaders({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));
```

### PII Handling

**Personally Identifiable Information (PII) Guidelines:**

1. **Data Minimization:**
   - Collect only necessary PII
   - Delete PII when no longer needed
   - Anonymize data for analytics

2. **Access Control:**
   - Restrict PII access to authorized personnel
   - Log all PII access
   - Implement data masking for non-production environments

3. **Data Classification:**
   ```typescript
   // Example: Mask sensitive data in logs
   function maskEmail(email: string): string {
     const [local, domain] = email.split('@');
     return `${local.slice(0, 2)}***@${domain}`;
   }

   function maskPhone(phone: string): string {
     return phone.replace(/\d(?=\d{4})/g, '*');
   }

   logger.info('User registered', {
     email: maskEmail(user.email),
     phone: maskPhone(user.phone)
   });
   ```

4. **Data Retention:**
   - Implement retention policies
   - Provide user data export (GDPR compliance)
   - Enable account deletion

### Data Sanitization

Always sanitize user input before storage and display:

```typescript
import { sanitizeUserInput, sanitizeHTML, sanitizeXSS } from '@vibe/shared-utils';

// For plain text (no HTML allowed)
const sanitizedText = sanitizeUserInput(userInput, {
  allowHTML: false,
  maxLength: 1000,
  stripWhitespace: true
});

// For rich text content
const sanitizedHTML = sanitizeHTML(userHTML, {
  allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
  allowedAttributes: {
    'a': ['href', 'title'],
  }
});
```

---

## CORS Configuration

Use the secure CORS utilities from `@vibe/shared-utils`:

### Basic Configuration

```typescript
import cors from 'cors';
import { createCorsConfig } from '@vibe/shared-utils';

// Using environment variables
app.use(cors(createCorsConfig()));

// Or with explicit origins
app.use(cors(createCorsConfig({
  origin: ['https://app.example.com', 'https://admin.example.com']
})));
```

### CORS Presets

```typescript
import { corsPresets } from '@vibe/shared-utils';

// Development mode
if (process.env.NODE_ENV === 'development') {
  app.use(cors(createCorsConfig(corsPresets.development())));
}

// Production - strict mode
if (process.env.NODE_ENV === 'production') {
  app.use(cors(createCorsConfig(corsPresets.strict([
    'https://app.example.com'
  ]))));
}

// Public API mode
app.use(cors(createCorsConfig(corsPresets.api([
  'https://partner1.com',
  'https://partner2.com'
]))));
```

### Wildcard Subdomains

```typescript
app.use(cors(createCorsConfig({
  origin: ['*.example.com', 'https://app.example.com']
})));
```

### Socket.io CORS

```typescript
import { Server } from 'socket.io';
import { createCorsConfig } from '@vibe/shared-utils';

const io = new Server(server, {
  cors: createCorsConfig({
    origin: process.env.CORS_ORIGINS?.split(',') || []
  })
});
```

**CORS Best Practices:**
- Never use `*` (wildcard) in production
- Always specify exact origins
- Enable credentials only when necessary
- Set appropriate `maxAge` for preflight caching
- Validate origins dynamically for multi-tenant applications

---

## Input Validation

### Validation Utilities

The project provides comprehensive validation utilities in `@vibe/shared-utils`:

```typescript
import {
  isEmail,
  isURL,
  isPhoneNumber,
  isUUID,
  validatePassword,
  isAlphanumeric,
  isUsername,
  hasLength
} from '@vibe/shared-utils';

// Email validation
if (!isEmail(email)) {
  throw new Error('Invalid email format');
}

// URL validation
if (!isURL(website, { protocols: ['https'] })) {
  throw new Error('Invalid URL or must use HTTPS');
}

// Username validation
if (!isUsername(username, { minLength: 3, maxLength: 20 })) {
  throw new Error('Invalid username');
}
```

### Schema Validation

Use Zod or class-validator for request validation:

```typescript
import { z } from 'zod';
import { validateBody } from '@vibe/shared-utils';

// Define schema
const createUserSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().min(18).max(120)
});

// Apply middleware
router.post('/users', validateBody(createUserSchema), createUser);
```

### File Upload Validation

```typescript
import { hasExtension } from '@vibe/shared-utils';

// Validate file types
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateUpload(file: Express.Multer.File) {
  if (!hasExtension(file.originalname, ALLOWED_IMAGE_TYPES)) {
    throw new Error('Invalid file type');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }

  // Validate MIME type (don't trust file extension alone)
  if (!file.mimetype.startsWith('image/')) {
    throw new Error('Invalid file type');
  }
}
```

---

## SQL Injection Prevention

### Use Parameterized Queries

**Always use parameterized queries or ORM methods:**

```typescript
// ✅ GOOD - Using TypeORM
const user = await userRepository.findOne({
  where: { email: userEmail }
});

// ✅ GOOD - Using parameterized query
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
);

// ❌ BAD - String concatenation
const result = await db.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### Query Builder

```typescript
// ✅ GOOD - Using query builder
const posts = await postRepository
  .createQueryBuilder('post')
  .where('post.authorId = :authorId', { authorId: userId })
  .andWhere('post.status = :status', { status: 'published' })
  .getMany();
```

### Sanitization (Last Resort)

Only use as an additional layer, not a replacement for parameterized queries:

```typescript
import { sanitizeSQL, hasSQLInjection } from '@vibe/shared-utils';

// Check for SQL injection patterns
if (hasSQLInjection(userInput)) {
  throw new Error('Invalid input detected');
}

// Sanitize SQL input (still use parameterized queries!)
const sanitized = sanitizeSQL(userInput);
```

**Best Practices:**
- Use ORM/query builders (TypeORM, Prisma, Sequelize)
- Never trust user input
- Use prepared statements
- Implement least privilege database access
- Regularly audit database queries

---

## XSS Prevention

### Content Sanitization

Use the XSS sanitization utilities from `@vibe/shared-utils`:

```typescript
import { sanitizeXSS, sanitizeHTML, stripHTML } from '@vibe/shared-utils';

// Remove all HTML and encode entities
const safeText = sanitizeXSS(userInput);

// Allow specific HTML tags
const safeHTML = sanitizeHTML(userContent, {
  allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
  allowedAttributes: {
    'a': ['href', 'title', 'target']
  },
  allowedProtocols: ['http', 'https']
});

// Strip all HTML tags
const plainText = stripHTML(htmlContent);
```

### Context-Aware Output Encoding

```typescript
// For HTML context
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// For JavaScript context
function escapeJS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// For URL context
function escapeURL(str: string): string {
  return encodeURIComponent(str);
}
```

### React/JSX (Built-in Protection)

React automatically escapes content:

```tsx
// ✅ Safe - React escapes by default
<div>{userInput}</div>

// ⚠️ Dangerous - Bypasses XSS protection
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe - Use sanitization
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userInput)
}} />
```

### Content Security Policy

See [Security Headers](#security-headers) section for CSP configuration.

---

## CSRF Protection

### CSRF Token Implementation

**For traditional server-rendered apps:**

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/submit', csrfProtection, (req, res) => {
  // Process form
});
```

**In HTML forms:**

```html
<form method="POST" action="/submit">
  <input type="hidden" name="_csrf" value="{{csrfToken}}">
  <!-- form fields -->
</form>
```

### SameSite Cookies

```typescript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // or 'lax'
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### Double Submit Cookie Pattern

```typescript
// Generate CSRF token
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Set token in cookie and return to client
const csrfToken = generateCSRFToken();
res.cookie('XSRF-TOKEN', csrfToken, {
  httpOnly: false, // Client needs to read this
  secure: true,
  sameSite: 'strict'
});

// Verify token on protected routes
function verifyCSRFToken(req: Request, res: Response, next: NextFunction) {
  const tokenFromCookie = req.cookies['XSRF-TOKEN'];
  const tokenFromHeader = req.headers['x-xsrf-token'];

  if (!tokenFromCookie || tokenFromCookie !== tokenFromHeader) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}
```

### API Token Authentication

For SPA/API applications using JWTs:

```typescript
// Custom origin verification
app.use((req, res, next) => {
  const origin = req.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  if (req.method !== 'GET' && !allowedOrigins.includes(origin || '')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
});
```

**CSRF Best Practices:**
- Use SameSite cookies when possible
- Implement CSRF tokens for state-changing operations
- Verify Origin and Referer headers
- Use custom request headers for AJAX requests
- Don't rely on cookies alone for authentication in SPAs

---

## Security Headers

Use the security headers middleware from `@vibe/shared-utils`:

### Basic Configuration

```typescript
import { securityHeaders } from '@vibe/shared-utils';

app.use(securityHeaders());
```

### Security Header Presets

```typescript
import { securityPresets } from '@vibe/shared-utils';

// Strict mode (for APIs)
app.use(securityHeaders(securityPresets.strict()));

// Web application mode
app.use(securityHeaders(securityPresets.web()));

// Development mode (relaxed)
if (process.env.NODE_ENV === 'development') {
  app.use(securityHeaders(securityPresets.development()));
}
```

### Custom Configuration

```typescript
app.use(securityHeaders({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:", "blob:"],
      "font-src": ["'self'", "https://fonts.googleapis.com"],
      "connect-src": ["'self'", "https://api.example.com"],
      "frame-ancestors": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"]
    }
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000,        // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameGuard: 'deny',         // or 'sameorigin'

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions-Policy
  permissionsPolicy: {
    camera: ["'none'"],
    microphone: ["'none'"],
    geolocation: ["'self'"],
    payment: ["'none'"]
  }
}));
```

### Headers Explained

| Header | Purpose | Recommended Value |
|--------|---------|-------------------|
| `Content-Security-Policy` | Prevents XSS by controlling resource loading | See custom config above |
| `Strict-Transport-Security` | Forces HTTPS connections | `max-age=31536000; includeSubDomains; preload` |
| `X-Frame-Options` | Prevents clickjacking | `DENY` or `SAMEORIGIN` |
| `X-Content-Type-Options` | Prevents MIME sniffing | `nosniff` |
| `X-XSS-Protection` | Browser XSS filter | `1; mode=block` |
| `Referrer-Policy` | Controls referrer information | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Controls browser features | Disable unused features |

### Using Helmet (Alternative)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## Rate Limiting

Protect your APIs from abuse using the rate limiting utilities:

### Basic Rate Limiting

```typescript
import { rateLimit, rateLimitPresets } from '@vibe/shared-utils';

// Standard API rate limiting (60 requests/minute)
app.use('/api/', rateLimitPresets.standard());

// Strict rate limiting for auth endpoints (5 attempts/15 minutes)
app.use('/api/auth/login', rateLimitPresets.strict());

// Relaxed for public APIs (200 requests/minute)
app.use('/api/public', rateLimitPresets.relaxed());
```

### Custom Rate Limiting

```typescript
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Max 100 requests per window
  message: 'Too many requests from this IP',

  // Custom key generator (per user + IP)
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}`;
  },

  // Skip rate limiting for certain conditions
  skip: (req) => {
    return req.user?.role === 'admin';
  },

  // Callback when limit is reached
  onLimitReached: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      user: req.user?.id
    });
  }
}));
```

### Rate Limiting by Endpoint

```typescript
// Different limits for different endpoints
app.post('/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  loginHandler
);

app.post('/api/posts',
  rateLimit({ windowMs: 60 * 1000, max: 10 }),
  createPost
);

app.get('/api/posts',
  rateLimit({ windowMs: 60 * 1000, max: 100 }),
  getPosts
);
```

### Rate Limiting Headers

The rate limiter automatically sets these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
Retry-After: 300 (when limit exceeded)
```

### Production Rate Limiting

For production, use Redis for distributed rate limiting:

```typescript
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    client: client,
    prefix: 'rl:',
  }),
});

app.use('/api/', limiter);
```

---

## Dependency Security

### npm Audit

Regularly check for vulnerabilities in dependencies:

```bash
# Check for vulnerabilities
npm audit

# Automatically fix vulnerabilities
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force

# View detailed audit report
npm audit --json
```

### Automated Dependency Updates

Use Dependabot or Renovate Bot for automated security updates:

**`.github/dependabot.yml`:**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    versioning-strategy: increase
    labels:
      - "dependencies"
      - "security"
    reviewers:
      - "security-team"
```

### Lock Files

Always commit lock files to ensure consistent dependencies:

```bash
# For npm
git add package-lock.json

# For pnpm
git add pnpm-lock.yaml

# For yarn
git add yarn.lock
```

### Dependency Scanning in CI/CD

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Check for known vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Best Practices

1. **Regular Updates:**
   - Review and update dependencies monthly
   - Prioritize security patches
   - Test updates in development first

2. **Vulnerability Management:**
   - Set up alerts for security advisories
   - Maintain an inventory of all dependencies
   - Document acceptable risk levels

3. **Dependency Policies:**
   - Avoid deprecated packages
   - Prefer well-maintained packages
   - Minimize dependency count
   - Use exact versions for production

4. **Tools:**
   - `npm audit` / `yarn audit` / `pnpm audit`
   - Snyk
   - Dependabot
   - WhiteSource/Mend
   - Socket.dev

---

## Environment Variables

### Secret Management

**Never commit secrets to version control:**

```bash
# .gitignore
.env
.env.local
.env.production
*.pem
*.key
secrets/
```

### Environment File Template

Use `.env.example` as a template:

```bash
# .env.example
# Copy this file to .env and fill in the values

# ⚠️ SECURITY: Never use default values in production!
# Generate secrets with: openssl rand -base64 32

# Database
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DB]
DB_PASSWORD=[GENERATE_SECURE_PASSWORD]

# Security - MUST be generated, minimum 32 characters
JWT_SECRET=[GENERATE_WITH: openssl rand -base64 32]
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=[GENERATE_WITH: openssl rand -base64 32]
ENCRYPTION_KEY=[GENERATE_WITH: openssl rand -hex 32]

# CORS - whitelist only trusted domains
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Node Environment
NODE_ENV=development
```

### Generating Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 32

# Generate random password
openssl rand -base64 24
```

### Environment Variable Validation

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string(),
  CORS_ORIGINS: z.string().transform(s => s.split(',')),
});

// Validate on startup
const env = envSchema.parse(process.env);

export default env;
```

### Production Secret Management

Use dedicated secret management services:

1. **AWS Secrets Manager**
2. **HashiCorp Vault**
3. **Azure Key Vault**
4. **Google Cloud Secret Manager**
5. **Doppler**
6. **Infisical**

**Example with AWS Secrets Manager:**

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: 'us-east-1' });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  return response.SecretString || '';
}

// Usage
const jwtSecret = await getSecret('prod/jwt-secret');
```

### Environment-Specific Configuration

```typescript
// config/index.ts
const config = {
  development: {
    logLevel: 'debug',
    corsOrigins: ['http://localhost:3000'],
  },
  production: {
    logLevel: 'error',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
  },
  test: {
    logLevel: 'silent',
    corsOrigins: ['http://localhost:3001'],
  },
};

export default config[process.env.NODE_ENV || 'development'];
```

---

## Reporting Vulnerabilities

We take security seriously. If you discover a security vulnerability, please follow these guidelines:

### Reporting Process

1. **Do NOT open a public issue**
2. **Email security concerns to:** security@example.com (replace with your actual security contact)
3. **Include in your report:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)
   - Your contact information

### Response Timeline

- **Initial Response:** Within 24-48 hours
- **Status Update:** Within 7 days
- **Fix Target:** Critical issues within 30 days

### Disclosure Policy

- We follow coordinated disclosure
- Public disclosure after fix is deployed
- Credit given to reporters (if desired)
- We do not take legal action against good-faith security researchers

### Vulnerability Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **Critical** | Remote code execution, data breach, authentication bypass | 24-48 hours |
| **High** | Privilege escalation, SQL injection, XSS | 7 days |
| **Medium** | Information disclosure, CSRF | 30 days |
| **Low** | Minor issues, best practice violations | 90 days |

### Security Hall of Fame

We maintain a hall of fame for security researchers who have responsibly disclosed vulnerabilities (with their permission).

### Bug Bounty Program

_(If applicable)_ We offer rewards for qualifying security vulnerabilities:

- **Critical:** $500 - $2000
- **High:** $200 - $500
- **Medium:** $50 - $200
- **Low:** Recognition

### Contact Information

- **Security Email:** security@example.com
- **PGP Key:** Available at https://example.com/.well-known/security.txt
- **Security Page:** https://example.com/security

### Security Advisory Template

When reporting, please use this template:

```markdown
## Vulnerability Summary
[Brief description]

## Affected Components
- Component: [Name]
- Version: [Version]
- Environment: [Production/Staging/Development]

## Vulnerability Details
[Detailed description]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Proof of Concept
[Code, screenshots, or commands]

## Impact Assessment
[What an attacker could do]

## Suggested Remediation
[Your recommendations]

## Additional Information
[Any other relevant details]
```

---

## Security Checklist

Use this checklist for security reviews:

### Authentication & Authorization
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] JWT secrets are strong and environment-specific
- [ ] Token expiration times are appropriate
- [ ] RBAC implemented for protected resources
- [ ] Session management is secure
- [ ] Password reset flows are secure

### Data Protection
- [ ] Database connections use SSL/TLS
- [ ] Sensitive data encrypted at rest
- [ ] All traffic uses HTTPS in production
- [ ] PII handling complies with regulations
- [ ] Secure file upload validation

### Input Validation & Output Encoding
- [ ] All user input validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitization + CSP)
- [ ] CSRF protection implemented
- [ ] File upload validation

### Infrastructure Security
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't include secrets

### Dependency Management
- [ ] Dependencies regularly updated
- [ ] No known vulnerabilities (npm audit)
- [ ] Lock files committed
- [ ] Automated security scanning in CI/CD

### Environment & Secrets
- [ ] Secrets not committed to Git
- [ ] Environment variables validated
- [ ] Production secrets in secret manager
- [ ] `.env.example` up to date

### Monitoring & Response
- [ ] Security logging enabled
- [ ] Intrusion detection configured
- [ ] Incident response plan documented
- [ ] Security contacts published

---

## Additional Resources

### Official Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Tools
- [Snyk](https://snyk.io/) - Dependency scanning
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Vulnerability scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing
- [Burp Suite](https://portswigger.net/burp) - Web security testing

### Standards & Compliance
- [PCI DSS](https://www.pcisecuritystandards.org/) - Payment card security
- [GDPR](https://gdpr.eu/) - Data protection (EU)
- [SOC 2](https://www.aicpa.org/soc) - Security controls
- [HIPAA](https://www.hhs.gov/hipaa) - Healthcare data (US)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-31 | Initial security documentation |

---

**Last Updated:** 2025-12-31
**Maintained By:** Security Team
**Review Frequency:** Quarterly
