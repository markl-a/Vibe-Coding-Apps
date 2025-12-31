/**
 * Security Examples
 * Demonstrates CORS setup, rate limiting, and security headers
 */

import { Request, Response, NextFunction } from 'express';
import {
  createCorsConfig,
  corsPresets,
  securityHeaders,
  securityPresets,
  rateLimit,
  rateLimitPresets,
} from '@vibe/shared-utils';

// =============================================================================
// Example 1: CORS Configuration
// =============================================================================

/**
 * Example: Basic CORS setup
 */
export function basicCorsExample() {
  // Simple CORS config allowing specific origins
  const corsConfig = createCorsConfig({
    origin: ['https://example.com', 'https://app.example.com'],
    credentials: true,
  });

  console.log('Basic CORS Config:', corsConfig);

  // Usage with Express:
  // import cors from 'cors';
  // app.use(cors(corsConfig));
}

/**
 * Example: Development CORS (allow localhost)
 */
export function developmentCorsExample() {
  const devCors = createCorsConfig(corsPresets.development());

  console.log('\nDevelopment CORS Config:');
  console.log('Allowed origins:', devCors);

  // Usage:
  // app.use(cors(devCors));
}

/**
 * Example: Production CORS with strict origins
 */
export function productionCorsExample() {
  const prodOrigins = [
    'https://myapp.com',
    'https://www.myapp.com',
    'https://api.myapp.com',
  ];

  const prodCors = createCorsConfig(corsPresets.strict(prodOrigins));

  console.log('\nProduction CORS Config:');
  console.log('Strict mode with allowed origins:', prodOrigins);

  // Usage:
  // app.use(cors(prodCors));

  return prodCors;
}

/**
 * Example: CORS with wildcard subdomains
 */
export function wildcardSubdomainCorsExample() {
  const corsConfig = createCorsConfig({
    origin: [
      'https://example.com',
      '*.example.com', // Allows any subdomain
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  console.log('\nWildcard Subdomain CORS:');
  console.log('Config:', corsConfig);

  // This will allow:
  // - https://example.com
  // - https://app.example.com
  // - https://api.example.com
  // - etc.
}

/**
 * Example: Custom CORS validation function
 */
export function customCorsValidationExample() {
  const corsConfig = createCorsConfig({
    origin: (origin: string | undefined) => {
      // Custom logic to validate origins
      if (!origin) return true; // Allow requests with no origin (mobile apps, etc.)

      // Check if origin matches allowed pattern
      const allowedPatterns = [
        /^https:\/\/.*\.example\.com$/,
        /^http:\/\/localhost:\d+$/,
      ];

      return allowedPatterns.some(pattern => pattern.test(origin));
    },
    credentials: true,
  });

  console.log('\nCustom CORS Validation:');
  console.log('Using dynamic origin validation function');

  return corsConfig;
}

/**
 * Example: CORS for public API
 */
export function publicApiCorsExample() {
  const apiCors = createCorsConfig(corsPresets.api([
    'https://partner1.com',
    'https://partner2.com',
  ]));

  console.log('\nPublic API CORS:');
  console.log('Allowing specific partners without credentials');

  return apiCors;
}

// =============================================================================
// Example 2: Security Headers
// =============================================================================

/**
 * Example: Basic security headers
 */
export function basicSecurityHeadersExample() {
  const middleware = securityHeaders();

  console.log('\nBasic Security Headers Middleware:');
  console.log('Sets default security headers including:');
  console.log('  - X-XSS-Protection');
  console.log('  - X-Content-Type-Options');
  console.log('  - X-Frame-Options');
  console.log('  - Strict-Transport-Security');
  console.log('  - Content-Security-Policy');

  // Usage:
  // app.use(securityHeaders());

  return middleware;
}

/**
 * Example: Strict security headers for production
 */
export function strictSecurityHeadersExample() {
  const strictHeaders = securityHeaders(securityPresets.strict());

  console.log('\nStrict Security Headers:');
  console.log('Maximum security for production API');

  // Usage:
  // app.use(strictHeaders);

  return strictHeaders;
}

/**
 * Example: Web application security headers
 */
export function webAppSecurityHeadersExample() {
  const webHeaders = securityHeaders(securityPresets.web());

  console.log('\nWeb Application Security Headers:');
  console.log('Balanced security for web apps with CSP');

  // Usage:
  // app.use(webHeaders);

  return webHeaders;
}

/**
 * Example: Custom Content Security Policy
 */
export function customCSPExample() {
  const customCSP = securityHeaders({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.example.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'connect-src': ["'self'", 'https://api.example.com', 'wss://ws.example.com'],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
      },
    },
  });

  console.log('\nCustom Content Security Policy:');
  console.log('Allows specific trusted sources for scripts, styles, fonts, etc.');

  return customCSP;
}

/**
 * Example: HSTS configuration
 */
export function hstsConfigExample() {
  const hstsHeaders = securityHeaders({
    hsts: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true,
    },
  });

  console.log('\nHSTS Configuration:');
  console.log('Enforces HTTPS for 2 years, including subdomains');
  console.log('Eligible for HSTS preload list');

  // To submit to HSTS preload list: https://hstspreload.org/

  return hstsHeaders;
}

