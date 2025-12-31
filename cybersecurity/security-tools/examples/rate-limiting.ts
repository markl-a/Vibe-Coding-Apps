/**
 * Rate Limiting Implementation Example
 *
 * This example demonstrates various rate limiting strategies to protect
 * against abuse, brute-force attacks, and DDoS attacks:
 * 1. Fixed Window Rate Limiting
 * 2. Sliding Window Rate Limiting
 * 3. Token Bucket Algorithm
 * 4. Leaky Bucket Algorithm
 * 5. Concurrent Request Limiting
 *
 * Use Cases:
 * - API rate limiting
 * - Login attempt limiting (brute-force protection)
 * - Password reset request limiting
 * - File upload rate limiting
 * - Search query rate limiting
 * - Email sending rate limiting
 *
 * Security Best Practices:
 * 1. Implement rate limiting at multiple layers (API, auth, resources)
 * 2. Use different limits for different endpoints
 * 3. Rate limit by IP, user, API key, or combination
 * 4. Return appropriate HTTP status codes (429 Too Many Requests)
 * 5. Include Retry-After header in responses
 * 6. Log rate limit violations for security monitoring
 * 7. Implement exponential backoff for repeated violations
 */

// Type definitions
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;  // Seconds until retry allowed
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;      // Time window in milliseconds
  message?: string;
}

interface TokenBucketConfig {
  capacity: number;      // Maximum tokens
  refillRate: number;    // Tokens per second
  refillInterval: number; // Refill interval in ms
}

/**
 * Fixed Window Rate Limiter
 * Simplest rate limiting algorithm
 *
 * How it works:
 * - Counts requests in fixed time windows
 * - Resets counter at window boundary
 * - Easy to implement but has edge case issues
 */
export class FixedWindowRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   *
   * @param identifier - Unique identifier (IP, user ID, API key)
   * @returns Rate limit result
   */
  public check(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // No existing record or window expired
    if (!record || now >= record.resetTime) {
      const resetTime = now + this.config.windowMs;
      this.requests.set(identifier, {
        count: 1,
        resetTime,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(resetTime),
      };
    }

    // Within current window
    if (record.count < this.config.maxRequests) {
      record.count++;
      return {
        allowed: true,
        remaining: this.config.maxRequests - record.count,
        resetTime: new Date(record.resetTime),
      };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(record.resetTime),
      retryAfter,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  public reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clean up expired entries
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [identifier, record] of this.requests.entries()) {
      if (now >= record.resetTime) {
        this.requests.delete(identifier);
      }
    }
  }
}

/**
 * Sliding Window Rate Limiter
 * More accurate than fixed window
 *
 * How it works:
 * - Tracks individual request timestamps
 * - Counts requests in sliding time window
 * - More memory intensive but no edge cases
 */
export class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   *
   * @param identifier - Unique identifier
   * @returns Rate limit result
   */
  public check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests
    let timestamps = this.requests.get(identifier) || [];

    // Remove expired timestamps (outside current window)
    timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfter = Math.ceil((oldestTimestamp + this.config.windowMs - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(oldestTimestamp + this.config.windowMs),
        retryAfter,
      };
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    // Calculate next reset time (when oldest request expires)
    const oldestTimestamp = Math.min(...timestamps);
    const resetTime = oldestTimestamp + this.config.windowMs;

    return {
      allowed: true,
      remaining: this.config.maxRequests - timestamps.length,
      resetTime: new Date(resetTime),
    };
  }

  /**
   * Reset rate limit for identifier
   */
  public reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clean up old entries
   */
  public cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter((ts) => ts > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validTimestamps);
      }
    }
  }
}

