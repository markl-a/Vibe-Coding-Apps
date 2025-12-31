/**
 * JWT Authentication Example
 *
 * This example demonstrates comprehensive JWT token generation and validation
 * following security best practices:
 * - Strong secret key management
 * - Proper token expiration
 * - Secure payload handling
 * - Token verification and validation
 * - Error handling for security scenarios
 *
 * Security Best Practices:
 * 1. Use environment variables for secrets (never hardcode)
 * 2. Implement short-lived access tokens (15-30 minutes)
 * 3. Use refresh tokens for extended sessions
 * 4. Validate all token claims thoroughly
 * 5. Implement token revocation/blacklisting for logout
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Type definitions for JWT payloads
interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

interface TokenPayload extends UserPayload {
  iat: number;  // Issued at
  exp: number;  // Expiration time
  jti: string;  // JWT ID (unique identifier)
}

interface RefreshTokenPayload {
  userId: string;
  tokenFamily: string;  // For token rotation detection
  iat: number;
  exp: number;
}

// Configuration
const JWT_CONFIG = {
  // SECURITY: In production, use environment variables
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'your-256-bit-access-secret-key-change-this',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-256-bit-refresh-secret-key-change-this',

  // Token expiration times
  ACCESS_TOKEN_EXPIRY: '15m',   // 15 minutes - short-lived for security
  REFRESH_TOKEN_EXPIRY: '7d',   // 7 days - longer-lived

  // Algorithm - HS256 is standard for symmetric signing
  ALGORITHM: 'HS256' as const,
};

/**
 * Generate a secure JWT ID (jti) for token uniqueness
 * This helps with token revocation and tracking
 */
function generateJti(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate an access token with user information
 *
 * @param user - User information to embed in token
 * @returns Signed JWT access token
 *
 * SECURITY NOTES:
 * - Keep payload small (avoid sensitive data)
 * - Don't include passwords or secrets
 * - Token is signed but NOT encrypted (readable by anyone)
 */
export function generateAccessToken(user: UserPayload): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.userId,
    email: user.email,
    role: user.role,
    jti: generateJti(),
  };

  // Sign the token with secret and expiration
  const token = jwt.sign(payload, JWT_CONFIG.ACCESS_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    algorithm: JWT_CONFIG.ALGORITHM,
  });

  console.log('✓ Access token generated successfully');
  return token;
}

/**
 * Generate a refresh token for obtaining new access tokens
 *
 * @param userId - User identifier
 * @param tokenFamily - Family ID for rotation detection
 * @returns Signed JWT refresh token
 *
 * SECURITY NOTES:
 * - Refresh tokens should be stored securely (httpOnly cookies)
 * - Implement token rotation: issue new refresh token on use
 * - Detect and revoke token family on suspicious activity
 */
export function generateRefreshToken(userId: string, tokenFamily?: string): string {
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId,
    tokenFamily: tokenFamily || generateJti(), // New family if not provided
  };

  const token = jwt.sign(payload, JWT_CONFIG.REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    algorithm: JWT_CONFIG.ALGORITHM,
  });

  console.log('✓ Refresh token generated successfully');
  return token;
}

/**
 * Verify and decode an access token
 *
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid, expired, or malformed
 *
 * SECURITY NOTES:
 * - Always verify before trusting token data
 * - Handle all error cases explicitly
 * - Check expiration automatically via jwt.verify
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    // Verify signature and expiration in one step
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as TokenPayload;

    console.log('✓ Access token verified successfully');
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('✗ Token has expired');
      throw new Error('Token expired - please refresh');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('✗ Invalid token signature or format');
      throw new Error('Invalid token');
    } else {
      console.error('✗ Token verification failed:', error);
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Verify and decode a refresh token
 *
 * @param token - Refresh token to verify
 * @returns Decoded refresh token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as RefreshTokenPayload;

    console.log('✓ Refresh token verified successfully');
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('✗ Refresh token has expired - please login again');
      throw new Error('Refresh token expired');
    } else {
      console.error('✗ Invalid refresh token');
      throw new Error('Invalid refresh token');
    }
  }
}

/**
 * Decode token without verification (for debugging/inspection only)
 *
 * @param token - JWT token to decode
 * @returns Decoded payload or null
 *
 * WARNING: This does NOT verify the signature!
 * Never use decoded data for authentication/authorization
 * Only use for logging, debugging, or displaying token info
 */