/**
 * Example: Permissions Policy
 */
export function permissionsPolicyExample() {
  const permissionsHeaders = securityHeaders({
    permissionsPolicy: {
      'camera': ['self'],
      'microphone': ['self'],
      'geolocation': ['self', 'https://maps.example.com'],
      'payment': ['self'],
      'usb': [], // Deny all
      'interest-cohort': [], // Block FLoC
    },
  });

  console.log('\nPermissions Policy:');
  console.log('Controls browser features like camera, microphone, location, etc.');

  return permissionsHeaders;
}

/**
 * Example: Development security headers (relaxed)
 */
export function developmentSecurityHeadersExample() {
  const devHeaders = securityHeaders(securityPresets.development());

  console.log('\nDevelopment Security Headers:');
  console.log('Relaxed settings for local development');
  console.log('WARNING: Do not use in production!');

  return devHeaders;
}

// =============================================================================
// Example 3: Rate Limiting
// =============================================================================

/**
 * Example: Basic rate limiting
 */
export function basicRateLimitExample() {
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 60, // 60 requests per window
    message: 'Too many requests, please try again later.',
  });

  console.log('\nBasic Rate Limiting:');
  console.log('60 requests per minute per IP');

  // Usage:
  // app.use('/api', limiter);

  return limiter;
}

/**
 * Example: Standard API rate limiting
 */
export function standardApiRateLimitExample() {
  const apiLimiter = rateLimitPresets.standard();

  console.log('\nStandard API Rate Limit:');
  console.log('60 requests per minute (standard preset)');

  // Usage:
  // app.use('/api', apiLimiter);

  return apiLimiter;
}

/**
 * Example: Strict rate limiting for sensitive endpoints
 */
export function strictRateLimitExample() {
  const authLimiter = rateLimitPresets.strict();

  console.log('\nStrict Rate Limit for Auth:');
  console.log('5 attempts per 15 minutes');

  // Usage:
  // app.post('/auth/login', authLimiter, loginHandler);
  // app.post('/auth/register', authLimiter, registerHandler);

  return authLimiter;
}

/**
 * Example: Custom rate limit by user ID
 */
export function userBasedRateLimitExample() {
  const userLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req: Request) => {
      // Rate limit by user ID instead of IP
      return (req as any).user?.id || req.ip || 'anonymous';
    },
    message: 'You have exceeded the rate limit for your account.',
  });

  console.log('\nUser-Based Rate Limiting:');
  console.log('100 requests per minute per user account');

  return userLimiter;
}

/**
 * Example: Skip rate limiting for authenticated users
 */
export function skipAuthenticatedRateLimitExample() {
  const selectiveLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    skip: (req: Request) => {
      // Skip rate limiting for authenticated users
      return !!(req as any).user;
    },
    message: 'Anonymous users are limited to 20 requests per minute. Please sign in for unlimited access.',
  });

  console.log('\nSelective Rate Limiting:');
  console.log('Limits anonymous users but allows unlimited for authenticated users');

  return selectiveLimiter;
}

/**
 * Example: Rate limit with custom response
 */