/**
 * Token Bucket Rate Limiter
 * Allows bursts while maintaining average rate
 *
 * How it works:
 * - Bucket holds tokens (capacity)
 * - Tokens refill at constant rate
 * - Each request consumes one token
 * - Allows bursts up to bucket capacity
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private config: TokenBucketConfig;

  constructor(config: TokenBucketConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   *
   * @param identifier - Unique identifier
   * @param tokensRequired - Number of tokens required (default: 1)
   * @returns Rate limit result
   */
  public check(identifier: string, tokensRequired: number = 1): RateLimitResult {
    const now = Date.now();

    // Get or create bucket
    let bucket = this.buckets.get(identifier);
    if (!bucket) {
      bucket = {
        tokens: this.config.capacity,
        lastRefill: now,
      };
      this.buckets.set(identifier, bucket);
    }

    // Refill tokens based on time elapsed
    const timeSinceRefill = now - bucket.lastRefill;
    const tokensToAdd = (timeSinceRefill / this.config.refillInterval) * this.config.refillRate;

    bucket.tokens = Math.min(this.config.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if enough tokens available
    if (bucket.tokens >= tokensRequired) {
      bucket.tokens -= tokensRequired;

      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetTime: new Date(now + this.config.refillInterval),
      };
    }

    // Not enough tokens - calculate retry time
    const tokensNeeded = tokensRequired - bucket.tokens;
    const timeToRefill = (tokensNeeded / this.config.refillRate) * this.config.refillInterval;
    const retryAfter = Math.ceil(timeToRefill / 1000);

    return {
      allowed: false,
      remaining: Math.floor(bucket.tokens),
      resetTime: new Date(now + timeToRefill),
      retryAfter,
    };
  }

  /**
   * Reset bucket for identifier
   */
  public reset(identifier: string): void {
    this.buckets.delete(identifier);
  }

  /**
   * Get current token count
   */
  public getTokenCount(identifier: string): number {
    const bucket = this.buckets.get(identifier);
    if (!bucket) {
      return this.config.capacity;
    }

    // Calculate current tokens with refill
    const now = Date.now();
    const timeSinceRefill = now - bucket.lastRefill;
    const tokensToAdd = (timeSinceRefill / this.config.refillInterval) * this.config.refillRate;

    return Math.min(this.config.capacity, bucket.tokens + tokensToAdd);
  }
}

/**
 * Concurrent Request Limiter
 * Limits number of simultaneous requests
 *
 * Use case: Prevent resource exhaustion from too many concurrent operations
 */
export class ConcurrentRequestLimiter {
  private active: Map<string, number> = new Map();
  private maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Acquire slot for request
   *
   * @param identifier - Unique identifier
   * @returns true if slot acquired, false if limit reached
   */
  public acquire(identifier: string): boolean {
    const current = this.active.get(identifier) || 0;

    if (current >= this.maxConcurrent) {
      return false;
    }

    this.active.set(identifier, current + 1);
    return true;
  }

  /**
   * Release slot after request completes
   *
   * @param identifier - Unique identifier
   */
  public release(identifier: string): void {
    const current = this.active.get(identifier) || 0;
    if (current > 0) {
      this.active.set(identifier, current - 1);
    }
  }

  /**
   * Get current concurrent count
   */
  public getCount(identifier: string): number {
    return this.active.get(identifier) || 0;
  }
}

/**
 * Login Attempt Limiter (with exponential backoff)
 * Special rate limiter for authentication
 *
 * Features:
 * - Progressive delays after failed attempts
 * - Account lockout after threshold
 * - Automatic unlock after timeout
 */