export function decodeTokenUnsafe(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('✗ Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if a token is expired without verifying signature
 * Useful for client-side token refresh logic
 *
 * @param token - JWT token to check
 * @returns true if expired, false if valid
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Token rotation: Issue new tokens when refresh token is used
 * This implements the "refresh token rotation" security pattern
 *
 * @param refreshToken - Current refresh token
 * @returns New access and refresh token pair
 *
 * SECURITY PATTERN:
 * 1. Verify the refresh token
 * 2. Issue new access token
 * 3. Issue new refresh token (same family)
 * 4. Invalidate old refresh token
 * 5. Detect reuse of old tokens (possible theft)
 */
export function rotateTokens(refreshToken: string): { accessToken: string; refreshToken: string } {
  // Verify the refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // In production, check if this token has been used before
  // If yes, it's a security issue - invalidate entire token family
  // (Implement with database/Redis tracking)

  // Generate new access token
  const accessToken = generateAccessToken({
    userId: decoded.userId,
    email: '', // Fetch from database in production
    role: '',  // Fetch from database in production
  });

  // Generate new refresh token with same family
  const newRefreshToken = generateRefreshToken(decoded.userId, decoded.tokenFamily);

  // In production:
  // 1. Store new refresh token
  // 2. Mark old refresh token as used
  // 3. Track usage patterns

  console.log('✓ Tokens rotated successfully');
  return { accessToken, refreshToken: newRefreshToken };
}

/**
 * Example usage demonstrating complete JWT workflow
 */
export function demonstrateJWTWorkflow() {
  console.log('\n=== JWT Authentication Example ===\n');

  // 1. User login - Generate tokens
  console.log('1. User Login:');
  const user: UserPayload = {
    userId: 'user123',
    email: 'user@example.com',
    role: 'admin',
  };

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.userId);

  console.log('   Access Token (first 50 chars):', accessToken.substring(0, 50) + '...');
  console.log('   Refresh Token (first 50 chars):', refreshToken.substring(0, 50) + '...\n');

  // 2. Verify access token (normal API request)
  console.log('2. Verify Access Token:');
  try {
    const verified = verifyAccessToken(accessToken);
    console.log('   User ID:', verified.userId);
    console.log('   Role:', verified.role);
    console.log('   Expires:', new Date(verified.exp * 1000).toISOString() + '\n');
  } catch (error) {
    console.error('   Verification failed:', error);
  }

  // 3. Decode token (inspect only, not for auth)
  console.log('3. Decode Token (Unsafe - Inspection Only):');
  const decoded = decodeTokenUnsafe(accessToken);
  console.log('   Payload:', JSON.stringify(decoded, null, 2) + '\n');

  // 4. Check expiration
  console.log('4. Check Token Expiration:');
  const expired = isTokenExpired(accessToken);
  console.log('   Is Expired:', expired + '\n');

  // 5. Token rotation (refresh flow)
  console.log('5. Token Rotation:');
  try {
    const newTokens = rotateTokens(refreshToken);
    console.log('   New tokens issued successfully');
    console.log('   New Access Token (first 50 chars):', newTokens.accessToken.substring(0, 50) + '...\n');
  } catch (error) {
    console.error('   Rotation failed:', error);
  }

  // 6. Invalid token handling
  console.log('6. Invalid Token Handling:');
  try {
    verifyAccessToken('invalid.token.here');
  } catch (error) {
    console.log('   ✓ Invalid token properly rejected\n');
  }

  console.log('=== JWT Example Complete ===\n');
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateJWTWorkflow();
}