export function customRateLimitResponseExample() {
  const customLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    onLimitReached: (req: Request, res: Response) => {
      console.log(`Rate limit exceeded for IP: ${req.ip}`);
      // Could log to monitoring service, send alert, etc.
    },
  });

  console.log('\nCustom Rate Limit Response:');
  console.log('Logs when rate limit is exceeded');

  return customLimiter;
}

/**
 * Example: Different rate limits for different endpoints
 */
export function multiTierRateLimitExample() {
  const limits = {
    // Generous limit for read operations
    read: rateLimit({
      windowMs: 60 * 1000,
      max: 200,
    }),

    // Moderate limit for write operations
    write: rateLimit({
      windowMs: 60 * 1000,
      max: 50,
    }),

    // Strict limit for sensitive operations
    sensitive: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
    }),

    // Very strict for authentication
    auth: rateLimitPresets.auth(),
  };

  console.log('\nMulti-Tier Rate Limiting:');
  console.log('  Read:      200/min');
  console.log('  Write:     50/min');
  console.log('  Sensitive: 5/15min');
  console.log('  Auth:      Custom auth preset');

  // Usage:
  // app.get('/api/users', limits.read, getUsersHandler);
  // app.post('/api/users', limits.write, createUserHandler);
  // app.delete('/api/users/:id', limits.sensitive, deleteUserHandler);
  // app.post('/auth/login', limits.auth, loginHandler);

  return limits;
}

// =============================================================================
// Example 4: Complete Security Setup
// =============================================================================

/**
 * Example: Production-ready security middleware setup
 */