export class LoginAttemptLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> =
    new Map();

  private config = {
    maxAttempts: 5,           // Max failed attempts before lockout
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    resetWindow: 60 * 60 * 1000,     // 1 hour
  };

  /**
   * Check if login attempt is allowed
   *
   * @param identifier - User identifier (username, email, IP)
   * @returns Rate limit result with backoff
   */
  public checkAttempt(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    // No previous attempts
    if (!record) {
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetTime: new Date(now + this.config.resetWindow),
      };
    }

    // Check if account is locked
    if (record.lockedUntil && now < record.lockedUntil) {
      const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(record.lockedUntil),
        retryAfter,
      };
    }

    // Reset if window expired
    if (now - record.lastAttempt > this.config.resetWindow) {
      this.attempts.delete(identifier);
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetTime: new Date(now + this.config.resetWindow),
      };
    }

    // Check attempt count
    if (record.count >= this.config.maxAttempts) {
      // Lock account
      const lockedUntil = now + this.config.lockoutDuration;
      record.lockedUntil = lockedUntil;

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(lockedUntil),
        retryAfter: Math.ceil(this.config.lockoutDuration / 1000),
      };
    }

    // Calculate exponential backoff
    const backoffTime = Math.pow(2, record.count) * 1000; // Exponential: 2^n seconds
    const timeSinceLastAttempt = now - record.lastAttempt;

    if (timeSinceLastAttempt < backoffTime) {
      const retryAfter = Math.ceil((backoffTime - timeSinceLastAttempt) / 1000);
      return {
        allowed: false,
        remaining: this.config.maxAttempts - record.count,
        resetTime: new Date(record.lastAttempt + backoffTime),
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxAttempts - record.count - 1,
      resetTime: new Date(now + this.config.resetWindow),
    };
  }

  /**
   * Record failed login attempt
   *
   * @param identifier - User identifier
   */
  public recordFailure(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, {
        count: 1,
        lastAttempt: now,
      });
    } else {
      record.count++;
      record.lastAttempt = now;
    }
  }

  /**
   * Record successful login (reset attempts)
   *
   * @param identifier - User identifier
   */
  public recordSuccess(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Manually unlock account
   *
   * @param identifier - User identifier
   */
  public unlock(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Example: Comprehensive Rate Limiting Demonstration
 */
export function demonstrateRateLimiting() {
  console.log('\n=== Rate Limiting Example ===\n');

  // =============================================================================
  // Test 1: Fixed Window Rate Limiter
  // =============================================================================
  console.log('Test 1: Fixed Window Rate Limiter');
  console.log('═════════════════════════════════════════════════════════\n');

  const fixedWindow = new FixedWindowRateLimiter({
    maxRequests: 5,
    windowMs: 10000, // 10 seconds
  });

  const clientIP = '192.168.1.100';

  console.log('Simulating API requests (limit: 5 per 10 seconds):\n');
  for (let i = 1; i <= 7; i++) {
    const result = fixedWindow.check(clientIP);
    console.log(`Request ${i}:`);
    console.log(`  Allowed: ${result.allowed}`);
    console.log(`  Remaining: ${result.remaining}`);
    if (result.retryAfter) {
      console.log(`  Retry after: ${result.retryAfter}s`);
    }
    console.log('');
  }

  // =============================================================================
  // Test 2: Sliding Window Rate Limiter
  // =============================================================================
  console.log('Test 2: Sliding Window Rate Limiter');
  console.log('═════════════════════════════════════════════════════════\n');

  const slidingWindow = new SlidingWindowRateLimiter({
    maxRequests: 3,
    windowMs: 5000, // 5 seconds
  });

  const apiKey = 'api_key_123';

  console.log('Simulating API requests (limit: 3 per 5 seconds):\n');
  for (let i = 1; i <= 5; i++) {
    const result = slidingWindow.check(apiKey);
    console.log(`Request ${i}:`);
    console.log(`  Allowed: ${result.allowed}`);
    console.log(`  Remaining: ${result.remaining}`);
    if (result.retryAfter) {
      console.log(`  Retry after: ${result.retryAfter}s`);
    }
    console.log('');
  }

  // =============================================================================
  // Test 3: Token Bucket Rate Limiter
  // =============================================================================
  console.log('Test 3: Token Bucket Rate Limiter');
  console.log('═════════════════════════════════════════════════════════\n');

  const tokenBucket = new TokenBucketRateLimiter({
    capacity: 10,        // 10 tokens max
    refillRate: 2,       // 2 tokens per interval
    refillInterval: 1000, // Every 1 second
  });

  const userId = 'user_456';

  console.log('Simulating requests (capacity: 10, refill: 2/second):\n');

  // Burst of requests
  console.log('Burst of 12 requests:');
  for (let i = 1; i <= 12; i++) {
    const result = tokenBucket.check(userId);
    console.log(`Request ${i}: ${result.allowed ? '✓ Allowed' : '✗ Denied'} (${result.remaining} tokens remaining)`);
  }
  console.log('');

  // =============================================================================
  // Test 4: Concurrent Request Limiter
  // =============================================================================
  console.log('Test 4: Concurrent Request Limiter');
  console.log('═════════════════════════════════════════════════════════\n');

  const concurrentLimiter = new ConcurrentRequestLimiter(3); // Max 3 concurrent

  const session = 'session_789';

  console.log('Simulating concurrent file uploads (max: 3):\n');

  // Start 5 uploads
  for (let i = 1; i <= 5; i++) {
    const acquired = concurrentLimiter.acquire(session);
    console.log(`Upload ${i}: ${acquired ? '✓ Started' : '✗ Rejected (too many concurrent)'}`);
    console.log(`  Active uploads: ${concurrentLimiter.getCount(session)}`);
  }

  console.log('\nCompleting some uploads...\n');

  // Complete 2 uploads
  concurrentLimiter.release(session);
  concurrentLimiter.release(session);
  console.log(`Active uploads: ${concurrentLimiter.getCount(session)}`);

  // Try again
  const retry = concurrentLimiter.acquire(session);
  console.log(`New upload: ${retry ? '✓ Started' : '✗ Rejected'}`);
  console.log(`Active uploads: ${concurrentLimiter.getCount(session)}\n`);

  // =============================================================================
  // Test 5: Login Attempt Limiter (Brute Force Protection)
  // =============================================================================
  console.log('Test 5: Login Attempt Limiter (Brute Force Protection)');
  console.log('═════════════════════════════════════════════════════════\n');

  const loginLimiter = new LoginAttemptLimiter();
  const username = 'john.doe';

  console.log('Simulating failed login attempts:\n');

  for (let attempt = 1; attempt <= 8; attempt++) {
    const result = loginLimiter.checkAttempt(username);

    console.log(`Attempt ${attempt}:`);
    if (result.allowed) {
      console.log('  ✓ Login attempt allowed');
      console.log(`  Remaining attempts: ${result.remaining}`);

      // Simulate failed login
      loginLimiter.recordFailure(username);
    } else {
      console.log('  ✗ Login attempt blocked');
      console.log(`  Retry after: ${result.retryAfter}s`);
    }
    console.log('');
  }

  console.log('Simulating successful login (resets counter):\n');
  loginLimiter.recordSuccess(username);
  const successResult = loginLimiter.checkAttempt(username);
  console.log(`Login attempt: ${successResult.allowed ? '✓ Allowed' : '✗ Blocked'}`);
  console.log(`Remaining attempts: ${successResult.remaining}\n`);

  // =============================================================================
  // Best Practices Summary
  // =============================================================================
  console.log('═════════════════════════════════════════════════════════');
  console.log('Rate Limiting Best Practices:');
  console.log('═════════════════════════════════════════════════════════');
  console.log('Algorithm Selection:');
  console.log('  • Fixed Window: Simple, memory efficient (edge cases)');
  console.log('  • Sliding Window: Accurate, no edge cases (more memory)');
  console.log('  • Token Bucket: Allows bursts, smooth rate (good for APIs)');
  console.log('  • Concurrent Limit: Resource protection (uploads, connections)');
  console.log('');
  console.log('Implementation:');
  console.log('  ✓ Rate limit at multiple layers (CDN, API, auth)');
  console.log('  ✓ Use different limits for different endpoints');
  console.log('  ✓ Rate limit by IP, user, API key, or combination');
  console.log('  ✓ Return 429 status code with Retry-After header');
  console.log('  ✓ Log rate limit violations for monitoring');
  console.log('  ✓ Implement exponential backoff for authentication');
  console.log('  ✓ Use distributed rate limiting (Redis) for scaling');
  console.log('');
  console.log('Security:');
  console.log('  ✓ Protect against brute-force attacks (login, API)');
  console.log('  ✓ Prevent DDoS and resource exhaustion');
  console.log('  ✓ Account lockout after failed login attempts');
  console.log('  ✓ Different limits for authenticated vs anonymous');
  console.log('  ✓ Stricter limits for sensitive operations');
  console.log('');
  console.log('Recommended Limits:');
  console.log('  • Public API: 100 requests/hour');
  console.log('  • Authenticated API: 1000 requests/hour');
  console.log('  • Login attempts: 5/15 minutes');
  console.log('  • Password reset: 3/hour');
  console.log('  • File uploads: 10/day');
  console.log('  • Email sending: 100/day');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('=== Rate Limiting Example Complete ===\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateRateLimiting();
}