export function completeSecuritySetupExample() {
  console.log('\n=== Complete Production Security Setup ===\n');

  // 1. CORS Configuration
  const corsConfig = createCorsConfig({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://myapp.com', 'https://www.myapp.com']
      : corsPresets.development().origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // 2. Security Headers
  const secHeaders = securityHeaders(
    process.env.NODE_ENV === 'production'
      ? securityPresets.web()
      : securityPresets.development()
  );

  // 3. Rate Limiting
  const rateLimits = {
    api: rateLimit({
      windowMs: 60 * 1000,
      max: process.env.NODE_ENV === 'production' ? 60 : 1000,
      keyGenerator: (req: Request) => (req as any).user?.id || req.ip || 'anonymous',
    }),
    auth: rateLimitPresets.auth(),
    strict: rateLimitPresets.strict(),
  };

  console.log('Security Configuration:');
  console.log('  Environment:', process.env.NODE_ENV || 'development');
  console.log('  CORS:', corsConfig ? 'Configured' : 'Not configured');
  console.log('  Security Headers:', secHeaders ? 'Enabled' : 'Disabled');
  console.log('  Rate Limiting:', Object.keys(rateLimits).join(', '));

  return {
    cors: corsConfig,
    headers: secHeaders,
    rateLimit: rateLimits,
  };
}

/**
 * Example: Express app with all security middleware
 */
export function secureExpressAppExample() {
  // This is a conceptual example showing how to set up all security middleware
  const setup = `
import express from 'express';
import cors from 'cors';
import {
  createCorsConfig,
  securityHeaders,
  securityPresets,
  rateLimit,
  rateLimitPresets,
} from '@vibe/shared-utils';

const app = express();

// 1. CORS - Must be first
app.use(cors(createCorsConfig({
  origin: ['https://myapp.com'],
  credentials: true,
})));

// 2. Security Headers
app.use(securityHeaders(securityPresets.web()));

// 3. Rate Limiting - Apply globally or per route
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use('/api', apiLimiter);

// 4. Strict rate limiting for auth endpoints
const authLimiter = rateLimitPresets.auth();
app.post('/auth/login', authLimiter, loginHandler);
app.post('/auth/register', authLimiter, registerHandler);

// 5. Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Your routes here...
app.get('/api/users', getUsersHandler);
app.post('/api/users', createUserHandler);

app.listen(3000, () => {
  console.log('Secure server running on port 3000');
});
  `;

  console.log('\n=== Secure Express App Setup ===\n');
  console.log(setup);
}

// =============================================================================
// Example 5: Security Best Practices
// =============================================================================

/**
 * Security checklist and best practices
 */
export function securityBestPractices() {
  const checklist = `
=== Security Best Practices Checklist ===

1. CORS Configuration
   ✓ Explicitly list allowed origins (no wildcards in production)
   ✓ Enable credentials only when necessary
   ✓ Restrict allowed methods and headers
   ✓ Use environment variables for origin configuration

2. Security Headers
   ✓ Enable HSTS with includeSubDomains and preload
   ✓ Set strong Content Security Policy
   ✓ Use X-Frame-Options to prevent clickjacking
   ✓ Enable X-Content-Type-Options: nosniff
   ✓ Configure Permissions-Policy to limit browser features

3. Rate Limiting
   ✓ Apply different limits for different endpoints
   ✓ Strict limits (5-10 attempts) for authentication
   ✓ Moderate limits (50-100 requests/min) for API endpoints
   ✓ Consider user-based limits instead of IP-based
   ✓ Log rate limit violations for security monitoring

4. Additional Security Measures
   ✓ Use HTTPS in production (TLS 1.2 or higher)
   ✓ Validate and sanitize all user inputs
   ✓ Use parameterized queries to prevent SQL injection
   ✓ Implement proper authentication and authorization
   ✓ Keep dependencies up to date
   ✓ Enable request logging and monitoring
   ✓ Set up intrusion detection
   ✓ Regular security audits and penetration testing
   ✓ Implement proper error handling (don't leak info)
   ✓ Use security-focused linting (e.g., eslint-plugin-security)

5. Environment-Specific
   Development:
     - Relaxed CORS for localhost
     - Disabled CSP or relaxed rules
     - Higher rate limits or disabled
     - Detailed error messages

   Production:
     - Strict CORS with explicit origins
     - Full CSP implementation
     - Appropriate rate limits
     - Generic error messages
     - HSTS enabled
     - All security headers enabled

6. Monitoring & Response
   ✓ Log security events (rate limit hits, auth failures, etc.)
   ✓ Set up alerts for suspicious activity
   ✓ Have an incident response plan
   ✓ Regular security log reviews
   ✓ Automated vulnerability scanning
  `;

  console.log(checklist);
}

/**
 * Example: Security middleware order matters!
 */
export function middlewareOrderExample() {
  const explanation = `
=== Middleware Order in Express ===

Correct Order:
1. CORS (must be first to handle preflight requests)
2. Security Headers
3. Rate Limiting (general)
4. Body Parsers (json, urlencoded)
5. Authentication Middleware
6. Request Logging
7. Route-specific rate limiting
8. Your route handlers
9. Error handling middleware (must be last)

Example:
  app.use(cors(corsConfig));                    // 1. CORS first
  app.use(securityHeaders());                   // 2. Security headers
  app.use('/api', rateLimit({ max: 100 }));    // 3. General rate limit
  app.use(express.json());                      // 4. Body parsing
  app.use(authMiddleware);                      // 5. Authentication
  app.use(requestLogger);                       // 6. Logging
  app.post('/auth/login',                       // 7. Route-specific limit
    rateLimit({ max: 5 }),
    loginHandler
  );
  app.use(errorHandler);                        // 8. Error handling last
  `;

  console.log(explanation);
}

// =============================================================================
// Example 6: Security Headers Testing
// =============================================================================

/**
 * Helper to test security headers
 */
export function testSecurityHeaders(headers: Record<string, string>) {
  console.log('\n=== Security Headers Test ===\n');

  const checks = {
    'X-XSS-Protection': headers['X-XSS-Protection'] === '1; mode=block',
    'X-Content-Type-Options': headers['X-Content-Type-Options'] === 'nosniff',
    'X-Frame-Options': ['DENY', 'SAMEORIGIN'].includes(headers['X-Frame-Options'] || ''),
    'Strict-Transport-Security': headers['Strict-Transport-Security']?.includes('max-age='),
    'Content-Security-Policy': !!headers['Content-Security-Policy'],
    'Referrer-Policy': !!headers['Referrer-Policy'],
  };

  Object.entries(checks).forEach(([header, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${header}: ${headers[header] || 'Not set'}`);
  });

  const allPassed = Object.values(checks).every(v => v);
  console.log(`\nOverall: ${allPassed ? '✓ All security headers configured' : '⚠️  Some headers missing'}`);

  return { checks, allPassed };
}
